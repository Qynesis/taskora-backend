import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PaymentService } from './payment.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionWebhookHandlerService } from '../subscriptions/services/subscription-webhook-handler.service';
import { VerificationService } from '../verification/verification.service';
import { createMockStripeService } from '../../../test/helpers/test-factory';

describe('WebhookController', () => {
  let controller: WebhookController;
  let paymentService: {
    onPaymentCompleted: jest.Mock;
    syncRefundStatus: jest.Mock;
  };
  let stripeService: ReturnType<typeof createMockStripeService>;
  let subscriptionWebhookHandler: {
    isWebhookProcessed: jest.Mock;
    handleCheckoutSessionCompleted: jest.Mock;
    handleInvoicePaid: jest.Mock;
    handleInvoicePaymentFailed: jest.Mock;
    handleSubscriptionUpdated: jest.Mock;
    handleSubscriptionDeleted: jest.Mock;
    markWebhookProcessed: jest.Mock;
  };

  beforeEach(async () => {
    paymentService = {
      onPaymentCompleted: jest.fn().mockResolvedValue(undefined),
      syncRefundStatus: jest.fn().mockResolvedValue(undefined),
    };
    stripeService = createMockStripeService();
    stripeService.handleAccountUpdatedEvent.mockResolvedValue(undefined);
    stripeService.createAndFinalizeJobInvoice.mockResolvedValue({ id: null, number: null, invoice_pdf: null, hosted_invoice_url: null, status: null } as any);
    subscriptionWebhookHandler = {
      isWebhookProcessed:              jest.fn().mockResolvedValue(false),
      handleCheckoutSessionCompleted:  jest.fn().mockResolvedValue(undefined),
      handleInvoicePaid:               jest.fn().mockResolvedValue(undefined),
      handleInvoicePaymentFailed:      jest.fn().mockResolvedValue(undefined),
      handleSubscriptionUpdated:       jest.fn().mockResolvedValue(undefined),
      handleSubscriptionDeleted:       jest.fn().mockResolvedValue(undefined),
      markWebhookProcessed:            jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: PaymentService, useValue: paymentService },
        { provide: StripeService, useValue: stripeService },
        { provide: SubscriptionWebhookHandlerService, useValue: subscriptionWebhookHandler },
        {
          provide: VerificationService,
          useValue: {
            handleIdentitySessionVerified: jest.fn().mockResolvedValue(undefined),
            handleIdentitySessionFailed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw BadRequestException when stripe-signature header is missing', async () => {
    await expect(
      controller.handleStripeWebhook({ rawBody: Buffer.from('x') } as any, ''),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when rawBody is missing', async () => {
    await expect(
      controller.handleStripeWebhook({} as any, 'sig_test'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when signature verification fails', async () => {
    stripeService.verifyWebhookSignature.mockImplementation(() => {
      throw new Error('No signatures found matching');
    });

    await expect(
      controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as any, 'bad_sig'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return { received: true } for an unhandled event type', async () => {
    stripeService.verifyWebhookSignature.mockReturnValue({
      id: 'evt_1',
      type: 'customer.created',
      data: { object: {} as any },
    });

    const result = await controller.handleStripeWebhook(
      { rawBody: Buffer.from('{}') } as any,
      'sig_test',
    );

    expect(result).toEqual({ received: true });
  });

  // ── payment_intent.succeeded ────────────────────────────────────────────────

  it('should process payment_intent.succeeded and call onPaymentCompleted', async () => {
    const mockPaymentIntent = {
      id: 'pi_test',
      amount: 10000,
      application_fee_amount: 1000,
      transfer_data: { amount: 9000 },
      metadata: {
        flow: 'job_payment',
        job_id: 'job-1',
        seeker_user_id: 'seeker-1',
        provider_user_id: 'provider-1',
        tax_gst_amount: '100',
      },
      latest_charge: { id: 'ch_test', transfer: 'tr_test', balance_transaction: 'txn_test' },
    };

    stripeService.verifyWebhookSignature.mockReturnValue({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test', metadata: { flow: 'job_payment' } } },
    });
    stripeService.getLatestCharge.mockResolvedValue(mockPaymentIntent);

    const result = await controller.handleStripeWebhook(
      { rawBody: Buffer.from('{}') } as any,
      'sig_test',
    );

    expect(stripeService.getLatestCharge).toHaveBeenCalledWith('pi_test');
    expect(paymentService.onPaymentCompleted).toHaveBeenCalled();
    expect(result).toEqual({ received: true });
  });

  it('should warn and not emit when chargeId is missing on payment_intent.succeeded', async () => {
    stripeService.verifyWebhookSignature.mockReturnValue({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_no_charge' } },
    });
    stripeService.getLatestCharge.mockResolvedValue({
      id: 'pi_no_charge',
      latest_charge: null,
      metadata: { job_id: 'j1' },
    });

    const result = await controller.handleStripeWebhook(
      { rawBody: Buffer.from('{}') } as any,
      'sig_test',
    );

    expect(paymentService.onPaymentCompleted).not.toHaveBeenCalled();
    expect(result).toEqual({ received: true });
  });

  describe('payment_intent.succeeded — amount conversion (Stripe cents → dollars)', () => {
    function buildIntent(overrides: object = {}) {
      return {
        id: 'pi_test',
        amount: 10000,
        application_fee_amount: 1000,
        transfer_data: { amount: 9000 },
        metadata: {
          flow: 'job_payment',
          job_id: 'job-1',
          seeker_user_id: 'seeker-1',
          provider_user_id: 'provider-1',
          tax_gst_amount: '100',
        },
        latest_charge: {
          id: 'ch_test',
          transfer: 'tr_test',
          balance_transaction: 'txn_test',
          receipt_url: 'https://receipt.stripe.com/test',
        },
        ...overrides,
      };
    }

    async function emitAndCapture(intent: object) {
      stripeService.verifyWebhookSignature.mockReturnValue({
        id: 'evt_1',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test', metadata: { flow: 'job_payment' } } },
      });
      stripeService.getLatestCharge.mockResolvedValue(intent);
      await controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as any, 'sig_test');
      return paymentService.onPaymentCompleted.mock.calls[0][0] as any;
    }

    it('should divide amount by 100 — 10000 cents → $100', async () => {
      const params = await emitAndCapture(buildIntent());
      expect(params.amount).toBe(100);
    });

    it('should exclude GST from platformFee — (1000 - 100 GST) / 100 → $9', async () => {
      // application_fee_amount (1000c) bundles platform fee + GST; platformFee is the fee alone.
      const params = await emitAndCapture(buildIntent());
      expect(params.platformFee).toBe(9);
    });

    it('should divide providerAmount by 100 — 9000 cents → $90', async () => {
      const params = await emitAndCapture(buildIntent());
      expect(params.providerAmount).toBe(90);
    });

    it('should divide taxGstAmmount by 100 — "100" cents → $1', async () => {
      const params = await emitAndCapture(buildIntent());
      expect(params.taxGstAmmount).toBe(1);
    });

    it('should default to 0 when application_fee_amount and tax metadata are both missing', async () => {
      const params = await emitAndCapture(buildIntent({
        application_fee_amount: null,
        metadata: {
          flow: 'job_payment',
          job_id: 'job-1',
          seeker_user_id: 'seeker-1',
          provider_user_id: 'provider-1',
        },
      }));
      expect(params.platformFee).toBe(0);
      expect(params.taxGstAmmount).toBe(0);
    });

  });

  // ── account.updated ─────────────────────────────────────────────────────────

  it('should call handleAccountUpdatedEvent on account.updated', async () => {
    const accountObj = { id: 'acct_test', object: 'account' };
    stripeService.verifyWebhookSignature.mockReturnValue({
      id: 'evt_acct',
      type: 'account.updated',
      data: { object: accountObj },
    });

    const result = await controller.handleStripeWebhook(
      { rawBody: Buffer.from('{}') } as any,
      'sig_test',
    );

    expect(stripeService.handleAccountUpdatedEvent).toHaveBeenCalledWith(accountObj);
    expect(result).toEqual({ received: true });
  });

  // ── charge.refunded ─────────────────────────────────────────────────────────

  it('should sync refund status on charge.refunded', async () => {
    stripeService.verifyWebhookSignature.mockReturnValue({
      id: 'evt_ref',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_test',
          refunds: { data: [{ id: 're_test', status: 'succeeded' }] },
        },
      },
    });

    const result = await controller.handleStripeWebhook(
      { rawBody: Buffer.from('{}') } as any,
      'sig_test',
    );

    expect(paymentService.syncRefundStatus).toHaveBeenCalledWith('re_test', 'succeeded');
    expect(result).toEqual({ received: true });
  });

  it('should not call syncRefundStatus when charge has no refunds', async () => {
    stripeService.verifyWebhookSignature.mockReturnValue({
      id: 'evt_ref',
      type: 'charge.refunded',
      data: { object: { id: 'ch_test', refunds: { data: [] } } },
    });

    await controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as any, 'sig_test');

    expect(paymentService.syncRefundStatus).not.toHaveBeenCalled();
  });

  // ── subscription events (queue dispatch) ────────────────────────────────────

  describe('subscription events — dispatched to handler', () => {
    const eventToHandler: Record<string, string> = {
      'invoice.paid':                   'handleInvoicePaid',
      'invoice.payment_failed':         'handleInvoicePaymentFailed',
      'customer.subscription.updated':  'handleSubscriptionUpdated',
      'customer.subscription.deleted':  'handleSubscriptionDeleted',
    };

    Object.entries(eventToHandler).forEach(([eventType, handlerMethod]) => {
      it(`should call ${handlerMethod} for ${eventType}`, async () => {
        stripeService.verifyWebhookSignature.mockReturnValue({
          id: 'evt_sub',
          type: eventType,
          data: { object: { id: 'sub_test' } },
        });

        const result = await controller.handleStripeWebhook(
          { rawBody: Buffer.from('{}') } as any,
          'sig_test',
        );

        expect(subscriptionWebhookHandler[handlerMethod as keyof typeof subscriptionWebhookHandler]).toHaveBeenCalledWith({ id: 'sub_test' });
        expect(result).toEqual({ received: true });
      });
    });

    it('should pass invoice object (including subscription field) to handleInvoicePaid', async () => {
      stripeService.verifyWebhookSignature.mockReturnValue({
        id: 'evt_inv',
        type: 'invoice.paid',
        data: { object: { id: 'in_test', subscription: 'sub_123' } },
      });

      await controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as any, 'sig_test');

      expect(subscriptionWebhookHandler.handleInvoicePaid).toHaveBeenCalledWith(
        expect.objectContaining({ subscription: 'sub_123' }),
      );
    });

    it('should call handleCheckoutSessionCompleted for checkout.session.completed (subscription mode)', async () => {
      stripeService.verifyWebhookSignature.mockReturnValue({
        id: 'evt_co',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test', mode: 'subscription' } },
      });

      const result = await controller.handleStripeWebhook(
        { rawBody: Buffer.from('{}') } as any,
        'sig_test',
      );

      expect(subscriptionWebhookHandler.handleCheckoutSessionCompleted).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'subscription' }),
      );
      expect(result).toEqual({ received: true });
    });

    it('should NOT call handleCheckoutSessionCompleted for checkout.session.completed (setup mode)', async () => {
      stripeService.verifyWebhookSignature.mockReturnValue({
        id: 'evt_setup',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_setup', mode: 'setup', setup_intent: 'seti_test' } },
      });
      stripeService.retrieveSetupIntent.mockResolvedValue({
        payment_method: null,
        metadata: {},
      });

      await controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as any, 'sig_test');

      expect(subscriptionWebhookHandler.handleCheckoutSessionCompleted).not.toHaveBeenCalled();
    });
  });

  // ── error propagation ───────────────────────────────────────────────────────

  it('should throw InternalServerErrorException when subscription handler fails', async () => {
    stripeService.verifyWebhookSignature.mockReturnValue({
      id: 'evt_err',
      type: 'invoice.paid',
      data: { object: { id: 'in_err' } },
    });
    subscriptionWebhookHandler.handleInvoicePaid.mockRejectedValue(new Error('Redis connection refused'));

    await expect(
      controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as any, 'sig_test'),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
