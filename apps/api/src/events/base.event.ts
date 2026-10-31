export abstract class BaseEvent {
  public readonly occurredAt: Date;

  constructor(public readonly eventName: string) {
    this.occurredAt = new Date();
  }
}
