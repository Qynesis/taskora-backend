import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Like, Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditQueryDto } from './dto/audit-query.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';
import { paginateQuery } from '../../interfaces/paginate-query.util';

// Internal Stripe webhook bookkeeping/idempotency markers (subscription.service.ts,
// subscription-webhook-handler.service.ts) are stored in this same table but are not
// user-facing activity — exclude them from the audit feed.
const INTERNAL_ACTION_PREFIX = 'STRIPE_';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    action: string;
    entityType: string;
    entityId: string;
    actorId?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    const record = this.auditRepository.create({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actor: params.actorId ? ({ id: params.actorId } as any) : null,
      metadata: params.metadata ?? null,
    });
    await this.auditRepository.save(record);
  }

  async findAll(query: AuditQueryDto): Promise<PaginatedResponseDto<AuditLog>> {
    const options = paginateQuery<AuditLog>(query);
    const [data, total] = await this.auditRepository.findAndCount({
      ...options,
      where: { action: Not(Like(`${INTERNAL_ACTION_PREFIX}%`)) } as any,
      relations: ['actor', 'actor.profile'],
    });
    return new PaginatedResponseDto(data, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<AuditLog> {
    const record = await this.auditRepository.findOneBy({ id } as any);
    if (!record) {
      throw new NotFoundException(`Audit log "${id}" not found`);
    }
    return record;
  }
}
