import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { VerificationStepSubmittedEvent } from '../../verification/events/verification-step-submitted.event';
import { Profile } from '../../../database/entities/profile.entity';

@Injectable()
export class VerificationSubmittedNotificationHandler {
  private readonly logger = new Logger(VerificationSubmittedNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  @OnEvent(VerificationStepSubmittedEvent.EVENT_NAME)
  async handle(event: VerificationStepSubmittedEvent): Promise<void> {
    try {
      const profile = await this.profileRepository.findOne({ where: { id: event.profileId } as any });
      const providerName = [profile?.firstName ?? '', profile?.lastName ?? ''].filter(Boolean).join(' ') || 'A provider';
      const stepLabel = event.stepType.replace(/_/g, ' ').toLowerCase();

      await this.notificationService.sendToAdmins({
        title: 'Verification submitted',
        body: `${providerName} submitted their ${stepLabel} verification for review.`,
        type: NotificationType.VERIFICATION_SUBMITTED,
        data: { profileId: event.profileId, stepType: event.stepType },
      });
    } catch (err) {
      this.logger.error('Failed to send verification-submitted notification', err);
    }
  }
}
