import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticatedUser } from '@app/shared-types';
import { StripeService } from '../../src/modules/stripe/stripe.service';
import { PlatformFeeService } from '../../src/modules/platform-fee/platform-fee.service';

/**
 * Pre-mocked authenticated user fixture for protected route testing.
 */
export const TEST_USER: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  roles: ['USER'],
  metadata: {},
};

export const TEST_ADMIN: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'admin@example.com',
  roles: ['ADMIN'],
  metadata: {},
};

/**
 * Mock repository factory that returns a mock with common TypeORM repository methods.
 */
export function createMockRepository() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softRemove: jest.fn(),
    count: jest.fn(),
  };
}

/**
 * Mock TransactionHelper that immediately executes the callback
 * without actual database transactions.
 */
export function createMockTransactionHelper() {
  return {
    run: jest.fn().mockImplementation(async (cb: (qr: unknown) => Promise<unknown>) => {
      const mockQueryRunner = {
        manager: {
          create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
          save: jest.fn().mockImplementation((_entity: unknown, data: unknown) => ({
            id: '00000000-0000-0000-0000-000000000099',
            ...((data as object) || {}),
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          findOne: jest.fn().mockResolvedValue(null),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          delete: jest.fn().mockResolvedValue({ affected: 1 }),
          // Chainable query builder for conditional-update concurrency claims
          // (e.g. `UPDATE ... WHERE status IN (...)`). Defaults to a successful claim;
          // override execute() per-test to simulate a losing/concurrent claim.
          createQueryBuilder: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 1 }),
          }),
        },
      };
      return cb(mockQueryRunner);
    }),
  };
}

/**
 * Mock DomainEventEmitter.
 */
export function createMockEventEmitter() {
  return {
    emit: jest.fn(),
  };
}

/**
 * Mock QueueDispatcher.
 */
export function createMockQueueDispatcher() {
  return {
    dispatch: jest.fn(),
  };
}

/**
 * Typed mock for StripeService covering the methods used across webhook and
 * payment service tests. Using Pick<StripeService, ...> means TypeScript will
 * error here if the real service renames or removes one of these methods.
 */
export function createMockStripeService(): jest.Mocked<
  Pick<
    StripeService,
    | 'onboardIndividualAccount'
    | 'retrieveConnectedAccount'
    | 'create'
    | 'customerRetrieve'
    | 'createPaymentIntent'
    | 'getPaymentDetails'
    | 'savePaymentMethod'
    | 'createRefund'
    | 'reverseChargeTransfer'
    | 'getPaymentMethodDetails'
    | 'handleAccountUpdatedEvent'
    | 'createAndFinalizeJobInvoice'
    | 'createSubscriptionCheckoutSession'
    | 'getSubscription'
    | 'getSubscriptionById'
    | 'getSubscriptionPeriod'
    | 'scheduleSubscriptionCancellation'
    | 'cancelSubscriptionAtPeriodEnd'
    | 'getInvoice'
    | 'getCheckoutSession'

    | 'getOnboardingStatus'
    | 'updateExternalBankAccount'
    | 'assertProviderPayoutEnabled'
  >
> & {
  // These methods return complex Stripe discriminated union types; tests deliberately
  // pass partial objects so they are left untyped to avoid per-call `as any` casts.
  verifyWebhookSignature: jest.Mock;
  getLatestCharge: jest.Mock;
  retrieveSetupIntent: jest.Mock;
} {
  return {
    onboardIndividualAccount: jest.fn(),
    getOnboardingStatus: jest.fn().mockResolvedValue({ onboarded: false }),
    assertProviderPayoutEnabled: jest.fn().mockResolvedValue(undefined),
    updateExternalBankAccount: jest.fn(),
    retrieveConnectedAccount: jest.fn(),
    create: jest.fn(),
    customerRetrieve: jest.fn(),
    createPaymentIntent: jest.fn(),
    getPaymentDetails: jest.fn(),
    savePaymentMethod: jest.fn(),
    createRefund: jest.fn(),
    reverseChargeTransfer: jest.fn().mockResolvedValue({ id: 'trr_test' } as any),
    verifyWebhookSignature: jest.fn(),
    getLatestCharge: jest.fn(),
    retrieveSetupIntent: jest.fn(),
    getPaymentMethodDetails: jest.fn(),
    handleAccountUpdatedEvent: jest.fn(),
    createAndFinalizeJobInvoice: jest.fn(),
    createSubscriptionCheckoutSession: jest.fn(),
    getSubscription: jest.fn(),
    getSubscriptionById: jest.fn(),
    getSubscriptionPeriod: jest.fn(),
    scheduleSubscriptionCancellation: jest.fn(),
    cancelSubscriptionAtPeriodEnd: jest.fn(),
    getInvoice: jest.fn(),
    getCheckoutSession: jest.fn(),
  };
}

/**
 * Typed mock for PlatformFeeService. Both getPercentages and splitAmount are
 * included so tests don't silently miss one or the other.
 */
export function createMockPlatformFeeService(): jest.Mocked<
  Pick<PlatformFeeService, 'getCharge' | 'splitAmount' | 'getActiveConfig'>
> {
  return {
    getCharge: jest.fn().mockResolvedValue({ platformCharge: 11.99, configId: null }),
    splitAmount: jest.fn().mockResolvedValue({ providerAmount: 135, platformFee: 15, serviceFee: 15, configId: null }),
    getActiveConfig: jest.fn().mockResolvedValue({ cancellationFeePercent: 10, lateCancellationHours: 48, currency: 'AUD' } as any),
  };
}

/**
 * Helper to bootstrap a NestJS testing module with common pre-mocked providers.
 */
export async function createTestModule(metadata: ModuleMetadata): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
        ignoreEnvFile: true,
        load: [
          () => ({
            app: { nodeEnv: 'test', port: 3000, apiPrefix: 'api', logLevel: 'silent' },
            database: {
              host: 'localhost',
              port: 5432,
              username: 'test',
              password: 'test',
              name: 'test',
              synchronize: true,
              ssl: false,
            },
            redis: { host: 'localhost', port: 6379, password: '' },
            queue: { defaultAttempts: 1, defaultBackoff: 1000 },
            auth: {
              jwtSecret: 'test-secret',
              jwtExpiration: '1h',
              jwtAccessSecret: 'test-access-secret',
              jwtRefreshSecret: 'test-refresh-secret',
              jwtAccessExpiry: '15m',
              jwtRefreshExpiry: '30d',
            },
            cache: { defaultTtl: 60, maxItems: 100 },
          }),
        ],
      }),
      ...(metadata.imports || []),
    ],
    controllers: metadata.controllers || [],
    providers: metadata.providers || [],
    exports: metadata.exports || [],
  }).compile();
}
