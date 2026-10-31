import { ForbiddenException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeCustomer } from '../../database/entities/stripe-customer.entity';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { BillingCustomerCreatedEvent } from './events/billing-customer-created.event';
import { CreateCustomerDto, GetCustomerDto } from './dto/request.dto';
import { Profile, User } from '../../database';
import { CreateCustomerResponseDto, GetCustomerStatusResponseDto } from './dto/response.dto';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class BillingService {
    constructor(
        private readonly txHelper: TransactionHelper,
        private readonly eventEmitter: DomainEventEmitter,
        private readonly stripeService: StripeService,

        @InjectRepository(StripeCustomer) private readonly stripeCustomerRepository: Repository<StripeCustomer>,
        @InjectRepository(Profile) private readonly profileRepository: Repository<Profile>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) {}

    // -------------------Stripe Customer-------------------
    
    /**
     * Creates a Stripe customer account for a seeker.
     * Idempotent operation - returns existing customer ID if already created.
     * 
     * @param dto - Contains user ID and email
     * @returns Customer ID from Stripe
     * @throws ForbiddenException - If user profile is incomplete
     */
    async createCustomer(dto: CreateCustomerDto): Promise<CreateCustomerResponseDto>{
        
        // Step 1: Check if customer already exists in database
        // Idempotent behavior - return existing customer ID without re-creating
        const existingCustomer = await this.stripeCustomerRepository.findOne({
            where: { seeker: { id: dto.id } }
        });
        
        if (existingCustomer) {
            return { customer_id: existingCustomer.customerId };
        }

        // Step 2: Validate user profile exists and has required fields
        const userProfile = await this.profileRepository.findOne({
            where: { user_id: dto.id },
            select: { firstName: true, lastName: true }
        });
        
        if (!userProfile || !userProfile.firstName || !userProfile.lastName) {
            throw new ForbiddenException(
                'Cannot create customer account. Please complete your profile information (first name and last name required).'
            );
        }

        const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();

        // Step 3: Create customer in Stripe
        const stripeCustomer = await this.stripeService.create(fullName, dto.email, dto.id);

        // Step 4: Save customer mapping in database within transaction
        await this.txHelper.run(async (qr) => {
            const stripeCustomerRepo = qr.manager.getRepository(StripeCustomer);

            const newCustomer = stripeCustomerRepo.create({
                seeker: { id: dto.id },
                customerId: stripeCustomer.id
            });

            await stripeCustomerRepo.save(newCustomer);
        });

        // Step 5: Emit domain event for successful customer creation
        this.eventEmitter.emit(
            new BillingCustomerCreatedEvent(dto.id, stripeCustomer.id)
        );

        return { customer_id: stripeCustomer.id };
    }

    // get stripe customer account record
    async getCustomer(dto: GetCustomerDto): Promise<GetCustomerStatusResponseDto> {
        const {id} = dto;

        // Validate existing stripe account
        const existingStripAccount = await this.stripeCustomerRepository.findOne({
            where: {seeker: {id: dto.id}}
        });
        if(!existingStripAccount) throw new NotFoundException('Stripe customer accoount does not exist.');

        // fetch customer details from stripe
        const stripeCustomer = await this.stripeService.customerRetrieve(existingStripAccount.customerId);
        if(stripeCustomer.deleted) throw new GoneException('This billing account has been removed from stripe');

        const response: GetCustomerStatusResponseDto = {
            customerId: stripeCustomer.id,
            email: stripeCustomer.email,
            name: stripeCustomer.name,
            hasDefaultPaymentMethod: !!stripeCustomer.invoice_settings.default_payment_method || !!stripeCustomer.default_source
        };
        return response;
    }
}
