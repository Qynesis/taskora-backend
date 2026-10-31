import { Controller, Get, Post, HttpCode, Param, Body, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SendSupportMessageDto } from './dto/send-support-message.dto';
import { SupportTicketListItemDto } from './dto/support-ticket-list-item.dto';
import { SupportMessageResponseDto } from './dto/support-message-response.dto';
import { SupportTicketQueryDto } from './dto/support-ticket-query.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { IdResponseDto } from '../../interfaces';

@ApiTags('Support Tickets')
@Controller('support-tickets')
@ApiAuth()
@Roles(Role.SEEKER, Role.PROVIDER, Role.ADMIN)
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Get('unread-count')
  @ResponseMessage('Unread support ticket count fetched successfully')
  @ApiOperation({ summary: 'Unread support count — admin: tickets awaiting a reply; user: unread admin replies' })
  @ApiResponse({ status: 200, schema: { properties: { count: { type: 'number' } } } })
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    const count = user.roles.includes(Role.ADMIN)
      ? await this.supportTicketService.adminUnreadCount()
      : await this.supportTicketService.unreadCount(user.id);
    return { count };
  }

  @Get()
  @ResponseMessage('Support tickets fetched successfully')
  @ApiOperation({ summary: "List my support tickets" })
  @ApiResponse({ status: 200, type: SupportTicketListItemDto, isArray: true })
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() query: SupportTicketQueryDto) {
    return this.supportTicketService.findForUser(user.id, query);
  }

  @Get(':id')
  @ResponseMessage('Support ticket header fetched successfully')
  @ApiOperation({ summary: 'Get support ticket header (subject, sender name and avatar)' })
  @ApiResponse({ status: 200, schema: { properties: { name: { type: 'string', nullable: true }, email: { type: 'string', nullable: true }, avatarUrl: { type: 'string', nullable: true }, isDeleted: { type: 'boolean' } } } })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ name: string | null; email: string | null; avatarUrl: string | null }> {
    return this.supportTicketService.getTicketDetail(id, user.id, user.roles.includes(Role.ADMIN));
  }

  @Get(':id/messages')
  @ResponseMessage('Support ticket messages fetched successfully')
  @ApiOperation({ summary: 'Get messages in a support ticket (paginated)' })
  @ApiResponse({ status: 200, type: SupportMessageResponseDto, isArray: true })
  findMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SupportTicketQueryDto,
  ) {
    return this.supportTicketService.findMessages(id, query, user.id);
  }

  @Post()
  @ResponseMessage('Support ticket submitted successfully')
  @ApiOperation({ summary: 'Submit a new support ticket' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  async create(
    @Body() dto: CreateSupportTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const ticket = await this.supportTicketService.create(user.id, dto);
    return { id: ticket.id };
  }

  @Post(':id/messages/read')
  @HttpCode(200)
  @ResponseMessage('Messages marked as read')
  @ApiOperation({ summary: 'Mark all admin messages in a ticket as read' })
  @ApiResponse({ status: 200 })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.supportTicketService.markMessagesAsRead(id, user.id);
  }

  @Post(':id/messages')
  @ResponseMessage('Message sent successfully')
  @ApiOperation({ summary: 'Send a message in a support ticket' })
  @ApiResponse({ status: 201, type: SupportMessageResponseDto })
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendSupportMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SupportMessageResponseDto> {
    return this.supportTicketService.sendUserMessage(id, user.id, dto);
  }
}
