import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import type { Stripe as StripeCore } from 'stripe/cjs/stripe.core';
import {
  Selection,
  Bid,
  AuditLog,
  Payment,
  Transaction,
  Job,
  JobContract,
  PaymentStatus,
  TransactionType,
  JobStatus,
} from '../../../database';
import { Subscription } from '../../../database/entities/subscription.entity';
import { SubscriptionCancellationRequest } from '../../../database/entities/subscription-cancellation-request.entity';
import { SubscriptionCancellationStatus, SubscriptionStatus } from '../../../database/common/enum';
import { TransactionHelper } from '../../../database/transaction.helper';
import { DomainEventEmitter } from '../../../events/domain-event-emitter.service';
import { StripeService } from '../../stripe/stripe.service';
import { PlatformFeeService } from '../../platform-fee/platform-fee.service';
import { SubscriptionMappingRecord } from '../interfaces/subscription-checkout.interface';
import {
  SubscriptionCreatedFromCheckoutEvent,
  SubscriptionInvoicePaidEvent,
  SubscriptionPaymentFailedEvent,
  SubscriptionEndedEvent,
} from '../events/subscription-payment.events';
import { fromCents, addMonths, getTodayUTC } from '../helpers/amount.helper';
import { money } from '../../../interfaces/money.util';

/** Handles subscription webhook events: checkout.session.completed, invoice.paid,
 *  invoice.payment_failed, customer.subscription.updated/deleted. */
@Injectable()
export class SubscriptionWebhookHandlerService {
  private readonly logger = new Logger(SubscriptionWebhookHandlerService.name);

