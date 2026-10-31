import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseEvent } from './base.event';

/**
 * Type-safe wrapper around EventEmitter2 for domain events.
 *
 * Domain events are for intra-application communication within the same process.
 * They are synchronous by default and do NOT survive process restarts.
 *
 * For durable, cross-process work (e.g., sending emails, generating reports),
 * use BullMQ queue jobs instead. See QueueDispatcher for that pattern.
 */
@Injectable()
export class DomainEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<T extends BaseEvent>(event: T): void {
    this.eventEmitter.emit(event.eventName, event);
  }
}
