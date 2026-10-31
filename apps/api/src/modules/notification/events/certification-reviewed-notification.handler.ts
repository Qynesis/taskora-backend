import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification.service';
import { NotificationType, CertificationStatus } from '../../../database/common/enum';
import { CertificationReviewedEvent } from '../../profile/events/certification-reviewed.event';
import { Profile } from '../../../database/entities/profile.entity';

@Injectable()
export class CertificationReviewedNotificationHandler {
  private readonly logger = new Logger(CertificationReviewedNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  @OnEvent(CertificationReviewedEvent.EVENT_NAME)
  async handle(event: CertificationReviewedEvent): Promise<void> {
    try {
      const profile = await this.profileRepository.findOne({
        where: { id: event.profileId } as any,
        relations: { user: true } as any,
      });
      if (!profile) return;

      const isAccepted = event.status === CertificationStatus.ACCEPTED;

      await this.notificationService.send({
        userId: (profile as any).user.id,
        title: isAccepted ? 'Certification approved' : 'Certification rejected',
        body: isAccepted
          ? `Your certification "${event.certificationName}" has been approved.`
          : `Your certification "${event.certificationName}" was rejected. Please review and resubmit.`,
        type: NotificationType.CERTIFICATION_REVIEWED,
        data: { certificationId: event.certificationId, status: event.status },
      });
    } catch (err) {
      this.logger.error('Failed to send certification-reviewed notification', err);
    }
  }
}
