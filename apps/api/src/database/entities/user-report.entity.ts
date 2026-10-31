import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { ReportStatus, ReportTargetType, ReportType } from '../common/enum';
import { Job } from './job.entity';
import { Bid } from './bid.entity';
import { Conversation } from './conversation.entity';
import { Payment } from './payment.entity';
@Entity('user_reports')
@Index(['targetType', 'targetId'])
@Index(['status', 'reporter'])
export class UserReport extends BaseEntity {
  // Who reported
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reporter_user_id' })
  @Index()
  reporter!: User;

  // Target
  @Column({ name: 'target_type', type: 'enum', enum: ReportTargetType, enumName: 'report_target_type' })
  targetType!: ReportTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  @Index()
  targetId!: string;

  // Reason details
  @Column({ name: 'report_ref', type: 'varchar', length: 12, unique: true })
  reportRef!: string;

  @Column({ name: 'report_kind', type: 'enum', enum: ReportType, enumName: 'report_type' })
  reportKind!: ReportType;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  // Optional context linking
  @ManyToOne(() => Job, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'job_id' })
  job?: Job | null;

  @ManyToOne(() => Bid, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bid_id' })
  bid?: Bid | null;

  @ManyToOne(() => Conversation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation | null;

@ManyToOne(() => Payment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subject_user_id' })
  subjectUser?: User | null;

  // Admin workflow
  @Column({ name: 'status', type: 'enum', enum: ReportStatus, enumName: 'report_status', default: ReportStatus.PENDING })
  @Index()
  status!: ReportStatus;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;

  @Column({ name: 'dismissed_reason', type: 'text', nullable: true })
  dismissedReason?: string | null;

  @Column({ name: 'warning_message', type: 'text', nullable: true })
  warningMessage?: string | null;

  @Column({ name: 'warned_at', type: 'timestamptz', nullable: true })
  warnedAt?: Date | null;

  @Column({ name: 'suspension_deadline', type: 'timestamptz', nullable: true })
  suspensionDeadline?: Date | null;
}