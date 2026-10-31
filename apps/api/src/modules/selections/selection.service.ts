import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Selection } from '../../database/entities/selection.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { CreateSelectionDto } from './dto/create-selection.dto';
import { UpdateSelectionDto } from './dto/update-selection.dto';
import { SelectionQueryDto } from './dto/selection-query.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { paginateQuery } from '../../interfaces/paginate-query.util';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { SelectionCreatedEvent } from './events/selection-created.event';
import { BidStatusChangedEvent } from '../bids/events/bid-status-changed.event';
import { BidStatus, JobStatus, PaymentStatus, ServiceDuration } from '../../database/common/enum';
import { AppCacheService } from '../../cache/cache.service';
import { money } from '../../interfaces/money.util';
import { PlatformFeeService } from '../platform-fee/platform-fee.service';

@Injectable()
export class SelectionService {
  constructor(
    @InjectRepository(Selection)
    private readonly selectionRepository: Repository<Selection>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly txHelper: TransactionHelper,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly cacheService: AppCacheService,
    private readonly platformFeeService: PlatformFeeService,
  ) {}

  async create(dto: CreateSelectionDto, seekerId: string, jobId: string): Promise<Selection> {
    let selectedProviderId = '';
    let declinedProviderIds: string[] = [];

    const entity = await this.txHelper.run(async (qr) => {
      const bid = await qr.manager.findOne(Bid, {
        where: { id: dto.bidId },
        relations: ['job', 'job.seeker', 'provider'],
      });

      if (!bid) {
        throw new NotFoundException(`Bid "${dto.bidId}" not found`);
      }
      if (bid.job.id !== jobId) {
        throw new BadRequestException('Bid does not belong to this job');
      }
      if (bid.job.seeker.id !== seekerId) {
        throw new ForbiddenException('Only the job seeker can select a provider');
      }
      if (bid.job.status !== JobStatus.BIDDING) {
        throw new BadRequestException('A provider has already been selected for this job');
      }
      if (bid.status !== BidStatus.SUBMITTED) {
        throw new BadRequestException('Bid is not available for selection');
      }

      selectedProviderId = bid.provider.id;

      // Load declined bids before bulk-updating so we can emit per-provider events
      const declinedBids = await qr.manager.find(Bid, {
        where: { job: { id: jobId }, id: Not(bid.id), status: BidStatus.SUBMITTED } as any,
        relations: { provider: true },
      });
      declinedProviderIds = declinedBids.map((b) => b.provider.id);

      // Mark selected bid as ACCEPTED
      await qr.manager.update(Bid, { id: bid.id }, { status: BidStatus.ACCEPTED });

      // Decline all other submitted bids for this job
      await qr.manager.update(
        Bid,
        { job: { id: jobId }, id: Not(bid.id), status: BidStatus.SUBMITTED },
        { status: BidStatus.DECLINED },
      );

      // Create the selection record
      const selection = qr.manager.create(Selection, {
        job: { id: jobId },
        bid: { id: bid.id },
        provider: { id: bid.provider.id },
        selectedBy: { id: seekerId },
      });
      const saved = await qr.manager.save(Selection, selection);

      // Update job snapshot
      await qr.manager.update(Job, { id: jobId }, {
        status: JobStatus.SELECTED,
        provider: { id: bid.provider.id },
        selectedBid: { id: bid.id },
        selectedAt: new Date(),
      });

      // Create a pending Payment record representing the total contract commitment.
      // - Single-task: PENDING → SUCCEEDED after PaymentIntent webhook
      // - Subscription: PENDING → SUCCEEDED after all billing cycles complete.
      //   amount = bid.price (total contract value) — never accumulated; per-cycle
      //   amounts live in Transaction rows.
      const isSubscription = bid.job.serviceDuration !== ServiceDuration.SINGLE_TASK;
      const totalAmount = money(bid.price);
      // The Payment row is the tax-free deal: original price + how it splits (platform/provider).
      // GST and the actual charged amounts are per-movement facts on the Transaction ledger.
      const feeSplit = await this.platformFeeService.splitAmount(totalAmount);
      const payment = qr.manager.create(Payment, {
        job: { id: jobId },
        seeker: { id: seekerId },
        provider: { id: bid.provider.id },
        amount: totalAmount,
        platformFee: feeSplit.platformFee,
        providerAmount: feeSplit.providerAmount,
        currency: bid.currency,
        status: PaymentStatus.PENDING,
        isSubscription,
        ...(feeSplit.configId ? { feeConfig: { id: feeSplit.configId } } : {}),
      });
      await qr.manager.save(Payment, payment);

      return saved;
    });

    this.eventEmitter.emit(new SelectionCreatedEvent(entity.id, 'Selection created with ID: ' + entity.id, seekerId));

    this.eventEmitter.emit(
      new BidStatusChangedEvent(dto.bidId, jobId, '', selectedProviderId, BidStatus.SUBMITTED, BidStatus.ACCEPTED, seekerId),
    );
    for (const providerId of declinedProviderIds) {
      this.eventEmitter.emit(
        new BidStatusChangedEvent('', jobId, '', providerId, BidStatus.SUBMITTED, BidStatus.DECLINED, seekerId),
      );
    }

    // Invalidate provider-side caches that the decorator cannot reach (provider ID
    // is only known after the transaction, not from the HTTP request object).
    const affectedProviderIds = [selectedProviderId, ...declinedProviderIds];
    await Promise.all(
      affectedProviderIds.flatMap((pid) => [
        this.cacheService.delByPrefix(`jobs:my-requests:${pid}:`),
        this.cacheService.delByPrefix(`bids:my:${pid}:`),
        this.cacheService.del(`jobs:my-services-counts:${pid}`),
      ]),
    );

    return entity;
  }

}
