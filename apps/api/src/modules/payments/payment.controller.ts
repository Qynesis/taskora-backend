import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { SetDefaultCardDto } from './dto/set-default-card.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { ConnectStatusResponseDto, JobCheckoutResponseDto, PaymentDetailsResponseDto, ProviderEarningsSummaryDto, ProviderPaymentListItemDto, SavedCardResponseDto } from './dto/payment-response.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { AddCardResponseDto } from './dto/add-card-response.dto';
import { GetConnectStatusDto } from './dto/payment-request.dto';
import { RefundInitiatedResponseDto } from './dto/refund-response.dto';
import { IdResponseDto } from '../../interfaces';

@Controller('payments')
@UseInterceptors(CacheInterceptor)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ── Stripe Connect (Providers) ────────────────────────────────────────────

  @Get('connect/status')
  @ApiTags('Provider | Payments')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Stripe Connect status fetched successfully')
  @ApiOperation({ summary: 'Get Stripe Connect account status (provider)' })
  @ApiResponse({ status: 200, description: 'Stripe Connect account status', type: ConnectStatusResponseDto })
  @ApiResponse({ status: 400, description: 'Stripe account not found for this user' })
  async getConnectStatus(@CurrentUser() user: AuthenticatedUser): Promise<ConnectStatusResponseDto> {
    const dto: GetConnectStatusDto = { id: user.id };
    return this.paymentService.getConnectStatus(dto);
  }

  // ── Saved Cards (must be before /:id to avoid route conflict) ────────────

  @Get('cards')
  @ApiTags('Seeker | Cards')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Payment cards fetched successfully')
  @ApiOperation({ summary: 'Get saved payment cards' })
  @ApiResponse({ status: 200, description: 'Card information fetched', type: SavedCardResponseDto })
  getSavedCards(@CurrentUser() user: AuthenticatedUser): Promise<SavedCardResponseDto[]> {
    return this.paymentService.getSavedCards(user.id);
  }

  @Get('cards/verify-add')
  @ApiTags('Seeker | Cards')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Card add status verified')
  @ApiOperation({ summary: 'Check whether a card was saved after Stripe checkout redirect' })
  @ApiResponse({ status: 200, description: '"saved" | "duplicate" | "pending"' })
  async verifyCardAdd(
    @Query('session_id') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: 'saved' | 'duplicate' | 'pending' }> {
    if (!sessionId) throw new BadRequestException('session_id is required');
    return this.paymentService.verifyCardAdd(user.id, sessionId);
  }

  @Post('cards/add')
  @ApiTags('Seeker | Cards')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Card addition initiated successfully')
  @ApiOperation({ summary: 'Initiate card addition - returns Stripe checkout URL' })
  @ApiResponse({ status: 201, description: 'Setup URL generated', type: AddCardResponseDto })
  @ApiResponse({ status: 400, description: 'Stripe customer account does not exist' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async addCard(@CurrentUser() user: AuthenticatedUser): Promise<AddCardResponseDto> {
    const successUrl = process.env['STRIPE_CARD_SUCCESS_URL'] ?? 'http://localhost:3000/cards?added=true';
    const cancelUrl = process.env['STRIPE_CARD_CANCEL_URL'] ?? 'http://localhost:3000/cards';
    return this.paymentService.addCard(user.id, successUrl, cancelUrl);
  }

  @Patch('cards/:id/default')
  @ApiTags('Seeker | Cards')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Default card updated successfully')
  @ApiOperation({ summary: 'Set a card as the default payment method or unset it' })
  @ApiResponse({ status: 200, description: 'Default card updated', type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'Card not found' })
  async setDefaultCard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetDefaultCardDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    await this.paymentService.setDefaultCard(user.id, id, dto.is_default);
    return { id };
  }

  @Delete('cards/:id')
  @ApiTags('Seeker | Cards')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Payment card removed successfully')
  @ApiOperation({ summary: 'Remove a saved payment card' })
  @ApiResponse({ status: 200, description: 'Card removed', type: Object })
  @ApiResponse({ status: 400, description: 'Card not found' })
  removeCard(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<null> {
    return this.paymentService.removeCard(user.id, id);
  }

  // ── Unified Job Checkout ──────────────────────────────────────────────────

  @Post(':jobId/checkout')
  @ApiTags('Seeker | Payments')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Checkout session created successfully')
  @ApiOperation({ summary: 'Initiate payment checkout for a job (single-task or long-term subscription)' })
  @ApiResponse({ status: 201, description: 'Checkout session URL and ID', type: JobCheckoutResponseDto })
  @ApiResponse({ status: 400, description: 'No bid selected, no contract, or provider not configured' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async jobCheckout(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<JobCheckoutResponseDto> {
    return this.paymentService.initiateJobCheckout(jobId, user.id);
  }

  @Get('provider/list')
  @ApiTags('Provider | Payments')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Payment list fetched successfully')
  @ApiOperation({ summary: 'Get paginated payment history for the authenticated provider' })
  @ApiResponse({ status: 200, description: 'Paginated list of payments', type: ProviderPaymentListItemDto, isArray: true })
  getProviderPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentService.getProviderPayments(user.id, query);
  }

  @Get('provider/summary')
  @ApiTags('Provider | Payments')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Earnings summary fetched successfully')
  @ApiOperation({ summary: 'Get total earnings, pending and refunded amounts for the authenticated provider' })
  @ApiResponse({ status: 200, description: 'Provider earnings summary', type: ProviderEarningsSummaryDto })
  getEarningsSummary(@CurrentUser() user: AuthenticatedUser): Promise<ProviderEarningsSummaryDto> {
    return this.paymentService.getProviderEarningsSummary(user.id);
  }

  @Get(':id')
  @ApiTags('Common | Payments')
  @ApiAuth()
  @ResponseMessage('Payment details fetched successfully')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details', type: PaymentDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentDetails(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaymentDetailsResponseDto> {
    return this.paymentService.getPaymentDetails(id, user.id, user.roles);
  }

  @Post(':id/refund')
  @ApiTags('Provider | Payments')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Refund processed successfully')
  @ApiOperation({ summary: 'Process a refund for a payment (provider approves the seeker\'s refund request)' })
  @ApiResponse({ status: 201, description: 'Refund issued via Stripe', type: RefundInitiatedResponseDto })
  @ApiResponse({ status: 400, description: 'Payment not in succeeded state, or no pending refund request' })
  @ApiResponse({ status: 403, description: 'Payment does not belong to this provider' })
  @ApiResponse({ status: 404, description: 'Payment or refund request not found' })
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RefundInitiatedResponseDto> {
    return this.paymentService.processRefund(id, user.id);
  }
}
