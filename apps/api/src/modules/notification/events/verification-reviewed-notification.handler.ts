import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification.service';
import { NotificationType, VerificationStatus } from '../../../database/common/enum';
import { VerificationStepReviewedEvent } from '../../verification/events/verification-step-reviewed.event';
import { Profile } from '../../../database/entities/profile.entity';

@Injectable()
export class VerificationReviewedNotificationHandler {
  private readonly logger = new Logger(VerificationReviewedNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  @OnEvent(VerificationStepReviewedEvent.EVENT_NAME)
  async handle(event: VerificationStepReviewedEvent): Promise<void> {
    try {
      const profile = await this.profileRepository.findOne({
        where: { id: event.profileId } as any,
        relations: { user: true } as any,
      });
      if (!profile) return;

      const isApproved = event.status === VerificationStatus.APPROVED;
      const stepLabel = event.stepType.replace(/_/g, ' ').toLowerCase();

      await this.notificationService.send({
        userId: (profile as any).user.id,
        title: isApproved ? 'Verification approved' : 'Verification rejected',
        body: isApproved
          ? `Your ${stepLabel} verification has been approved.`
          : `Your ${stepLabel} verification was rejected. ${event.rejectionNote ?? 'Please resubmit with the correct documents.'}`,
        type: NotificationType.VERIFICATION_REVIEWED,
        data: { stepId: event.stepId, stepType: event.stepType, status: event.status },
      });
    } catch (err) {
      this.logger.error('Failed to send verification-reviewed notification', err);
    }
  }
}
