import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformFeeConfig } from '../../database/entities/platform-fee-config.entity';
import { money } from '../../interfaces/money.util';

@Injectable()
export class PlatformFeeService {
    private readonly logger = new Logger(PlatformFeeService.name);

    private cached: { config: PlatformFeeConfig | null; expiresAt: number } | null = null;
    private readonly CACHE_TTL_MS = 5 * 60 * 1000;
    private static readonly FALLBACK_PLATFORM_CHARGE = 11.99;

    constructor(
        @InjectRepository(PlatformFeeConfig)
        private readonly repo: Repository<PlatformFeeConfig>,
    ) {}

    async getActiveConfig(): Promise<PlatformFeeConfig | null> {
        if (this.cached && this.cached.expiresAt > Date.now()) {
            return this.cached.config;
        }

        const [config] = await this.repo.find({ order: { createdAt: 'DESC' }, take: 1 });

        this.cached = { config: config ?? null, expiresAt: Date.now() + this.CACHE_TTL_MS };
        return config ?? null;
    }

    async getCharge(): Promise<{ platformCharge: number; configId: string | null }> {
        const config = await this.getActiveConfig();

        if (!config) {
            this.logger.warn(
                `No PlatformFeeConfig found — falling back to ${PlatformFeeService.FALLBACK_PLATFORM_CHARGE}% platform charge. Seed platform_fee_configs to silence this.`,
            );
            return { platformCharge: PlatformFeeService.FALLBACK_PLATFORM_CHARGE, configId: null };
        }

        return { platformCharge: money(config.platformCharge), configId: config.id };
    }

    async splitAmount(
        jobPrice: number,
    ): Promise<{ providerAmount: number; platformFee: number; serviceFee: number; configId: string | null }> {
        const { platformCharge, configId } = await this.getCharge();
        // New model: the GST-inclusive service fee is added ON TOP of the job price. The provider
        // receives the full job price; the platform keeps the fee. platformFee is the net share
        // (GST excluded) since the Payment/ledger tracks the tax-free deal separately from GST.
        const serviceFee = parseFloat((jobPrice * (platformCharge / 100)).toFixed(2));
        const platformFee = parseFloat((serviceFee / 1.1).toFixed(2));
        return {
            providerAmount: jobPrice,
            platformFee,
            serviceFee,
            configId,
        };
    }

    invalidateCache(): void {
        this.cached = null;
    }
}
