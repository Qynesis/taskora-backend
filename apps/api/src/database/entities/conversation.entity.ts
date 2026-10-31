import { Entity, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { DirectMessage } from './direct-message.entity';

@Entity('conversations')
@Index(['seeker', 'provider'])
export class Conversation extends BaseEntity {
  @ManyToOne(() => User, (u) => u.conversationsAsSeeker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seeker_id' })
  @Index()
  seeker!: User;

  @ManyToOne(() => User, (u) => u.conversationsAsProvider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  @Index()
  provider!: User;

  @OneToMany(() => DirectMessage, (m) => m.conversation)
  messages!: DirectMessage[];

}
