import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['createdAt'])
export class AuditLog extends BaseEntity {
    @ManyToOne(() => User, (u) => u.auditLogs, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'actor_user_id' })
    @Index()
    actor?: User | null;

    @Column({ name: 'action', type: 'varchar', length: 120 })
    action!: string;

    @Column({ name: 'entity_type', type: 'varchar', length: 60 })
    @Index()
    entityType!: string;

    @Column({ name: 'entity_id', type: 'uuid' })
    @Index()
    entityId!: string;

    @Column({ name: 'metadata', type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown> | null;

    @Column({ name: 'ip', type: 'inet', nullable: true })
    ip?: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent?: string | null;
}