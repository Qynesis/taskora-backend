import { BaseEvent } from '../../../events/base.event';

export class SupportTicketCreatedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'support.ticket_created';

  constructor(
    public readonly ticketId: string,
    public readonly userId: string,
    public readonly subject: string,
  ) {
    super(SupportTicketCreatedEvent.EVENT_NAME);
  }
}
