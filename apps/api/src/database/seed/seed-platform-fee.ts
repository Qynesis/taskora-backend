import { DataSource } from 'typeorm';
import { PlatformFeeConfig } from '../entities/platform-fee-config.entity';

export const seedPlatformFee = async (dataSource: DataSource): Promise<void> => {
  const repo = dataSource.getRepository(PlatformFeeConfig);

  const [existing] = await repo.find({ order: { createdAt: 'DESC' }, take: 1 });
  if (existing) {
    console.log('platform_fee_configs already seeded — skipping.');
    return;
  }

  await repo.save(
    repo.create({
      platformCharge: 11.99,
      cancellationFeePercent: 10.00,
      lateCancellationHours: 48,
      currency: 'AUD',
    }),
  );

  console.log('platform_fee_configs seeded: 11.99% platform charge, 10% cancellation fee after 48h.');
};
