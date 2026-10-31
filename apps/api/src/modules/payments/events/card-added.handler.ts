import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardAddedEvent } from './card-added.event';
import { SavedPaymentMethod } from '../../../database/entities/saved-payment-method.entity';
import { User } from '../../../database/entities/user.entity';

/**
 * Event handler for CardAddedEvent
 * Saves the new payment method to the SavedPaymentMethod table
 * This runs after the Stripe setup_intent.succeeded webhook is received
 */
@Injectable()
export class CardAddedHandler {
  private readonly logger = new Logger(CardAddedHandler.name);

  constructor(
    @InjectRepository(SavedPaymentMethod)
    private readonly savedPaymentMethodRepository: Repository<SavedPaymentMethod>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @OnEvent(CardAddedEvent.EVENT_NAME)
  async handle(event: CardAddedEvent): Promise<void> {
    try {
      // Fetch the user
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
      });

      if (!user) {
        this.logger.warn(`User not found: ${event.userId} for card setup`);
        return;
      }

      // Duplicate card check: same fingerprint means same physical card number.
      // Also guards against duplicate webhook events (setup_intent.succeeded +
      // checkout.session.completed both fire for the same checkout session).
      if (event.fingerprint) {
        const duplicate = await this.savedPaymentMethodRepository.findOne({
          where: { seeker: { id: event.userId }, fingerprint: event.fingerprint },
        });
        if (duplicate) {
          this.logger.log(
            `Card already on file for user (fingerprint match), skipping: userId="${event.userId}" fingerprint="${event.fingerprint}"`,
          );
          return;
        }
      } else {
        const duplicate = await this.savedPaymentMethodRepository.findOne({
          where: { stripePaymentMethodId: event.stripePaymentMethodId },
        });
        if (duplicate) {
          this.logger.log(`Payment method already saved, skipping duplicate event: ${event.stripePaymentMethodId}`);
          return;
        }
      }

      // Create and save the payment method record
      const savedPaymentMethod = this.savedPaymentMethodRepository.create({
        seeker: user,
        stripePaymentMethodId: event.stripePaymentMethodId,
        brand: event.brand,
        last4: event.last4,
        expMonth: event.expMonth,
        expYear: event.expYear,
        isDefault: false,
        fingerprint: event.fingerprint ?? null,
      });

      await this.savedPaymentMethodRepository.save(savedPaymentMethod);

      this.logger.log(
        `Card added successfully: userId="${event.userId}", paymentMethodId="${event.stripePaymentMethodId}", last4="${event.last4}", brand="${event.brand}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle CardAddedEvent for userId ${event.userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Do not re-throw here; webhook should return 200 even if event handling fails
      // The webhook can be replayed if needed
    }
  }
}
