import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountDeletionService } from './account-deletion.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { RefundRequest } from '../../database/entities/refund-request.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { StripeAccount } from '../../database/entities/stripe-account.entity';
import { StripeCustomer } from '../../database/entities/stripe-customer.entity';
import { ProviderMedia } from '../../database/entities/provider_media.entity';
import { ProviderVerificationStepFile } from '../../database/entities/provider_verification_step_files.entity';
import { TransactionHelper } from '../../database/transaction.helper';
import { AzureStorageService } from '../../storage/storage.service';
import { StripeService } from '../stripe/stripe.service';
import { AuditService } from '../audit/audit.service';

const USER_ID = 'user-1';

describe('AccountDeletionService', () => {
  let service: AccountDeletionService;

  let userRepo: { findOne: jest.Mock; update: jest.Mock };
  let profileRepo: { findOne: jest.Mock };
  let jobRepo: { count: jest.Mock };
  let paymentRepo: { count: jest.Mock };
  let refundRepo: { count: jest.Mock };
  let subscriptionRepo: { count: jest.Mock };
  let stripeAccountRepo: { findOne: jest.Mock };
  let stripeCustomerRepo: { findOne: jest.Mock };
  let providerMediaRepo: { find: jest.Mock };
  let verificationFileRepo: { createQueryBuilder: jest.Mock };

  // Records what the transaction did so tests can assert on the purge/anonymize behaviour.
  let txOps: { deletes: string[]; updates: { entity: string; patch: any }[] };
  let txHelper: { run: jest.Mock };
  let storage: { deleteByUrl: jest.Mock };
  let stripeService: { deleteConnectAccount: jest.Mock; deleteCustomer: jest.Mock };
  let auditService: { log: jest.Mock };
  let supabaseAdmin: { deleteAuthUser: jest.Mock };

  beforeEach(async () => {
    txOps = { deletes: [], updates: [] };

    const manager = {
      createQueryBuilder: jest.fn().mockImplementation(() => {
        let target = '';
        const qb: any = {
          delete: jest.fn().mockReturnThis(),
          from: jest.fn().mockImplementation((entity: any) => {
            target = entity?.name ?? String(entity);
            return qb;
          }),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockImplementation(async () => {
            txOps.deletes.push(target);
            return { affected: 1 };
          }),
        };
        return qb;
      }),
      update: jest.fn().mockImplementation(async (entity: any, _c: unknown, patch: any) => {
        txOps.updates.push({ entity: entity?.name ?? String(entity), patch });
        return { affected: 1 };
      }),
    };

    txHelper = { run: jest.fn().mockImplementation(async (cb: (qr: unknown) => Promise<unknown>) => cb({ manager })) };

    userRepo = { findOne: jest.fn().mockResolvedValue({ id: USER_ID }), update: jest.fn() };
    profileRepo = { findOne: jest.fn().mockResolvedValue(null) };
    jobRepo = { count: jest.fn().mockResolvedValue(0) };
    paymentRepo = { count: jest.fn().mockResolvedValue(0) };
    refundRepo = { count: jest.fn().mockResolvedValue(0) };
    subscriptionRepo = { count: jest.fn().mockResolvedValue(0) };
    stripeAccountRepo = { findOne: jest.fn().mockResolvedValue(null) };
    stripeCustomerRepo = { findOne: jest.fn().mockResolvedValue(null) };
    providerMediaRepo = { find: jest.fn().mockResolvedValue([]) };
    verificationFileRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    storage = { deleteByUrl: jest.fn().mockResolvedValue(undefined) };
    stripeService = {
      deleteConnectAccount: jest.fn().mockResolvedValue(undefined),
      deleteCustomer: jest.fn().mockResolvedValue(undefined),
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    supabaseAdmin = { deleteAuthUser: jest.fn().mockResolvedValue(undefined) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AccountDeletionService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Profile), useValue: profileRepo },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(RefundRequest), useValue: refundRepo },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: getRepositoryToken(StripeAccount), useValue: stripeAccountRepo },
        { provide: getRepositoryToken(StripeCustomer), useValue: stripeCustomerRepo },
        { provide: getRepositoryToken(ProviderMedia), useValue: providerMediaRepo },
        { provide: getRepositoryToken(ProviderVerificationStepFile), useValue: verificationFileRepo },
        { provide: TransactionHelper, useValue: txHelper },
        { provide: AzureStorageService, useValue: storage },
        { provide: StripeService, useValue: stripeService },
        { provide: AuditService, useValue: auditService },
        { provide: SupabaseAdminService, useValue: supabaseAdmin },
      ],
    }).compile();

    service = moduleRef.get(AccountDeletionService);
  });

  it('throws NotFound when the user does not exist', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.deleteMyAccount(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    expect(txHelper.run).not.toHaveBeenCalled();
  });

  describe('active-obligation guard', () => {
    it('blocks deletion when an active job exists', async () => {
      jobRepo.count.mockResolvedValue(1);
      await expect(service.deleteMyAccount(USER_ID)).rejects.toBeInstanceOf(BadRequestException);
      expect(txHelper.run).not.toHaveBeenCalled();
      expect(supabaseAdmin.deleteAuthUser).not.toHaveBeenCalled();
    });

    it('blocks deletion when a pending/disputed payment exists', async () => {
      paymentRepo.count.mockResolvedValue(2);
      await expect(service.deleteMyAccount(USER_ID)).rejects.toBeInstanceOf(BadRequestException);
      expect(txHelper.run).not.toHaveBeenCalled();
    });

    it('blocks deletion when a pending refund request exists', async () => {
      refundRepo.count.mockResolvedValue(1);
      await expect(service.deleteMyAccount(USER_ID)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('blocks deletion when an active subscription exists', async () => {
      subscriptionRepo.count.mockResolvedValue(1);
      await expect(service.deleteMyAccount(USER_ID)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  const userUpdate = () => txOps.updates.find((u) => u.entity === 'User');
  const profileUpdate = () => txOps.updates.find((u) => u.entity === 'Profile');

  describe('happy path', () => {
    it('anonymizes the user (email scrubbed, isActive=false) and purges user-direct personal rows', async () => {
      await service.deleteMyAccount(USER_ID);

      expect(txHelper.run).toHaveBeenCalledTimes(1);
      // Personal user-direct rows purged + live bids withdrawn.
      expect(txOps.deletes).toEqual(
        expect.arrayContaining(['FcmToken', 'UserNotificationSettings', 'SavedPaymentMethod', 'StripeAccount', 'StripeCustomer', 'Bid']),
      );
      // User row kept but anonymized (NOT soft-deleted — retained records still join to it).
      // accountDeletedAt is the authoritative deletion marker; isActive=false is the derived flag.
      expect(userUpdate()?.patch).toEqual(
        expect.objectContaining({ email: `deleted+${USER_ID}@deleted.invalid`, emailVerified: false, isActive: false }),
      );
      expect(userUpdate()?.patch.accountDeletedAt).toBeInstanceOf(Date);
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ACCOUNT_DELETED', entityId: USER_ID }));
    });

    it('tombstones the profile to "Deleted User" and purges provider data when a profile exists', async () => {
      profileRepo.findOne.mockResolvedValue({ id: 'profile-1', avatarUrl: null });
      await service.deleteMyAccount(USER_ID);

      // Profile row kept but anonymized in place (so audit/report/warning joins still resolve a name).
      expect(txOps.deletes).not.toContain('Profile');
      expect(profileUpdate()?.patch).toEqual(
        expect.objectContaining({ firstName: 'Deleted', lastName: 'User', avatarUrl: null }),
      );
      // All provider PII purged.
      expect(txOps.deletes).toEqual(
        expect.arrayContaining([
          'ProviderVerificationCase',
          'ProviderMedia',
          'ProviderProfessionalDetails',
          'ProviderWorkInfo',
          'ProviderBankDetails',
          'ProviderCertification',
          'ProviderEmployee',
        ]),
      );
    });

    it('does not touch profile/provider rows when the user has none', async () => {
      profileRepo.findOne.mockResolvedValue(null);
      await service.deleteMyAccount(USER_ID);
      expect(profileUpdate()).toBeUndefined();
      expect(txOps.deletes).not.toContain('ProviderBankDetails');
    });

    it('purges personal blobs (avatar, media, identity documents)', async () => {
      profileRepo.findOne.mockResolvedValue({ id: 'profile-1', avatarUrl: 'https://blob/avatar.png' });
      providerMediaRepo.find.mockResolvedValue([{ url: 'https://blob/media1.jpg' }]);
      verificationFileRepo.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ fileUrl: 'https://blob/id-doc.pdf' }]),
      });

      await service.deleteMyAccount(USER_ID);

      expect(storage.deleteByUrl).toHaveBeenCalledWith('https://blob/avatar.png');
      expect(storage.deleteByUrl).toHaveBeenCalledWith('https://blob/media1.jpg');
      expect(storage.deleteByUrl).toHaveBeenCalledWith('https://blob/id-doc.pdf');
    });

    it('deletes the external Stripe account + customer using captured ids', async () => {
      stripeAccountRepo.findOne.mockResolvedValue({ accountId: 'acct_123' });
      stripeCustomerRepo.findOne.mockResolvedValue({ customerId: 'cus_123' });

      await service.deleteMyAccount(USER_ID);

      expect(stripeService.deleteConnectAccount).toHaveBeenCalledWith('acct_123');
      expect(stripeService.deleteCustomer).toHaveBeenCalledWith('cus_123');
      expect(supabaseAdmin.deleteAuthUser).toHaveBeenCalledWith(USER_ID);
    });

    it('skips Stripe calls when the user has no Stripe identities', async () => {
      await service.deleteMyAccount(USER_ID);
      expect(stripeService.deleteConnectAccount).not.toHaveBeenCalled();
      expect(stripeService.deleteCustomer).not.toHaveBeenCalled();
    });
  });

  describe('best-effort external cleanup', () => {
    it('still resolves when blob deletion fails', async () => {
      profileRepo.findOne.mockResolvedValue({ id: 'profile-1', avatarUrl: 'https://blob/avatar.png' });
      storage.deleteByUrl.mockRejectedValue(new Error('azure down'));
      await expect(service.deleteMyAccount(USER_ID)).resolves.toBeUndefined();
      // The DB transaction must have committed regardless (user anonymized).
      expect(userUpdate()?.patch).toEqual(expect.objectContaining({ isActive: false }));
    });

    it('still resolves when the audit log write fails', async () => {
      auditService.log.mockRejectedValue(new Error('audit down'));
      await expect(service.deleteMyAccount(USER_ID)).resolves.toBeUndefined();
    });
  });
});
