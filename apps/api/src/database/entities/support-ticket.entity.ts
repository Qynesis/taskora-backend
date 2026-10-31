import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { SupportMessage } from './support-message.entity';

@Entity('support_tickets')
export class SupportTicket extends BaseEntity {
  @Column({ name: 'subject', type: 'text' })
  subject!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_user_id' })
  @Index()
  sender!: User;

  @OneToMany(() => SupportMessage, (m) => m.ticket)
  messages!: SupportMessage[];
}
