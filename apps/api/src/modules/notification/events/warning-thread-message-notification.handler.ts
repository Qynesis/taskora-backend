import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification.service';
import { NotificationType, WarningSenderType } from '../../../database/common/enum';
import { WarningMessageCreatedEvent } from '../../warning/events/warning-message-created.event';
import { WarningThread } from '../../../database/entities/warning-thread.entity';

@Injectable()
export class WarningThreadMessageNotificationHandler {
  private readonly logger = new Logger(WarningThreadMessageNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(WarningThread)
    private readonly threadRepository: Repository<WarningThread>,
  ) {}

  @OnEvent(WarningMessageCreatedEvent.EVENT_NAME)
  async handle(event: WarningMessageCreatedEvent): Promise<void> {
    // Only push to the user when admin sends — admin has no FCM token
    if (event.message.senderType !== WarningSenderType.ADMIN) return;

    try {
      const thread = await this.threadRepository.findOne({
        where: { id: event.threadId } as any,
        relations: { recipient: true } as any,
      });
      if (!thread) return;

      await this.notificationService.send({
        userId: (thread.recipient as any).id,
        title: 'New warning message',
        body: 'Support has sent a message regarding your warning. Tap to view.',
        type: NotificationType.WARNING_THREAD_MESSAGE,
        data: { threadId: event.threadId },
      });
    } catch (err) {
      this.logger.error('Failed to send warning-thread-message notification', err);
    }
  }
}
