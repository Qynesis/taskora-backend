import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { UserReport } from './user-report.entity';
import { NotificationType } from '../common/enum';

@Entity('user_warnings')
export class UserWarning extends BaseEntity {
  @ManyToOne(() => User, (u) => u.warnings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_user_id' })
  @Index()
  recipient!: User;

  @ManyToOne(() => UserReport, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report!: UserReport;

  @Column({ name: 'type', type: 'enum', enum: NotificationType, enumName: 'notification_type', default: NotificationType.WARNING })
  type!: NotificationType;

  @Column({ name: 'message', type: 'text' })
  message!: string;

  @Column({ name: 'suspension_deadline', type: 'timestamptz' })
  suspensionDeadline!: Date;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;
}
