import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { FcmPlatform } from '../common/enum';

@Entity({ name: 'fcm_tokens', schema: 'service' })
@Unique(['token'])
export class FcmToken extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user!: User;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  platform!: FcmPlatform | null;
}
