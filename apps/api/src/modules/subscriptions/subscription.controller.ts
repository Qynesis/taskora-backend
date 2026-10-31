import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CheckoutSubscriptionDto } from './dto/checkout-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import {
  SubscriptionCancellationResponseDto,
  SubscriptionDetailsResponseDto,
  SubscriptionPeriodResponseDto,
} from './dto/subscription-response.dto';
import { SelectionCheckoutSessionResponseDto } from './dto/selection-checkout-session-response.dto';

@ApiTags('Common | Subscriptions')
@Controller('subscriptions')
@UseInterceptors(CacheInterceptor)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('checkout')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Subscription checkout session created successfully')
  @ApiOperation({ summary: 'Initiate subscription payment for a long-term job' })
  @ApiResponse({ status: 201, description: 'Checkout session created', type: SelectionCheckoutSessionResponseDto })
  @ApiResponse({ status: 400, description: 'No bid selected, no contract, or provider not configured' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async checkout(
    @Body() dto: CheckoutSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SelectionCheckoutSessionResponseDto> {
    return await this.subscriptionService.initiateJobSubscriptionCheckout(dto.jobId, user.id);
  }

  @Get(':jobId')
  @ApiAuth()
  @ResponseMessage('Subscription details fetched successfully')
  @ApiOperation({
    summary: 'Get the subscription for a job',
    description: 'Keyed on the job id; the Stripe subscription is resolved server-side.',
  })
  @ApiResponse({ status: 200, description: 'Subscription details', type: SubscriptionDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscriptionById(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubscriptionDetailsResponseDto> {
    return await this.subscriptionService.getSubscriptionById(jobId, user.id, user.roles);
  }

  @Post(':jobId/cancel')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Subscription cancellation requested successfully')
  @ApiOperation({
    summary: 'Request subscription cancellation for a job (14-day notice period)',
    description:
      'Keyed on the job id — the ongoing subscription for that job is resolved server-side. ' +
      'The Stripe subscription id is never exposed to clients.',
  })
  @ApiResponse({ status: 200, description: 'Cancellation request submitted', type: SubscriptionCancellationResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancel(
    @Param('jobId') jobId: string,
    @Body() dto: CancelSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubscriptionCancellationResponseDto> {
    return await this.subscriptionService.cancelSubscription(jobId, dto, user.id, user.roles);
  }

  @Get(':jobId/period')
  @ApiAuth()
  @ResponseMessage('Subscription period fetched successfully')
  @ApiOperation({
    summary: 'Get current period details for a job’s subscription',
    description: 'Keyed on the job id; the Stripe subscription is resolved server-side.',
  })
  @ApiResponse({ status: 200, description: 'Subscription period details', type: SubscriptionPeriodResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getPeriod(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubscriptionPeriodResponseDto> {
    return await this.subscriptionService.getSubscriptionPeriodDetails(jobId, user.id, user.roles);
  }
}
