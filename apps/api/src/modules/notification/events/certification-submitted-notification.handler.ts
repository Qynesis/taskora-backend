import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notification.service';
import { NotificationType } from '../../../database/common/enum';
import { CertificationSubmittedEvent } from '../../profile/events/certification-submitted.event';
import { Profile } from '../../../database/entities/profile.entity';

@Injectable()
export class CertificationSubmittedNotificationHandler {
  private readonly logger = new Logger(CertificationSubmittedNotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  @OnEvent(CertificationSubmittedEvent.EVENT_NAME)
  async handle(event: CertificationSubmittedEvent): Promise<void> {
    try {
      const profile = await this.profileRepository.findOne({ where: { id: event.profileId } as any });
      const providerName = [profile?.firstName ?? '', profile?.lastName ?? ''].filter(Boolean).join(' ') || 'A provider';
      const verb = event.isUpdate ? 'updated' : 'submitted';

      await this.notificationService.sendToAdmins({
        title: event.isUpdate ? 'Certification updated' : 'Certification submitted',
        body: `${providerName} ${verb} the certification "${event.certificationName}" for review.`,
        type: event.isUpdate ? NotificationType.CERTIFICATION_UPDATED : NotificationType.CERTIFICATION_SUBMITTED,
        data: { profileId: event.profileId, certificationId: event.certificationId },
      });
    } catch (err) {
      this.logger.error('Failed to send certification-submitted notification', err);
    }
  }
}
