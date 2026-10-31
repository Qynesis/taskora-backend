import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { SupportTicket } from './support-ticket.entity';
import { SupportSenderType } from '../common/enum';

@Entity('support_messages')
@Index(['ticket', 'createdAt'])
export class SupportMessage extends BaseEntity {
  @ManyToOne(() => SupportTicket, (t) => t.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: SupportTicket;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ name: 'sender_type', type: 'enum', enum: SupportSenderType, enumName: 'support_sender_type' })
  senderType!: SupportSenderType;

  @Column({ name: 'body', type: 'text' })
  body!: string;

  @Column({ name: 'attachments', type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  attachments?: unknown[] | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;
}
