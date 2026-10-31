import { BaseEvent } from '../../../events/base.event';
import { WarningSenderType } from '../../../database/common/enum';
import { WarningMessageResponseDto } from '../dto/warning-message-response.dto';

export class WarningMessageCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'warning.message_created';

  constructor(
    public readonly threadId: string,
    public readonly message: WarningMessageResponseDto,
    public readonly recipientId: string,
    public readonly senderType: WarningSenderType,
  ) {
    super(WarningMessageCreatedEvent.EVENT_NAME);
  }
}
