import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { ConversationService } from './conversation.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { ConversationListItemDto } from './dto/conversation-list-item.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { MarkReadResponseDto } from './dto/mark-read-response.dto';
import { PaginatedResponseDto } from '../../interfaces/paginated-response.dto';

@ApiTags('Common | Conversations')
@Controller('conversations')
@ApiAuth()
@Roles(Role.SEEKER, Role.PROVIDER)
@UseInterceptors(CacheInterceptor)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get('unread-count')
  @ResponseMessage('Unread message count fetched successfully')
  @ApiOperation({ summary: 'Get total unread message count across all conversations' })
  @ApiResponse({ status: 200, schema: { example: { count: 5 } } })
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    const count = await this.conversationService.unreadMessageCount(user.id);
    return { count };
  }

  @Post()
  @ResponseMessage('Conversation started successfully')
  @ApiOperation({ summary: 'Start a new conversation or open existing one' })
  @ApiResponse({ status: 201, description: 'Conversation started or reused', type: ConversationListItemDto })
  startConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartConversationDto,
  ): Promise<ConversationListItemDto> {
    return this.conversationService.startConversation(user.id, dto);
  }

  @Get()
  @ResponseMessage('Inbox fetched successfully')
  @ApiOperation({ summary: 'Get conversation inbox (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  findInbox(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ConversationQueryDto,
  ): Promise<PaginatedResponseDto<ConversationListItemDto>> {
    return this.conversationService.findInbox(user.id, query);
  }

  @Get(':id')
  @ResponseMessage('Conversation header fetched successfully')
  @ApiOperation({ summary: 'Get conversation header (other participant name and avatar)' })
  @ApiResponse({ status: 200, schema: { properties: { name: { type: 'string', nullable: true }, email: { type: 'string' }, avatarUrl: { type: 'string', nullable: true }, isDeleted: { type: 'boolean' } } } })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ name: string | null; email: string; avatarUrl: string | null; isDeleted: boolean }> {
    return this.conversationService.getConversationDetail(id, user.id);
  }

  @Get(':id/messages')
  @ResponseMessage('Messages fetched successfully')
  @ApiOperation({ summary: 'Get messages in a conversation (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  findMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ConversationQueryDto,
  ): Promise<PaginatedResponseDto<MessageResponseDto>> {
    return this.conversationService.findMessages(id, user.id, query);
  }

  @Post(':id/messages')
  @ResponseMessage('Message sent successfully')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: MessageResponseDto })
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    return this.conversationService.sendMessage(id, user.id, dto);
  }

  @Patch(':id/read')
  @ResponseMessage('Conversation marked as read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  @ApiResponse({ status: 200, description: 'Conversation marked as read', type: MarkReadResponseDto })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MarkReadResponseDto> {
    return this.conversationService.markRead(id, user.id).then(() => ({ updated: true }));
  }
}
