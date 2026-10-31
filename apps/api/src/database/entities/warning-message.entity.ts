import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { WarningThread } from './warning-thread.entity';
import { WarningSenderType } from '../common/enum';

@Entity('warning_messages')
@Index(['thread', 'createdAt'])
export class WarningMessage extends BaseEntity {
  @ManyToOne(() => WarningThread, (t) => t.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread!: WarningThread;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ name: 'sender_type', type: 'enum', enum: WarningSenderType, enumName: 'warning_sender_type' })
  senderType!: WarningSenderType;

  @Column({ name: 'body', type: 'text' })
  body!: string;

  @Column({ name: 'attachments', type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  attachments?: unknown[] | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;
}
