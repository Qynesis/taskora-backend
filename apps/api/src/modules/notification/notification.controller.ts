import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationActionResponseDto } from './dto/action-response.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Cached } from '../../cache/decorators/cached.decorator';
import { CacheKey } from '../../cache/decorators/cache-key.decorator';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { IdResponseDto } from '../../interfaces';

@ApiTags('Notifications')
@Controller('notifications')
@UseInterceptors(CacheInterceptor)
@ApiAuth()
@Roles(Role.SEEKER, Role.PROVIDER, Role.ADMIN)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('unread-count')
  @ResponseMessage('Unread count fetched successfully')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, schema: { example: { count: 3 } } })
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    const count = await this.notificationService.unreadCount(user.id);
    return { count };
  }

  @Get()
  @ResponseMessage('Notifications fetched successfully')
  @Cached()
  @CacheKey((req: any) => `notifications:list:${req.user?.id}:${req.originalUrl}`)
  @ApiOperation({ summary: 'List my notifications' })
  @ApiResponse({ status: 200, type: NotificationResponseDto, isArray: true })
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() query: NotificationQueryDto) {
    return this.notificationService.findForUser(user.id, query);
  }

  @Post('fcm-token')
  @ResponseMessage('FCM token registered successfully')
  @InvalidateCache((req: any) => `notifications:list:${req.user?.id}:*`)
  @ApiOperation({ summary: 'Register FCM device token (call on login and on token refresh)' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  async registerToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterFcmTokenDto): Promise<IdResponseDto> {
    const fcmToken = await this.notificationService.registerToken(user.id, dto);
    return { id: fcmToken.id };
  }

  @Delete('fcm-token/:token')
  @ResponseMessage('FCM token removed successfully')
  @ApiOperation({ summary: 'Remove FCM device token (call on logout)' })
  @ApiResponse({ status: 200, type: NotificationActionResponseDto })
  async removeToken(@CurrentUser() user: AuthenticatedUser, @Param('token') token: string) {
    await this.notificationService.removeToken(user.id, token);
    return { completed: true };
  }

  @Patch(':id/read')
  @ResponseMessage('Notification marked as read')
  @InvalidateCache((req: any) => `notifications:list:${req.user?.id}:*`)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, type: NotificationActionResponseDto })
  async markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.notificationService.markRead(id, user.id);
    return { completed: true };
  }

  @Patch('read-all')
  @ResponseMessage('All notifications marked as read')
  @InvalidateCache((req: any) => `notifications:list:${req.user?.id}:*`)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200 })
  async markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.notificationService.markAllRead(user.id);
  }
}
