import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { StripeService } from '../stripe/stripe.service';
import { CardAddedEvent } from './events/card-added.event';
import { PaymentCompletedInterface } from './interfaces/payment-completed.inteface';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { WebhookProcessedResponseDto } from './dto/webhook-response.dto';
import { SubscriptionWebhookHandlerService } from '../subscriptions/services/subscription-webhook-handler.service';
import { VerificationService } from '../verification/verification.service';

@SkipThrottle() // Stripe delivery IPs must not be rate-limited
@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
    private readonly subscriptionWebhookHandler: SubscriptionWebhookHandlerService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Stripe webhook processed successfully')
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  @ApiResponse({ status: 200, description: 'Webhook processed', type: WebhookProcessedResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
  @ApiExcludeEndpoint() // hide from public Swagger docs
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // rawBody is populated by NestFactory.create({ rawBody: true }) in main.ts.
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    let event: ReturnType<typeof this.stripeService.verifyWebhookSignature>;

    try {
      event = this.stripeService.verifyWebhookSignature(rawBody.toString('utf8'), signature);
    } catch (error) {
      this.logger.warn(`Webhook signature verification failed: ${(error as Error).message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${(error as Error).message}`);
    }

    this.logger.log(`Stripe webhook received: type=${event.type}, id=${event.id}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntentFromEvent = event.data.object as any;

            // Only process payment intents we created for single-task job payments.
            // Subscription invoice payment intents are handled by invoice.paid — they have
            // no flow metadata because metadata is set on subscription_data, not the intent.
            if (paymentIntentFromEvent.metadata?.flow !== 'job_payment') {
                this.logger.debug(
                    `payment_intent.succeeded flow="${paymentIntentFromEvent.metadata?.flow ?? 'none'}" — not a job_payment, skipping`,
                );
                break;
            }

            const paymentIntent = await this.stripeService.getLatestCharge(paymentIntentFromEvent.id);

            const charge = paymentIntent.latest_charge as any | null;
            const chargeId = charge ? charge.id : null;

            if (paymentIntent.id && chargeId && paymentIntent.metadata) {
                // Create a standalone Stripe Invoice and mark it paid out-of-band.
                // invoice_creation on checkout sessions is incompatible with transfer_data
                // (Stripe Connect), so we create the invoice post-payment instead.
                // Non-fatal: payment record is created even if invoice generation fails.
                let invoiceId: string | null = null;
                let invoiceNumber: string | null = null;
                let hostedInvoiceUrl: string | null = null;

                const customerId = typeof paymentIntent.customer === 'string'
                    ? paymentIntent.customer
                    : (paymentIntent.customer as any)?.id ?? null;

                if (customerId && paymentIntent.metadata?.job_id) {
                    try {
                        const totalCents = paymentIntent.amount ?? 0;
                        // application_fee = platform fee + GST; the invoice's fee line must exclude GST.
                        const gstCents = Number(paymentIntent.metadata.tax_gst_amount ?? 0);
                        const feeCents = Math.max((paymentIntent.application_fee_amount ?? 0) - gstCents, 0);
                        // Provider portion is the remainder so the three lines always sum to the total.
                        const serviceCents = totalCents - feeCents - gstCents;
                        const feePercent = paymentIntent.metadata.platform_charge_percent
                            ? Number(paymentIntent.metadata.platform_charge_percent)
                            : null;

                        const invoice = await this.stripeService.createAndFinalizeJobInvoice(
                            customerId,
                            paymentIntent.metadata.job_id,
                            paymentIntent.id,
                            { serviceCents, feeCents, gstCents, feePercent },
                            { currency: 'aud', jobRef: paymentIntent.metadata.job_ref ?? '', jobTitle: paymentIntent.metadata.job_title ?? '' },
                        );
                        invoiceId = invoice.id;
                        invoiceNumber = invoice.number ?? null;
                        hostedInvoiceUrl = invoice.hosted_invoice_url ?? null;
                    } catch (err) {
                        this.logger.warn(
                            `Invoice creation skipped for intent ${paymentIntent.id}: ${(err as Error).message}`,
                        );
                    }
                }

                const amountCents = paymentIntent.amount ?? 0;
                // tax_gst_amount is stamped onto PI metadata by the checkout.session.completed
                // handler above, where Stripe's total_details.amount_tax is available.
                const taxGstCents = Number(paymentIntent.metadata.tax_gst_amount ?? 0);

                const paymentCompletedParams: PaymentCompletedInterface = {
                    jobId: paymentIntent.metadata.job_id,
                    paymentIntentId: paymentIntent.id,
                    chargeId: chargeId,
                    // amount = total charged (job price + GST). The application fee we set at
                    // checkout is platform fee + GST, so the platform's own fee excludes GST,
                    // and the provider gets the charge minus that whole application fee.
                    amount: amountCents / 100,
                    taxGstAmmount: taxGstCents / 100,
                    platformFee: ((paymentIntent.application_fee_amount ?? 0) - taxGstCents) / 100,
                    providerAmount: (amountCents - (paymentIntent.application_fee_amount ?? 0)) / 100,
                    invoiceId,
                    invoiceNumber,
                    hostedInvoiceUrl,
                };

                await this.paymentService.onPaymentCompleted(paymentCompletedParams);

                this.logger.log(`Payment succeeded for intent: ${paymentIntent.id}`);
            } else {
                this.logger.warn(
                    `Invalid payment_intent.succeeded event: missing chargeId or metadata for intent ${paymentIntent.id}`,
                );
            }
            break;
        }

        case 'checkout.session.completed': {
            const session = event.data.object as any;

            if (session.mode === 'setup' && session.setup_intent) {
                const sessionSetupIntentId = typeof session.setup_intent === 'string'
                    ? session.setup_intent
                    : session.setup_intent.id;
                await this.handleSetupIntent(sessionSetupIntentId, 'checkout.session.completed');
            } else if (session.mode === 'subscription') {
                await this.dispatchSubscriptionEvent(event);
            } else if (session.mode === 'payment') {
                // Stamp the actual Stripe-calculated tax onto the payment intent metadata
                // so payment_intent.succeeded can read it instead of deriving it manually.
                const piId = typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id;
                const taxCents: number = session.total_details?.amount_tax ?? 0;
                if (piId && taxCents > 0) {
                    try {
                        await this.stripeService.updatePaymentIntentMetadata(piId, {
                            tax_gst_amount: String(taxCents),
                        });
                    } catch (err) {
                        this.logger.warn(`Could not stamp tax metadata on PI ${piId}: ${(err as Error).message}`);
                    }
                }
            }
            break;
        }

        case 'setup_intent.succeeded': {
            const setupIntentFromEvent = event.data.object as any;
            await this.handleSetupIntent(setupIntentFromEvent.id, 'setup_intent.succeeded');
            break;
        }

        case 'charge.refunded': {
            const refundedCharge = event.data.object as any;
            const latestRefund = refundedCharge.refunds?.data?.[0];
            if (latestRefund?.id) {
                await this.paymentService.syncRefundStatus(latestRefund.id, latestRefund.status);
            }
            break;
        }

        case 'account.updated':
            await this.stripeService.handleAccountUpdatedEvent(event.data.object as any);
            break;

        case 'identity.verification_session.processing': {
            const session = event.data.object as any;
            await this.verificationService.handleIdentitySessionProcessing(session.id);
            this.logger.log(`Identity session processing (provider submitted): ${session.id}`);
            break;
        }

        case 'identity.verification_session.verified': {
            const session = event.data.object as any;
            await this.verificationService.handleIdentitySessionVerified(session.id);
            this.logger.log(`Identity session verified: ${session.id}`);
            break;
        }

        case 'identity.verification_session.requires_input': {
            const session = event.data.object as any;
            await this.verificationService.handleIdentitySessionFailed(session.id);
            this.logger.log(`Identity session requires_input (failed): ${session.id}`);
            break;
        }

        case 'invoice.created':
        case 'invoice.paid':
        case 'invoice.payment_failed':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            await this.dispatchSubscriptionEvent(event);
            break;

        default:
            this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
            break;
      }
    } catch (error) {
      this.logger.error(
        `Error processing Stripe webhook event (${event.type}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to process webhook event: ${(error as Error).message}`,
      );
    }

    return { received: true };
  }

  private async dispatchSubscriptionEvent(event: { id: string; type: string; data: { object: any } }): Promise<void> {
    const obj = event.data.object;

    const isProcessed = await this.subscriptionWebhookHandler.isWebhookProcessed(event.id);
    if (isProcessed) {
      this.logger.debug(`Subscription webhook ${event.id} already processed, skipping`);
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.subscriptionWebhookHandler.handleCheckoutSessionCompleted(obj);
        break;
      case 'invoice.created':
        await this.subscriptionWebhookHandler.handleInvoiceCreated(obj);
        break;
      case 'invoice.paid':
        await this.subscriptionWebhookHandler.handleInvoicePaid(obj);
        break;
      case 'invoice.payment_failed':
        await this.subscriptionWebhookHandler.handleInvoicePaymentFailed(obj);
        break;
      case 'customer.subscription.updated':
        await this.subscriptionWebhookHandler.handleSubscriptionUpdated(obj);
        break;
      case 'customer.subscription.deleted':
        await this.subscriptionWebhookHandler.handleSubscriptionDeleted(obj);
        break;
      default:
        this.logger.debug(`Unhandled subscription webhook type: ${event.type}`);
    }

    await this.subscriptionWebhookHandler.markWebhookProcessed(event.id, event.type, obj?.id ?? '');

    this.logger.debug(`Handled subscription webhook: type=${event.type}, id=${event.id}`);
  }

  private async handleSetupIntent(setupIntentId: string, source: string): Promise<void> {
    const setupIntent = await this.stripeService.retrieveSetupIntent(setupIntentId);

    if (!setupIntent.payment_method) {
      this.logger.warn(`[${source}] No payment_method on setup_intent ${setupIntentId}`);
      return;
    }

    const userId = setupIntent.metadata?.['user_id'];
    if (!userId) {
      this.logger.warn(`[${source}] user_id missing in metadata for setup_intent ${setupIntentId}`);
      return;
    }

    const paymentMethod = setupIntent.payment_method as any;
    const paymentMethodId = typeof paymentMethod === 'string' ? paymentMethod : paymentMethod.id;

    const details = await this.stripeService.getPaymentMethodDetails(paymentMethodId);
    if (!details) {
      this.logger.warn(`[${source}] Could not retrieve payment method details for ${paymentMethodId}`);
      return;
    }

    const cardAddedEvent = new CardAddedEvent(
      userId,
      paymentMethodId,
      setupIntentId,
      details.brand || 'unknown',
      details.last4 || '****',
      details.expMonth || 0,
      details.expYear || 0,
      details.fingerprint ?? null,
    );

    void this.paymentService.emitCardAdded(cardAddedEvent);
    this.logger.log(`[${source}] Card saved for userId="${userId}", paymentMethodId="${paymentMethodId}"`);
  }
}
