import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('provider_rating_summaries')
export class ProviderRatingSummary {
  @PrimaryColumn({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider!: User;

  @Column({ name: 'average_rating', type: 'numeric', precision: 3, scale: 1 })
  averageRating!: number;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
