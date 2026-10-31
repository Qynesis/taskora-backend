import { Entity, Column, ManyToOne, OneToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { UserWarning } from './user-warning.entity';
import { WarningMessage } from './warning-message.entity';

@Entity('warning_threads')
export class WarningThread extends BaseEntity {
  @OneToOne(() => UserWarning, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warning_id' })
  warning!: UserWarning;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recipient_user_id' })
  @Index()
  recipient!: User;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed!: boolean;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date | null;

  @OneToMany(() => WarningMessage, (m) => m.thread)
  messages!: WarningMessage[];
}
