import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AttachmentDto } from '../../interfaces/attachment.dto';
import { BaseEntity } from '../common/base.entity';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';
import { Job } from './job.entity';

@Entity('direct_messages')
@Index(['conversation', 'createdAt'])
export class DirectMessage extends BaseEntity {
  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ name: 'body', type: 'text' })
  body!: string;

  @ManyToOne(() => Job, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'job_id' })
  job?: Job | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ name: 'attachments', type: 'jsonb', default: [] })
  attachments!: AttachmentDto[];
}
