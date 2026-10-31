import { Controller, Get, Post, HttpCode, Param, Body, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WarningThreadService } from './warning-thread.service';
import { SendWarningMessageDto } from './dto/send-warning-message.dto';
import { WarningThreadResponseDto } from './dto/warning-thread-response.dto';
import { WarningMessageResponseDto } from './dto/warning-message-response.dto';
import { WarningThreadQueryDto } from './dto/warning-thread-query.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';

@ApiTags('Warning Threads')
@Controller('warning-threads')
@ApiAuth()
@Roles(Role.SEEKER, Role.PROVIDER, Role.ADMIN)
export class WarningThreadController {
  constructor(private readonly warningThreadService: WarningThreadService) {}

  @Get('unread-count')
  @ResponseMessage('Unread warning thread count fetched successfully')
  @ApiOperation({ summary: 'Unread warning count — admin: open threads awaiting a reply; user: unread admin messages' })
  @ApiResponse({ status: 200, schema: { properties: { count: { type: 'number' } } } })
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    const count = user.roles.includes(Role.ADMIN)
      ? await this.warningThreadService.adminUnreadCount()
      : await this.warningThreadService.unreadCount(user.id);
    return { count };
  }

  @Get()
  @ResponseMessage('Warning threads fetched successfully')
  @ApiOperation({ summary: 'List my warning threads (user inbox)' })
  @ApiResponse({ status: 200, type: WarningThreadResponseDto, isArray: true })
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() query: WarningThreadQueryDto) {
    return this.warningThreadService.findForUser(user.id, query);
  }

  @Get(':id')
  @ResponseMessage('Warning thread header fetched successfully')
  @ApiOperation({ summary: 'Get warning thread header (recipient name and avatar)' })
  @ApiResponse({ status: 200, schema: { properties: { name: { type: 'string', nullable: true }, email: { type: 'string', nullable: true }, avatarUrl: { type: 'string', nullable: true }, isClosed: { type: 'boolean' }, isDeleted: { type: 'boolean' } } } })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ name: string | null; email: string | null; avatarUrl: string | null; isClosed: boolean }> {
    return this.warningThreadService.getThreadDetail(id, user.id, user.roles.includes(Role.ADMIN));
  }

  @Get(':id/messages')
  @ResponseMessage('Warning thread messages fetched successfully')
  @ApiOperation({ summary: 'Get messages in a warning thread (paginated)' })
  @ApiResponse({ status: 200, type: WarningMessageResponseDto, isArray: true })
  findMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WarningThreadQueryDto,
  ) {
    return this.warningThreadService.findMessages(id, query, user.id);
  }

  @Post(':id/messages/read')
  @HttpCode(200)
  @ResponseMessage('Messages marked as read')
  @ApiOperation({ summary: 'Mark all admin messages in a warning thread as read' })
  @ApiResponse({ status: 200 })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.warningThreadService.markMessagesAsRead(id, user.id);
  }

  @Post(':id/messages')
  @ResponseMessage('Reply sent successfully')
  @ApiOperation({ summary: 'Reply to a warning thread' })
  @ApiResponse({ status: 201, type: WarningMessageResponseDto })
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendWarningMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WarningMessageResponseDto> {
    return this.warningThreadService.sendUserMessage(id, user.id, dto);
  }
}
