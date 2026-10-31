import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';

@Entity('platform_fee_configs')
export class PlatformFeeConfig extends BaseEntity {
  /** Platform charge as a percentage of the job payment (e.g. 11.99 = 11.99%) */
  @Column({ name: 'platform_charge', type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  platformCharge!: number;

  /**
   * Administrative fee as a percentage of the amount being refunded/cancelled,
   * deducted when a seeker cancels after the cooling-off window (or on an approved
   * refund). e.g. 10 = 10% → a $150 refund keeps $15. Default: 10.
   */
  @Column({ name: 'cancellation_fee_percent', type: 'numeric', precision: 10, scale: 2, default: 10, transformer: numericTransformer })
  cancellationFeePercent!: number;

  /**
   * The look-back window (in hours) that determines whether a cancellation
   * incurs the cancellation fee. Default: 48 hours.
   */
  @Column({ name: 'late_cancellation_hours', type: 'int', default: 48 })
  lateCancellationHours!: number;

  @Column({ name: 'currency', type: 'char', length: 3, default: 'AUD' })
  currency!: string;
}
