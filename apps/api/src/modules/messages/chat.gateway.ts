import { Inject, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AUTH_STRATEGY, IAuthStrategy } from '../../security/interfaces/auth-strategy.interface';
import { Role } from '../../security/rbac/roles.enum';

/** Shared room every admin socket joins — support/warning queues are directed at the admin team, not a user id. */
const ADMIN_ROOM = 'role:admin';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(AUTH_STRATEGY) private readonly authStrategy: IAuthStrategy,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token = this.extractToken(socket);
      if (!token) throw new Error('Missing token');

      const user = await this.authStrategy.validateToken(token);
      socket.data['user'] = user;
      void socket.join(`user:${user.id}`);
      // Admins share one room so a single emit fans out to every connected admin (there can be several).
      if (user.roles?.includes(Role.ADMIN)) void socket.join(ADMIN_ROOM);

      this.logger.log(`Connected: socket=${socket.id} user=${user.id}`);
    } catch {
      this.logger.warn(`Rejected unauthenticated socket: ${socket.id}`);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket): void {
    this.logger.log(`Disconnected: socket=${socket.id}`);
  }

  /**
   * Client emits 'join-conversation' with a conversationId string.
   * The socket is added to a room so it receives future messages.
   */
  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() conversationId: string,
  ): void {
    void socket.join(`conversation:${conversationId}`);
    this.logger.log(`Socket ${socket.id} joined conversation:${conversationId}`);
  }

  /**
   * Client emits 'leave-conversation' when navigating away.
   */
  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() conversationId: string,
  ): void {
    void socket.leave(`conversation:${conversationId}`);
  }

  @SubscribeMessage('join-warning-thread')
  handleJoinWarningThread(
    @ConnectedSocket() socket: Socket,
    @MessageBody() threadId: string,
  ): void {
    void socket.join(`warning-thread:${threadId}`);
    this.logger.log(`Socket ${socket.id} joined warning-thread:${threadId}`);
  }

  @SubscribeMessage('leave-warning-thread')
  handleLeaveWarningThread(
    @ConnectedSocket() socket: Socket,
    @MessageBody() threadId: string,
  ): void {
    void socket.leave(`warning-thread:${threadId}`);
  }

  @SubscribeMessage('join-support-ticket')
  handleJoinSupportTicket(
    @ConnectedSocket() socket: Socket,
    @MessageBody() ticketId: string,
  ): void {
    void socket.join(`support-ticket:${ticketId}`);
    this.logger.log(`Socket ${socket.id} joined support-ticket:${ticketId}`);
  }

  @SubscribeMessage('leave-support-ticket')
  handleLeaveSupportTicket(
    @ConnectedSocket() socket: Socket,
    @MessageBody() ticketId: string,
  ): void {
    void socket.leave(`support-ticket:${ticketId}`);
  }

  /**
   * Called by MessageCreatedHandler to push the new message to all
   * sockets in the conversation room.
   */
  broadcastMessage(conversationId: string, message: unknown): void {
    this.server.to(`conversation:${conversationId}`).emit('message.new', message);
  }

  broadcastToUser(userId: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit('warning.new', payload);
  }

  broadcastToWarningThread(threadId: string, payload: unknown): void {
    this.server.to(`warning-thread:${threadId}`).emit('warning-message.new', payload);
  }

  broadcastToSupportTicket(ticketId: string, payload: unknown): void {
    this.server.to(`support-ticket:${ticketId}`).emit('support-message.new', payload);
  }

  broadcastToConversation(conversationId: string, payload: unknown): void {
    this.server.to(`conversation:${conversationId}`).emit('conversation.message.new', payload);
  }

  broadcastNotificationBadge(userId: string, count: number): void {
    this.server.to(`user:${userId}`).emit('notification.badge', { count });
  }

  broadcastMessageBadge(userId: string, count: number): void {
    this.server.to(`user:${userId}`).emit('message.badge', { count });
  }

  broadcastSupportBadge(userId: string, count: number): void {
    this.server.to(`user:${userId}`).emit('support.badge', { count });
  }

  broadcastWarningBadge(userId: string, count: number): void {
    this.server.to(`user:${userId}`).emit('warning.badge', { count });
  }

  /** Admin-team support queue count — same 'support.badge' event, delivered to every admin. */
  broadcastAdminSupportBadge(count: number): void {
    this.server.to(ADMIN_ROOM).emit('support.badge', { count });
  }

  /** Admin-team warning queue count — same 'warning.badge' event, delivered to every admin. */
  broadcastAdminWarningBadge(count: number): void {
    this.server.to(ADMIN_ROOM).emit('warning.badge', { count });
  }

  private extractToken(socket: Socket): string | null {
    const fromAuth = socket.handshake.auth?.['token'] as string | undefined;
    if (fromAuth) return fromAuth;

    const header = socket.handshake.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