  constructor(
    @InjectRepository(AuditLog) private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Selection) private readonly selectionRepository: Repository<Selection>,
    @InjectRepository(Bid) private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobContract) private readonly jobContractRepository: Repository<JobContract>,

    private readonly stripeService: StripeService,
    private readonly platformFeeService: PlatformFeeService,
    private readonly txHelper: TransactionHelper,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  // Map a Stripe subscription.status onto our enum; unknown/transitional states fall back to INCOMPLETE.
  private mapStripeSubscriptionStatus(status: string): SubscriptionStatus {
    switch (status) {
      case 'active': return SubscriptionStatus.ACTIVE;
      case 'trialing': return SubscriptionStatus.TRIALING;
      case 'past_due': return SubscriptionStatus.PAST_DUE;
      case 'canceled': return SubscriptionStatus.CANCELED;
      case 'incomplete_expired': return SubscriptionStatus.CANCELED;
      case 'unpaid': return SubscriptionStatus.UNPAID;
      default: return SubscriptionStatus.INCOMPLETE;
    }
  }

  /** Extract invoice/subscription/payment-intent IDs, reading both the legacy top-level fields and the
   *  dahlia (2026-04-22+) nested paths so it survives Stripe API version changes. */
  private extractInvoiceRefs(invoice: any): {
    invoiceId: string | null;
    subscriptionId: string | null;
    paymentIntentId: string | null;
  } {
    const toId = (v: any): string | null => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (typeof v === 'object' && typeof v.id === 'string') return v.id;
      return null;
    };

    const subscriptionId =
      toId(invoice?.subscription) ??
      toId(invoice?.parent?.subscription_details?.subscription) ??
      null;

    const paymentIntentId =
      toId(invoice?.payment_intent) ??
      toId(invoice?.payments?.data?.[0]?.payment?.payment_intent) ??
      null;

    return { invoiceId: invoice?.id ?? null, subscriptionId, paymentIntentId };
  }

  /** Idempotency check — has this webhook event been processed? (jsonb containment, see getSubscriptionMapping). */
  async isWebhookProcessed(stripeEventId: string): Promise<boolean> {
    const count = await this.auditLogRepository
      .createQueryBuilder('al')
      .where('al.action = :action', { action: 'STRIPE_WEBHOOK_PROCESSED' })
      .andWhere('al.metadata @> :meta::jsonb', { meta: JSON.stringify({ stripeEventId }) })
      .getCount();
    return count > 0;
  }

  /** Record a webhook event as processed. */
  async markWebhookProcessed(
    stripeEventId: string,
    eventType: string,
    objectId: string,
    queryRunner?: any,
  ): Promise<void> {
    const record = {
      action: 'STRIPE_WEBHOOK_PROCESSED',
      entityType: 'stripe',
      entityId: randomUUID(),
      metadata: { stripeEventId, type: eventType, objectId },
    };
    if (queryRunner) {
      await queryRunner.manager.save(AuditLog, record);
    } else {
      await this.auditLogRepository.save(record);
    }
  }

  /** Handle checkout.session.completed — store the subscription mapping and stamp the contract's row. */
  async handleCheckoutSessionCompleted(
    session: StripeCore.Checkout.Session,
  ): Promise<void> {
    try {
      const selectionId = session.metadata?.selectionId;
      const durationMonths = parseInt(session.metadata?.durationMonths || '1');
      // numberOfPeriods stored in metadata at checkout creation; fall back to durationMonths for legacy sessions
      const numberOfPeriods = parseInt(session.metadata?.numberOfPeriods || session.metadata?.durationMonths || '1');

      if (!selectionId || !session.subscription) {
        throw new Error('Invalid checkout session metadata or subscription');
      }

      // Retrieve full subscription to get subscription ID
      const subscription = await this.stripeService.getSubscription(
        session.subscription as string,
      );

      await this.txHelper.run(async (qr) => {
        // Load selection with relations
        const selection = await qr.manager.findOne(Selection, {
          where: { id: selectionId },
          relations: ['job', 'bid', 'provider'],
        });

        if (!selection) {
          throw new NotFoundException(`Selection ${selectionId} not found`);
        }

        const createdLog = await qr.manager.findOne(AuditLog, {
          where: { action: 'STRIPE_CHECKOUT_SESSION_CREATED', entityType: 'job', entityId: selection.job.id } as any,
          order: { createdAt: 'DESC' },
        });
        const created = createdLog?.metadata as unknown as Partial<SubscriptionMappingRecord> | undefined;

        // Store subscription mapping in AuditLog
        const mappingRecord: SubscriptionMappingRecord = {
          selectionId,
          subscriptionId: subscription.id,
          checkoutSessionId: session.id,
          stripeCustomerId: session.customer as string,
          durationMonths,
          numberOfPeriods,
          monthlyAmount: created?.monthlyAmount ?? fromCents(session.amount_subtotal || 0),
          installmentAmount: created?.installmentAmount ?? fromCents(session.amount_subtotal || 0),
          totalAmount: created?.totalAmount ?? fromCents(session.amount_total || 0),
          currency: session.currency?.toUpperCase() || 'AUD',
          providerStripeAccountId: subscription.metadata?.providerStripeAccountId || '',
          seekerId: subscription.metadata?.seekerId || '',
          providerId: selection.provider.id,
          jobId: selection.job.id,
        };

        await qr.manager.save(AuditLog, {
          action: 'STRIPE_SUBSCRIPTION_MAPPING',
          entityType: 'selection',
          entityId: selectionId,
          metadata: mappingRecord,
        });

        // Stamp the placeholder Subscription row (created INCOMPLETE at contract time) with the
        // live Stripe identifiers. Without this the row's stripe_subscription_id stays NULL and
        // the job-keyed detail/period/cancel endpoints — and handleSubscriptionDeleted's lookup —
        // can never resolve the subscription.
        const subRow = await qr.manager.findOne(Subscription, {
          where: { job: { id: selection.job.id } },
        });
        if (subRow) {
          const priceItem = subscription.items?.data?.[0]?.price;
          const startUnix =
            (subscription as any).start_date ?? (subscription as any).current_period_start ?? null;
          subRow.stripeSubscriptionId = subscription.id;
          subRow.status = this.mapStripeSubscriptionStatus(subscription.status);
          subRow.stripePriceId = priceItem?.id ?? null;
          subRow.stripeProductId =
            typeof priceItem?.product === 'string' ? priceItem.product : (priceItem?.product?.id ?? null);
          subRow.startDate = startUnix ? new Date(startUnix * 1000).toISOString().slice(0, 10) : null;
          subRow.connectedAccountId = mappingRecord.providerStripeAccountId || null;
          await qr.manager.save(Subscription, subRow);
        } else {
          this.logger.warn(
            `No placeholder Subscription row for job ${selection.job.id}; cannot stamp Stripe id ${subscription.id}`,
          );
        }

        this.logger.log(
          `Subscription mapping stored for selection ${selectionId}: ${subscription.id}`,
        );
      });

      // Emit domain event
      this.eventEmitter.emit(
        new SubscriptionCreatedFromCheckoutEvent(
          selectionId,
          subscription.id,
          session.id,
          durationMonths as 1 | 3,
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle checkout.session.completed: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /** Handle invoice.created — set a dynamic "Installment X of Y" description (fee note on cycle 1 only)
   *  before Stripe finalizes each subscription invoice. Non-fatal. */
  async handleInvoiceCreated(invoice: any): Promise<void> {
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : (invoice.subscription?.id ?? null);

    if (!subscriptionId) return; // standalone invoice (one-time or summary), skip

    try {
      const subscription = await this.stripeService.getSubscription(subscriptionId);
      const meta = subscription.metadata ?? {};

      if (meta['flow'] !== 'job_subscription') return;

      const numberOfPeriods = parseInt(meta['numberOfPeriods'] ?? '1', 10);
      const jobRef = meta['jobRef'] ?? '';
      const jobTitle = meta['jobTitle'] ?? '';
      const installmentAmount = parseFloat(meta['installmentAmount'] ?? '0');
      const totalAmount = installmentAmount * numberOfPeriods;

      const paidCycles = await this.countPaidCycles(subscriptionId);
      const currentCycle = paidCycles + 1;

      const jobLabel = jobRef && jobTitle ? `${jobRef} — ${jobTitle}` : '';
      const totalStr = `${numberOfPeriods} × A$${installmentAmount.toFixed(2)} = A$${totalAmount.toFixed(2)} total`;

      let description: string;
      if (currentCycle === 1) {
        description = [
          `Installment 1 of ${numberOfPeriods}`,
          jobLabel,
          totalStr,
          `A$10.00 Taskora service fee deducted this installment only`,
        ].filter(Boolean).join(' · ');
      } else {
        description = [
          `Installment ${currentCycle} of ${numberOfPeriods}`,
          jobLabel,
          totalStr,
        ].filter(Boolean).join(' · ');
      }

      await this.stripeService.updateInvoiceDescription(invoice.id, description);
      this.logger.log(`invoice.created: set description for ${invoice.id} (cycle ${currentCycle}/${numberOfPeriods})`);
    } catch (err) {
      // Non-fatal — invoice still processes normally, just without the custom description
      this.logger.warn(`invoice.created handler failed for ${invoice.id}: ${(err as Error).message}`);
    }
  }

  /** Handle invoice.paid — create Payment/Transaction ledger entries and auto-cancel after N cycles. */
  async handleInvoicePaid(invoice: any): Promise<void> {
    try {
      let { invoiceId, subscriptionId, paymentIntentId } = this.extractInvoiceRefs(invoice);

      // Stripe's newer billing API omits payment_intent from the raw webhook payload for
      // subscription invoices. Fetch the expanded invoice to get the payment intent and charge IDs.
      if (invoiceId && !paymentIntentId) {
        try {
          const expandedInvoice = await this.stripeService.getInvoice(invoiceId, [
            'payment_intent',
            'charge',
            'payments.data.payment.payment_intent',
          ]);
          // Billing V2: payment_intent lives under payments array; fall back to top-level
          const toId = (v: any): string | null => {
            if (!v) return null;
            if (typeof v === 'string') return v;
            if (typeof v === 'object' && typeof v.id === 'string') return v.id;
            return null;
          };
          paymentIntentId =
            toId(expandedInvoice.payment_intent) ??
            toId(expandedInvoice.payments?.data?.[0]?.payment?.payment_intent) ??
            null;
          if (paymentIntentId) {
            invoice = expandedInvoice;
            // Billing V2: invoice.charge may be null even when expanded — fall back to the
            // payment intent's latest_charge field.
            const chargeFromInvoice =
              typeof expandedInvoice.charge === 'string'
                ? expandedInvoice.charge
                : (expandedInvoice.charge?.id ?? null);
            if (!chargeFromInvoice) {
              try {
                const pi = await this.stripeService.getLatestCharge(paymentIntentId);
                const latestCharge = pi.latest_charge;
                const chargeId =
                  typeof latestCharge === 'string' ? latestCharge : (latestCharge?.id ?? null);
                if (chargeId) {
                  invoice = { ...expandedInvoice, charge: chargeId };
                }
              } catch {
                // Non-fatal — charge ID remains null
              }
            }
          }
        } catch {
          // Non-fatal — proceed with null paymentIntentId
        }
      }

      this.logger.log(`handleInvoicePaid: invoiceId=${invoiceId} subscriptionId=${subscriptionId} paymentIntentId=${paymentIntentId}`);

      // One-time payment invoice (invoice_creation enabled on checkout session).
      // The subscription webhook handler is not responsible for these — update the
      // Payment record's invoice fields and return early.
      if (!subscriptionId) {
        await this.handleOneTimeInvoicePaid(invoice);
        return;
      }

      // Resolve selectionId. First try the mapping written by handleCheckoutSessionCompleted
      // (retries account for the race with invoice.paid arriving first). If the mapping
      // never lands (event not subscribed, dropped, or dahlia behavior change), fall back to
      // reading subscription.metadata directly — we set selectionId/jobId there at checkout time.
      // On fallback we also synthesize and persist the mapping so subsequent webhooks are fast.
      let selectionId: string | null = null;
      for (let attempt = 1; attempt <= 5; attempt++) {
        selectionId = await this.getSelectionIdFromSubscription(subscriptionId);
        if (selectionId) break;
        if (attempt < 5) await new Promise((r) => setTimeout(r, 1000 * attempt));
      }

      if (!selectionId) {
        selectionId = await this.recoverSubscriptionMapping(subscriptionId);
      }

      if (!selectionId) {
        throw new Error(`Could not resolve selection for subscription ${subscriptionId} after 5 attempts (and metadata fallback)`);
      }

      // Load selection with relations (job.seeker needed for Transaction.sender)
      const selection = await this.selectionRepository.findOne({
        where: { id: selectionId },
        relations: ['job', 'job.seeker', 'provider'],
      });

      if (!selection) {
        throw new NotFoundException(`Selection ${selectionId} not found`);
      }

      // Check idempotency: has this invoice already been processed?
      // Transaction rows are written atomically with the payment — if one exists, this cycle was already handled.
      const idempotencyWhere: Array<Record<string, string>> = [];
      if (invoiceId) idempotencyWhere.push({ stripeInvoiceId: invoiceId });
      if (paymentIntentId) idempotencyWhere.push({ stripePaymentIntentId: paymentIntentId });

      const existingTxn = idempotencyWhere.length
        ? await this.transactionRepository.findOne({ where: idempotencyWhere as any })
        : null;

      if (existingTxn) {
        this.logger.warn(
          `Invoice ${invoiceId} already processed (txn ${existingTxn.id})`,
        );
        return;
      }

      // Get billing config from subscription mapping (needed for the per-cycle payout split).
      const mappingRecord = await this.getSubscriptionMapping(subscriptionId);
      if (!mappingRecord) {
        throw new Error(`Could not retrieve subscription mapping for ${subscriptionId}`);
      }

      // Per-cycle ledger figures (new model). The seeker pays installment + a GST-inclusive fee.
      // The provider receives the full installment; the platform keeps the fee (GST is on the fee
      // only). Reconciles to the charge: payout + platformFee(net) + GST = amount_paid.
      const amountCents = invoice.amount_paid;
      const amount = fromCents(amountCents);
      const cycleGst = fromCents(invoice.tax ?? 0);
      const providerPayout = money(mappingRecord.installmentAmount ?? (amount - cycleGst));
      const platformFee = money(amount - providerPayout - cycleGst);

      // numberOfPeriods accounts for paymentFrequency (e.g. weekly 3-month job = 12 periods)
      const numberOfPeriods = mappingRecord.numberOfPeriods ?? mappingRecord.durationMonths;

      // Count cycles paid so far BEFORE this invoice, then add 1 for the current one.
      // Counting before avoids read-committed isolation issues inside the transaction.
      const paidCyclesBefore = await this.countPaidCycles(subscriptionId);
      const paidCycles = paidCyclesBefore + 1;
      const isLastCycle = paidCycles >= numberOfPeriods;

      // The webhook event's invoice object already contains all the fields we need.
      // Avoid a redundant getInvoice() call that would fail in the dahlia API
      // due to unsupported expand parameters.
      const invoiceNumber: string | null = invoice.number ?? null;
      const hostedInvoiceUrl: string | null = invoice.hosted_invoice_url ?? null;

      await this.txHelper.run(async (qr) => {
        // Payment row is created at selection time (selection.service.ts).
        // This find is a safety net in case it is missing for any reason.
        let contractPayment = await qr.manager.findOne(Payment, {
          where: { job: { id: selection.job.id } },
          order: { createdAt: 'ASC' },
        });

        const totalJobAmount = mappingRecord.totalAmount ?? amount;
        const currency = (invoice.currency as string).toUpperCase();
        const contractSplit = await this.platformFeeService.splitAmount(totalJobAmount);

        if (!contractPayment) {
          contractPayment = (await qr.manager.save(Payment, {
            job: { id: selection.job.id },
            seeker: { id: selection.job.seeker.id },
            provider: { id: selection.provider.id },
            amount: totalJobAmount,
            platformFee: contractSplit.platformFee,
            providerAmount: contractSplit.providerAmount,
            currency,
            status: PaymentStatus.PENDING,
            method: 'stripe',
            feeConfig: contractSplit.configId ? { id: contractSplit.configId } : null,
            hostedInvoiceUrl,
          } as any)) as Payment;

          this.logger.log(`Created Payment record ${contractPayment.id} for subscription job ${selection.job.id}`);
        }

        // Create a per-cycle Transaction record for the full audit trail
        const jobRef = (selection.job as any).jobRef ?? '';
        const jobTitle = (selection.job as any).title ?? '';
        const txn = qr.manager.create(Transaction, {
          txnRef: `SUB-${subscriptionId}-${Date.now()}`,
          type: TransactionType.PAYMENT,
          sender: { id: selection.job.seeker.id } as any,
          payment: contractPayment,
          amount,
          currency,
          stripeInvoiceId: invoiceId ?? null,
          stripeSubscriptionId: subscriptionId,
          stripePaymentIntentId: paymentIntentId ?? null,
          stripeChargeId: typeof invoice.charge === 'string' ? invoice.charge : (invoice.charge?.id ?? null),
          platformFee,
          providerPayout,
          taxGstAmmount: cycleGst,
          invoiceNumber: invoiceNumber ?? null,
          hostedInvoiceUrl: hostedInvoiceUrl ?? null,
          description: `Installment ${paidCycles} of ${numberOfPeriods}${jobRef ? ` — ${jobRef}` : ''}${jobTitle ? ` · ${jobTitle}` : ''}`,
        });
        await qr.manager.save(Transaction, txn);

        // Payment row holds the total contract commitment (bid.price) and is never accumulated.
        // Per-cycle amount, platform fee, provider payout and GST all live on the Transaction
        // row created above — the contract-level Payment only tracks identity + status.
        const updates: Partial<Payment> = {
          currency,
          method: 'stripe',
          hostedInvoiceUrl,
        };

        if (isLastCycle) {
          updates.status = PaymentStatus.SUCCEEDED;
          this.logger.log(
            `Payment ${contractPayment.id} completed — all ${numberOfPeriods} cycles paid for subscription ${subscriptionId}`,
          );
        }

        await qr.manager.save(Payment, { ...contractPayment, ...updates });

        this.logger.log(
          `Recorded cycle ${paidCycles}/${numberOfPeriods} for subscription ${subscriptionId}, invoice ${invoiceId}`,
        );

        // After all cycles are paid, schedule subscription cancellation at period end
        if (isLastCycle) {
          await this.stripeService.cancelSubscriptionAtPeriodEnd(subscriptionId);

          await qr.manager.save(AuditLog, {
            action: 'STRIPE_CANCEL_AT_PERIOD_END_SET',
            entityType: 'selection',
            entityId: selectionId,
            metadata: { subscriptionId, paidCycles, numberOfPeriods },
          });

          this.logger.log(
            `Subscription ${subscriptionId} scheduled for cancellation after period end (${paidCycles}/${numberOfPeriods} cycles)`,
          );
        }

        // Emit domain event
        this.eventEmitter.emit(
          new SubscriptionInvoicePaidEvent(
            selectionId,
            invoiceId ?? '',
            contractPayment?.id ?? '',
            amount,
            providerPayout,
            paidCycles,
            numberOfPeriods,
          ),
        );
      });

      // No post-first-cycle transfer switch: the service fee is now a per-cycle line item, so the
      // provider receives the full installment every cycle at a constant transfer percent.

      // On the last cycle, generate a consolidated summary invoice for the full contract.
      // This is the single document both seeker and provider reference as proof of payment.
      if (isLastCycle && mappingRecord.stripeCustomerId) {
        try {
          // Reconcile to what the seeker ACTUALLY paid: the summary equals the sum of every cycle
          // (installment + GST-inclusive fee) × numberOfPeriods — not the rounded contract total —
          // so the final document ties out exactly to the per-cycle invoices.
          const { platformCharge } = await this.platformFeeService.getCharge();
          const installmentAmt = mappingRecord.installmentAmount ?? amount;
          const installmentCents = Math.round(installmentAmt * 100);
          const perCycleFeeCents = Math.round(money(installmentAmt * (platformCharge / 100)) * 100);
          const serviceCents = installmentCents * numberOfPeriods;
          const grossFeeCents = perCycleFeeCents * numberOfPeriods;
          const gstCents = Math.round(grossFeeCents / 11);
          const feeCents = grossFeeCents - gstCents;
          const installmentDollars = installmentAmt.toFixed(2);
          const freqLabel = `${numberOfPeriods} installments of A$${installmentDollars}`;

          // Date range spanning the whole contract (first cycle start → last cycle end), derived from
          // the current (last) cycle's billing period so it reflects the real cycle length.
          const lastPeriod = (invoice as any).lines?.data?.[0]?.period;
          let periodStart: number | undefined;
          let periodEnd: number | undefined;
          if (lastPeriod?.start && lastPeriod?.end) {
            const cycleSeconds = lastPeriod.end - lastPeriod.start;
            periodEnd = lastPeriod.end;
            periodStart = lastPeriod.end - numberOfPeriods * cycleSeconds;
          }

          const summaryInvoice = await this.stripeService.createAndFinalizeJobInvoice(
            mappingRecord.stripeCustomerId,
            selection.job.id,
            subscriptionId,
            { serviceCents, feeCents, gstCents, feePercent: platformCharge },
            {
              currency: invoice.currency ?? 'aud',
              jobRef: (selection.job as any).jobRef ?? '',
              jobTitle: (selection.job as any).title ?? '',
              installmentNote: freqLabel,
              ...(periodStart && periodEnd ? { periodStart, periodEnd } : {}),
            },
          );

          await this.paymentRepository.update(
            { job: { id: selection.job.id } },
            { hostedInvoiceUrl: summaryInvoice.hosted_invoice_url ?? null } as any,
          );

          this.logger.log(`Consolidated summary invoice created for job ${selection.job.id}: ${summaryInvoice.id}`);
        } catch (err) {
          this.logger.warn(`Summary invoice creation skipped for job ${selection.job.id}: ${(err as Error).message}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle invoice.paid: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /** Handle invoice.payment_failed — record the failure and emit the failure event. */
  async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    try {
      const { subscriptionId } = this.extractInvoiceRefs(invoice);
      if (!subscriptionId) {
        throw new Error('Invoice missing subscription ID');
      }

      const selectionId = await this.getSelectionIdFromSubscription(subscriptionId);
      if (!selectionId) {
        this.logger.warn(
          `Could not resolve selection for subscription ${subscriptionId}`,
        );
        return;
      }

      await this.txHelper.run(async (qr) => {
        await qr.manager.save(AuditLog, {
          action: 'STRIPE_INVOICE_PAYMENT_FAILED',
          entityType: 'selection',
          entityId: selectionId,
          metadata: {
            subscriptionId,
            invoiceId: invoice.id,
            amount: fromCents(invoice.amount_due),
          },
        });
      });

      this.eventEmitter.emit(
        new SubscriptionPaymentFailedEvent(
          selectionId,
          invoice.id,
          fromCents(invoice.amount_due),
          invoice.hosted_invoice_url ?? null,
        ),
      );

      this.logger.warn(
        `Payment failed for invoice ${invoice.id} on subscription ${subscriptionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle invoice.payment_failed: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /** Handle customer.subscription.updated — sync the row's status with Stripe. */
  async handleSubscriptionUpdated(subscription: any): Promise<void> {
    try {
      const subscriptionId = subscription.id;
      const selectionId = await this.getSelectionIdFromSubscription(subscriptionId);

      if (!selectionId) {
        this.logger.warn(
          `Could not resolve selection for subscription ${subscriptionId}`,
        );
        return;
      }

      await this.txHelper.run(async (qr) => {
        // Keep the Subscription row's status in sync with Stripe (no-op if never stamped).
        await qr.manager.update(
          Subscription,
          { stripeSubscriptionId: subscriptionId },
          { status: this.mapStripeSubscriptionStatus(subscription.status) },
        );

        await qr.manager.save(AuditLog, {
          action: 'STRIPE_SUBSCRIPTION_STATUS_SYNC',
          entityType: 'selection',
          entityId: selectionId,
          metadata: {
            subscriptionId,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000),
          },
        });
      });

      this.logger.debug(
        `Subscription ${subscriptionId} status updated: ${subscription.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle subscription.updated: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /** Handle customer.subscription.deleted — finalize the subscription and job (completed vs cancelled). */
  async handleSubscriptionDeleted(subscription: any): Promise<void> {
    try {
      const subscriptionId = subscription.id;
      const selectionId = await this.getSelectionIdFromSubscription(subscriptionId);

      if (!selectionId) {
        this.logger.warn(
          `Could not resolve selection for subscription ${subscriptionId}`,
        );
        return;
      }

      const mappingRecord = await this.getSubscriptionMapping(subscriptionId);
      if (!mappingRecord) {
        throw new Error(`Could not retrieve subscription mapping for ${subscriptionId}`);
      }

      const durationMonths = mappingRecord.durationMonths;
      const paidCycles = await this.countPaidCycles(subscriptionId);

      const outcome = paidCycles >= durationMonths ? 'completed' : 'cancelled';

      await this.txHelper.run(async (qr) => {
        // Load selection with job
        const selection = await qr.manager.findOne(Selection, {
          where: { id: selectionId },
          relations: ['job'],
        });

        if (selection) {
          // Update job status (final state)
          const job = selection.job;
          job.status = outcome === 'completed' ? JobStatus.COMPLETED : JobStatus.CANCELLED;
          await qr.manager.save(Job, job);

          // If cancelled early, flip the contract-level Payment to CANCELED so the
          // UI shows it as cancelled rather than perpetually pending.
          if (outcome === 'cancelled') {
            const pendingPayment = await qr.manager.findOne(Payment, {
              where: { job: { id: job.id }, status: PaymentStatus.PENDING },
            });
            if (pendingPayment) {
              await qr.manager.save(Payment, {
                ...pendingPayment,
                status: PaymentStatus.CANCELED,
              });
            }
          }
        }

        // Finalize any pending seeker cancellation request for this subscription (14-day
        // notice period reached → PROCESSED).
        const subRow = await qr.manager.findOne(Subscription, {
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (subRow) {
          // Subscription has ended on Stripe — reflect the terminal state on the row.
          subRow.status = SubscriptionStatus.CANCELED;
          subRow.endDate = new Date().toISOString().slice(0, 10);
          await qr.manager.save(Subscription, subRow);

          await qr.manager.update(
            SubscriptionCancellationRequest,
            { subscription: { id: subRow.id }, status: SubscriptionCancellationStatus.PENDING },
            { status: SubscriptionCancellationStatus.PROCESSED, processedAt: new Date() },
          );
        }

        // Store audit log
        await qr.manager.save(AuditLog, {
          action: 'STRIPE_SUBSCRIPTION_ENDED',
          entityType: 'selection',
          entityId: selectionId,
          metadata: {
            subscriptionId,
            selectionId,
            paidCycles,
            durationMonths,
            outcome,
          },
        });
      });

      // Emit domain event
      this.eventEmitter.emit(
        new SubscriptionEndedEvent(
          selectionId,
          subscriptionId,
          outcome as 'completed' | 'cancelled',
          paidCycles,
          durationMonths,
        ),
      );

      this.logger.log(
        `Subscription ${subscriptionId} deleted: outcome=${outcome} (${paidCycles}/${durationMonths} cycles)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle subscription.deleted: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /** Retrieve the subscription mapping from AuditLog. Uses jsonb containment (`metadata @> '{...}'`)
   *  because TypeORM's object shorthand generates exact-equality, which won't match the full record. */
  private async getSubscriptionMapping(
    subscriptionId: string,
  ): Promise<SubscriptionMappingRecord | null> {
    const record = await this.auditLogRepository
      .createQueryBuilder('al')
      .where('al.action = :action', { action: 'STRIPE_SUBSCRIPTION_MAPPING' })
      .andWhere('al.metadata @> :meta::jsonb', { meta: JSON.stringify({ subscriptionId }) })
      .orderBy('al.created_at', 'DESC')
      .getOne();

    return (record?.metadata as SubscriptionMappingRecord | undefined) ?? null;
  }

  /** Get selection ID from a subscription, via the mapping. */
  private async getSelectionIdFromSubscription(
    subscriptionId: string,
  ): Promise<string | null> {
    const mapping = await this.getSubscriptionMapping(subscriptionId);
    return mapping?.selectionId || null;
  }

  /** Recovery path: rebuild the mapping from subscription.metadata + the STRIPE_CHECKOUT_SESSION_CREATED
   *  audit log, for when invoice.paid arrives before (or without) checkout.session.completed. */
  private async recoverSubscriptionMapping(subscriptionId: string): Promise<string | null> {
    try {
      const subscription = await this.stripeService.getSubscription(subscriptionId);
      const selectionId = (subscription.metadata?.['selectionId'] as string | undefined) ?? null;
      const jobId = (subscription.metadata?.['jobId'] as string | undefined) ?? null;

      if (!selectionId || !jobId) {
        this.logger.warn(
          `Subscription ${subscriptionId} missing selectionId/jobId in metadata — cannot recover mapping`,
        );
        return null;
      }

      // Pull the pre-checkout config we stored at session creation.
      const created = await this.auditLogRepository.findOne({
        where: {
          action: 'STRIPE_CHECKOUT_SESSION_CREATED',
          entityType: 'job',
          entityId: jobId,
        } as any,
        order: { createdAt: 'DESC' },
      });

      if (!created?.metadata) {
        this.logger.warn(
          `No STRIPE_CHECKOUT_SESSION_CREATED audit log for job ${jobId} — cannot synthesize mapping for ${subscriptionId}`,
        );
        return null;
      }

      const mapping: SubscriptionMappingRecord = {
        ...(created.metadata as unknown as SubscriptionMappingRecord),
        subscriptionId,
      };

      await this.auditLogRepository.save({
        action: 'STRIPE_SUBSCRIPTION_MAPPING',
        entityType: 'selection',
        entityId: selectionId,
        metadata: mapping as unknown as Record<string, unknown>,
      } as any);

      this.logger.warn(
        `Recovered subscription mapping for ${subscriptionId} via fallback (selection=${selectionId}, job=${jobId})`,
      );
      return selectionId;
    } catch (err) {
      this.logger.error(
        `Mapping recovery failed for subscription ${subscriptionId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /** Handle invoice.paid for a one-time job payment (no subscription) — save the hosted invoice URL
   *  onto the Payment so the seeker can access the PDF. */
  private async handleOneTimeInvoicePaid(invoice: any): Promise<void> {
    const { paymentIntentId } = this.extractInvoiceRefs(invoice);

    if (!paymentIntentId) {
      this.logger.debug(`One-time invoice ${invoice.id} has no payment_intent — skipping`);
      return;
    }

    const txn = await this.transactionRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: ['payment'],
    });
    const payment = txn?.payment ?? null;

    if (!payment) {
      this.logger.debug(`No payment record for payment_intent ${paymentIntentId} (invoice ${invoice.id})`);
      return;
    }

    await this.paymentRepository.save({
      ...payment,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    });

    this.logger.log(`One-time invoice ${invoice.id} hostedInvoiceUrl saved to payment ${payment.id}`);
  }

  /** Count successful billing cycles in the transactions ledger (indexed by stripe_subscription_id). */
  private async countPaidCycles(subscriptionId: string): Promise<number> {
    return this.transactionRepository.count({
      where: { stripeSubscriptionId: subscriptionId } as any,
    });
  }
}
