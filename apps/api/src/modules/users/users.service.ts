import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserNotificationSettings } from '../../database/entities/user_notification_settings.entity';
import { UserRole } from '../../database/common/enum';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { UserSyncedEvent } from './events/user-synced.event';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '@app/shared-types';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserNotificationSettings)
        private readonly notificationSettingsRepository: Repository<UserNotificationSettings>,
        private readonly eventEmitter: DomainEventEmitter,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Upserts a user record from Supabase JWT claims.
     *
     * Called every time the frontend performs a "sync" after sign-in.
     * Uses the Supabase user UUID as the primary key so auth state
     * and database records stay in sync without a separate auth table.
     */
    async upsert(id: string, email: string, emailVerified: boolean, role?: UserRole): Promise<User> {
        // Check if another account already owns this email before upserting
        const emailOwner = await this.userRepository.findOneBy({ email } as any);
        if (emailOwner && emailOwner.id !== id) {
            throw new ConflictException('An account with this email already exists');
        }

        const before = await this.userRepository.findOneBy({ id } as any);
        const isNew  = !before;

        // Atomic INSERT ... ON CONFLICT (id) DO UPDATE — safe under concurrent syncs
        await this.userRepository.upsert(
            { id, email, emailVerified, role: role ?? UserRole.SEEKER } as any,
            { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true },
        );

        const saved = (await this.userRepository.findOneBy({ id } as any))!;
        this.eventEmitter.emit(new UserSyncedEvent(saved.id, saved.email, isNew));
        return saved;
    }

    /**
     * Idempotently provisions the local user row straight from verified JWT claims.
     *
     * This is the same work POST /users/sync does, exposed so any FK-dependent write (e.g.
     * creating a profile) can self-heal when the frontend hasn't called sync yet — a fresh
     * account otherwise hits a profiles_user_id foreign-key violation. Safe to call on every
     * request: upsert is INSERT ... ON CONFLICT DO UPDATE and no-ops when nothing changed.
     */
    async ensureSynced(user: AuthenticatedUser): Promise<User> {
        const userMeta = user.metadata?.['user_metadata'] as Record<string, unknown> | undefined;
        const emailVerified = Boolean(
            user.metadata?.['email_confirmed_at'] ?? userMeta?.['email_verified'] ?? false,
        );
        const role = userMeta?.['role'] as UserRole | undefined;
        return this.upsert(user.id, user.email, emailVerified, role);
    }

    async findMe(id: string): Promise<User | null> {
        return this.userRepository.findOneBy({ id } as any);
    }

    // Used by admin user management endpoints, not the frontend sync.
    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOneBy({ id } as any);
        if (!user) {
            throw new NotFoundException(`User "${id}" not found`);
        }
        return user;
    }

    /** Admin moderation must not resurrect or re-flag a permanently deleted (anonymized) account. */
    private assertNotDeleted(user: User): void {
        if (user.accountDeletedAt) {
            throw new BadRequestException('This account has been permanently deleted and cannot be modified');
        }
    }

    // Used by admin user management endpoints, not the frontend sync.
    async deactivate(id: string, actorId?: string): Promise<User> {
        const user = await this.findOne(id);
        this.assertNotDeleted(user);
        user.isActive = false;
        const saved = await this.userRepository.save(user);
        await this.auditService.log({
            action: 'USER_DEACTIVATED',
            entityType: 'user',
            entityId: id,
            actorId,
        });
        return saved;
    }

    // Used by admin user management endpoints, not the frontend sync.
    async reactivate(id: string, actorId?: string): Promise<User> {
        const user = await this.findOne(id);
        this.assertNotDeleted(user);
        user.isActive = true;
        const saved = await this.userRepository.save(user);
        await this.auditService.log({
            action: 'USER_REACTIVATED',
            entityType: 'user',
            entityId: id,
            actorId,
        });
        return saved;
    }

    async suspend(id: string, actorId?: string): Promise<User> {
        const user = await this.findOne(id);
        this.assertNotDeleted(user);
        user.isSuspended = true;
        user.isActive = false;
        user.suspendedAt = new Date();
        await this.userRepository.save(user);
        await this.userRepository.softDelete(id);
        await this.auditService.log({
            action: 'USER_SUSPENDED',
            entityType: 'user',
            entityId: id,
            actorId,
        });
        return user;
    }

    async getNotificationSettings(userId: string): Promise<UserNotificationSettings> {
        const existing = await this.notificationSettingsRepository.findOne({
            where: { user: { id: userId } as any },
            relations: ['user'],
        });
        if (existing) return existing;

        // Row not seeded yet — create with defaults
        const created = this.notificationSettingsRepository.create({
            user: { id: userId } as any,
        });
        return this.notificationSettingsRepository.save(created);
    }

    async updateNotificationSettings(
        userId: string,
        dto: UpdateNotificationSettingsDto,
    ): Promise<UserNotificationSettings> {
        const settings = await this.getNotificationSettings(userId);
        Object.assign(settings, dto);
        return this.notificationSettingsRepository.save(settings);
    }
}
