import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    NotFoundException,
    UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { CacheKey } from '@nestjs/cache-manager';
import { User } from '../../database/entities/user.entity';
import { UserNotificationSettings } from '../../database/entities/user_notification_settings.entity';
import { IdResponseDto } from '../../interfaces';
import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
    @ApiProperty() email!: string;
    @ApiProperty() role!: string;
    @ApiProperty() emailVerified!: boolean;
    @ApiProperty() isActive!: boolean;
    @ApiProperty() isSuspended!: boolean;
}

@ApiTags('Common | Account')
@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // ── Self-service ──────────────────────────────────────────────────────────

    @Get('me')
    @ApiAuth()
    @Roles(Role.PROVIDER, Role.SEEKER, Role.ADMIN)
    @ResponseMessage('User fetched successfully')
    @ApiOperation({ summary: 'Get current user record — returns 404 if not yet synced' })
    @ApiResponse({ status: 200, type: MeResponseDto })
    @ApiResponse({ status: 404, description: 'User not synced yet — call POST /users/sync' })
    async getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
        const record = await this.usersService.findMe(user.id);
        if (!record) throw new NotFoundException('User not synced yet');
        return {
            email: record.email,
            role: record.role,
            emailVerified: record.emailVerified,
            isActive: record.isActive,
            isSuspended: record.isSuspended,
        };
    }

    /**
     * Called by the front end immediately after a successful Supabase sign-in.
     *
     * The Supabase JWT Guard has already validated the token, so user data is
     * sourced directly from the verified JWT claims — no request body needed.
     * This keeps the user row in the database in sync with Supabase Auth.
     */
    @Post('sync')
    @ApiAuth()
    @Roles(Role.PROVIDER, Role.SEEKER, Role.ADMIN)
    @ResponseMessage('User synced successfully')
    @ApiOperation({ summary: 'Sync authenticated Supabase user into the local database (upsert)' })
    @ApiResponse({ status: 201, description: 'User record created or confirmed', type: IdResponseDto })
    async sync(@CurrentUser() user: AuthenticatedUser): Promise<IdResponseDto> {
        const synced = await this.usersService.ensureSynced(user);
        return { id: synced.id };
    }

    // ----- User Notification Settings ──────────────────────────────────────────────
    
    @Get('me/notification-settings')
    @ApiAuth()
    @Roles(Role.PROVIDER, Role.SEEKER, Role.ADMIN)
    @ResponseMessage('Notification settings fetched successfully')
    @CacheKey('users:me:notification-settings')
    @ApiOperation({ summary: 'Get my notification preferences' })
    @ApiResponse({ status: 200, description: 'Notification settings', type: UserNotificationSettings })
    getNotificationSettings(@CurrentUser() user: AuthenticatedUser) {
        return this.usersService.getNotificationSettings(user.id);
    }

    @Patch('me/notification-settings')
    @ApiAuth()
    @Roles(Role.PROVIDER, Role.SEEKER, Role.ADMIN)
    @ResponseMessage('Notification settings updated successfully')
    @InvalidateCache('users:me:notification-settings')
    @ApiOperation({ summary: 'Update my notification preferences' })
    @ApiResponse({ status: 200, description: 'Notification settings updated', type: IdResponseDto })
    async updateNotificationSettings(
        @Body() dto: UpdateNotificationSettingsDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<IdResponseDto> {
        const settings = await this.usersService.updateNotificationSettings(user.id, dto);
        return { id: settings.id };
    }
}
