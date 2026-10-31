import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto } from './dto/job-query.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Cached } from '../../cache/decorators/cached.decorator';
import { CacheKey } from '../../cache/decorators/cache-key.decorator';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { invalidateJobViews } from '../../cache/job-view-invalidation';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { AuthenticatedUser } from '@app/shared-types';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { ProviderJobStatusDto } from './dto/provider-job-status.dto';
import { CreateBidDto } from '../bids/dto/create-bid.dto';
import { BidService } from '../bids/bid.service';
import { BidQueryDto } from '../bids/dto/bid-query.dto';
import { JobFeedItemDto } from './dto/job-feed-item.dto';
import { SeekersJobQueryDto } from './dto/seekers-job-query.dto';
import { MyServicesQueryDto } from './dto/my-services-query.dto';
import { MyRequestPaymentQueryDto } from './dto/my-request-payment-query.dto';
import { CreateJobContractDto } from './dto/create-job-contract.dto';
import { JobContractResponseDto } from './dto/job-contract-response.dto';
import { MyServiceResponseDto } from './dto/my-service-response.dto';
import { MyServiceCountsDto } from './dto/my-service-counts.dto';
import { RequestedServiceResponseDto } from './dto/requested-service-response.dto';
import { RequestedServiceCountsDto } from './dto/requested-service-counts.dto';
import { RequestedServicePaymentCountsDto } from './dto/requested-service-payment-counts.dto';
import { RequestedServicePaymentResponseDto } from './dto/requested-service-payment-response.dto';
import { CreateRefundRequestDto, CreateJobResponseDto } from './dto';
import { ProviderRefundRequestQueryDto } from './dto/provider-refund-request-query.dto';
import { ProviderRefundRequestListItemDto } from './dto/provider-refund-request-list-item.dto';
import { ProviderRefundRequestDetailDto } from './dto/provider-refund-request-detail.dto';
import { RejectRefundRequestDto } from './dto/reject-refund-request.dto';
import { CancelJobResponseDto } from './dto/cancel-job-response.dto';
import { IdResponseDto } from '../../interfaces';
import { BidResponseDto } from '../bids/dto/bid-response.dto';
import { JobDetailResponseDto } from './dto/job-detail-response.dto';

import { ContractPdfService } from './contract-pdf.service';

@Controller('jobs')
@UseInterceptors(CacheInterceptor)
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly bidService: BidService,
    private readonly contractPdfService: ContractPdfService,
  ) { }

  // ------ Public endpoints (guest-accessible) ------

  @Get('explore')
  @ApiTags('Public | Jobs')
  @ResponseMessage('Job listings fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:explore:${req.originalUrl}`)
  @ApiOperation({ summary: 'Browse job listings as a guest (title, description, category, location, budget, posted date)' })
  @ApiResponse({ status: 200, description: 'Paginated public job feed', type: JobFeedItemDto, isArray: true })
  explore(@Query() query: JobQueryDto) {
    return this.jobService.findAll(query);
  }

  // ------ Provider endpoints ------

  @Get('feed')
  @ApiTags('Provider | Jobs')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Job feed fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:feed:${req.user?.id}:${req.originalUrl}`)
  @ApiOperation({ summary: 'Get job feed for providers' })
  @ApiResponse({ status: 200, description: 'Paginated job feed', type: JobFeedItemDto, isArray: true })
  getFeed(@Query() query: JobQueryDto) {
    return this.jobService.findAll(query);
  }

  @Get('my-services/counts')
  @ApiTags('Provider | Jobs')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('My service counts fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:my-services-counts:${req.user?.id}`)
  @ApiOperation({ summary: 'Get in-progress and completed counts for the authenticated provider' })
  @ApiResponse({ status: 200, type: MyServiceCountsDto })
  getMyServiceCounts(@CurrentUser() user: AuthenticatedUser) {
    return this.jobService.countMyServices(user.id);
  }

  @Get('my-services')
  @ApiTags('Provider | Jobs')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('My services fetched successfully')
  @ApiOperation({ summary: 'Get jobs assigned to the authenticated provider (My Services)' })
  @ApiResponse({ status: 200, description: 'Paginated list of assigned jobs', type: MyServiceResponseDto, isArray: true })
  getMyServices(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MyServicesQueryDto,
  ) {
    return this.jobService.findMyServices(user.id, query);
  }

  @Get('refund-requests')
  @ApiTags('Provider | Jobs')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Refund requests fetched successfully')
  @ApiOperation({ summary: 'List refund requests submitted against the authenticated provider\'s jobs' })
  @ApiResponse({ status: 200, description: 'Paginated list of refund requests', type: ProviderRefundRequestListItemDto, isArray: true })
  getRefundRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProviderRefundRequestQueryDto,
  ) {
    return this.jobService.findRefundRequestsForProvider(user.id, query);
  }

  @Get('refund-requests/:id')
  @ApiTags('Provider | Jobs')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Refund request details fetched successfully')
  @ApiOperation({ summary: 'Get full details of a refund request for the authenticated provider' })
  @ApiResponse({ status: 200, type: ProviderRefundRequestDetailDto })
  @ApiResponse({ status: 403, description: 'Refund request belongs to a different provider' })
  @ApiResponse({ status: 404, description: 'Refund request not found' })
  getRefundRequestDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.findRefundRequestDetailForProvider(id, user.id);
  }

  @Patch('refund-requests/:id/reject')
  @ApiTags('Provider | Jobs')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Refund request rejected successfully')
  @ApiOperation({ summary: 'Reject a refund request with a reason and optional counter-evidence attachments' })
  @ApiResponse({ status: 200, description: 'Refund request rejected', type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'Refund request is not in pending state' })
  @ApiResponse({ status: 403, description: 'Refund request belongs to a different provider' })
  @ApiResponse({ status: 404, description: 'Refund request not found' })
  async rejectRefundRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectRefundRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.jobService.rejectRefundRequest(id, user.id, dto);
  }

  @Post(':id/bids')
  @ApiTags('Provider | Jobs')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Bid submitted successfully')
  @InvalidateCache(
    ...invalidateJobViews((req: any) => req.params.id, (req: any) => req._seekerId),
    (req: any) => `bids:my:${req.user?.id}:*`,
  )
  @ApiOperation({ summary: 'Submit a bid on a job' })
  @ApiResponse({ status: 201, description: 'Bid submitted successfully', type: IdResponseDto })
  async createBid(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateBidDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<IdResponseDto> {
    const bid = await this.bidService.create(jobId, user.id, dto);
    (req as any)._seekerId = bid.job.seeker.id;
    return { id: bid.id };
  }

  // ------ Seeker endpoints ------

  @Get('my-requests/counts')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Request counts fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:my-requests-counts:${req.user?.id}`)
  @ApiOperation({ summary: 'Get tab counts for seeker requested services (requested, in_progress, completed, cancelled)' })
  @ApiResponse({ status: 200, type: RequestedServiceCountsDto })
  getMyRequestCounts(@CurrentUser() user: AuthenticatedUser) {
    return this.jobService.countRequestedServices(user.id);
  }

  @Get('my-requests')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('My requested services fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:my-requests:${req.user?.id}:${req.originalUrl}`)
  @ApiOperation({ summary: 'Get seeker\'s own posted jobs with bid stats (Requested Services)' })
  @ApiResponse({ status: 200, description: 'Paginated list of requested services', type: RequestedServiceResponseDto, isArray: true })
  getMyRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SeekersJobQueryDto,
  ) {
    return this.jobService.findRequestedServices(user.id, query);
  }

  @Get('my-request-payments/counts')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Payment counts fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:my-request-payments-counts:${req.user?.id}`)
  @ApiOperation({ summary: 'Get tab counts for seeker payment page (all, paid, due, refunded)' })
  @ApiResponse({ status: 200, type: RequestedServicePaymentCountsDto })
  getMyRequestPaymentCounts(@CurrentUser() user: AuthenticatedUser) {
    return this.jobService.countRequestedServicePayments(user.id);
  }

  @Get('my-request-payments')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('My request payments fetched successfully')
  @ApiOperation({ summary: 'Get seeker payments list for requested services (Payments page)' })
  @ApiResponse({ status: 200, description: 'Paginated list of requested services with payment status', type: RequestedServicePaymentResponseDto, isArray: true })
  getMyRequestPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MyRequestPaymentQueryDto,
  ) {
    return this.jobService.findRequestedServicePayments(user.id, query);
  }

  @Post()
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Job created successfully')
  @InvalidateCache(...invalidateJobViews((_req, res) => res?.id, (req: any) => req.user?.id))
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created successfully', type: CreateJobResponseDto })
  async create(@Body() dto: CreateJobDto, @CurrentUser() user: AuthenticatedUser): Promise<CreateJobResponseDto> {
    const job = await this.jobService.create(dto, user.id);
    return { id: job.id, title: job.title, locationText: job.locationText, serviceDuration: job.serviceDuration };
  }

  @Delete(':id')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Job deleted successfully')
  @InvalidateCache(...invalidateJobViews((req: any) => req.params.id, (req: any) => req.user?.id))
  @ApiOperation({ summary: 'Delete a job (seeker only — allowed when status is Posted or Pending)' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 400, description: 'Job cannot be deleted in its current status' })
  @ApiResponse({ status: 403, description: 'You are not the seeker of this job' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  deleteJob(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.jobService.deleteJob(id, user.id);
  }

  @Get(':id/cancel-preview')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Cancellation preview fetched successfully')
  @ApiOperation({ summary: 'Preview the cancellation fee and refund amount before confirming cancellation' })
  @ApiResponse({
    status: 200,
    description: 'Cancellation fee breakdown',
    schema: {
      example: { paidAmount: 250.00, cancellationFee: 25.00, cancellationFeePercent: 10, lateCancellationHours: 48, isLateCancellation: true, refundedAmount: 225.00, currency: 'AUD' },
    },
  })
  @ApiResponse({ status: 400, description: 'Job is not in a cancellable status' })
  @ApiResponse({ status: 403, description: 'You are not the seeker of this job' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  getCancelPreview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.getCancelPreview(id, user.id);
  }

  @Post(':id/cancel')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Job cancelled successfully')
  @InvalidateCache(...invalidateJobViews((req: any) => req.params.id, (req: any) => req.user?.id))
  @ApiOperation({ summary: 'Cancel a job (seeker) — deducts administrative cancellation fee and refunds the remainder' })
  @ApiResponse({ status: 200, type: CancelJobResponseDto, description: 'Job cancelled with refund details' })
  @ApiResponse({ status: 400, description: 'Job is not in a cancellable status' })
  @ApiResponse({ status: 403, description: 'You are not the seeker of this job' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  cancelJob(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.cancelJobBySeeker(id, user.id);
  }

  @Post('refund-request')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Refund request submitted successfully')
  @InvalidateCache(...invalidateJobViews((req: any) => req.body?.jobId, (req: any) => req.user?.id))
  @ApiOperation({ summary: 'Submit a refund request for a completed paid job' })
  @ApiResponse({ status: 201, description: 'Refund request submitted', type: IdResponseDto })
  async createRefundRequest(
    @Body() dto: CreateRefundRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const rr = await this.jobService.createRefundRequest(user.id, dto);
    return { id: rr.id };
  }

  @Put(':id')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Job updated successfully')
  @InvalidateCache(...invalidateJobViews((req: any) => req.params.id, (req: any) => req.user?.id))
  @ApiOperation({ summary: 'Update a job' })
  @ApiResponse({ status: 200, description: 'Job updated successfully', type: IdResponseDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const job = await this.jobService.update(id, dto, user.id);
    return { id: job.id };
  }

  @Get(':id/bids')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Job bids fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:bids:${req.params.id}:${req.originalUrl}`)
  @ApiOperation({ summary: 'List bids for a job' })
  @ApiResponse({ status: 200, description: 'Bids for the job', type: BidResponseDto, isArray: true })
  listBids(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Query() query: BidQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bidService.findByJob(jobId, query, user.id);
  }

  // ------ Contract endpoints (long-duration jobs) ------

  @Post(':id/contract')
  @ApiTags('Seeker | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Job contract created successfully')
  @InvalidateCache(...invalidateJobViews((req: any) => req.params.id, (req: any) => req.user?.id))
  @ApiOperation({ summary: 'Submit contract terms for a long-duration job (after bid selection, before payment)' })
  @ApiResponse({ status: 201, description: 'Contract terms saved', type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'Job is not in SELECTED state, is a single-task job, or contract already exists' })
  async createContract(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateJobContractDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const contract = await this.jobService.createContract(jobId, user.id, dto);
    return { id: contract.id };
  }

  @Get(':id/contract')
  @ApiTags('Common | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Job contract fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:contract:${req.params.id}`)
  @ApiOperation({ summary: 'Get the contract terms for a job' })
  @ApiResponse({ status: 200, description: 'Contract terms', type: JobContractResponseDto })
  @ApiResponse({ status: 404, description: 'No contract found for this job' })
  getContract(
    @Param('id', ParseUUIDPipe) jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.findContract(jobId, user.id);
  }

  @Get(':id/contract/pdf')
  @ApiTags('Common | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ApiParam({ name: 'id', description: 'Job UUID', type: 'string', format: 'uuid' })
  @ApiOperation({ summary: 'Download the service agreement PDF as base64 (available only after successful payment)' })
  @ApiResponse({
    status: 200,
    description: 'Base64-encoded PDF with filename',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', example: 'service-agreement-JOB-000001.pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
        data: { type: 'string', description: 'Base64-encoded PDF content' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Payment not yet succeeded or caller is not the job seeker or provider' })
  @ApiResponse({ status: 404, description: 'Job or contract not found' })
  async downloadContractPdf(
    @Param('id', ParseUUIDPipe) jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ filename: string; mimeType: string; data: string }> {
    const { base64, filename } = await this.contractPdfService.generatePdf(jobId, user.id);
    return { filename, mimeType: 'application/pdf', data: base64 };
  }

  // ------ Common endpoints ------

  @Get(':id')
  @ApiTags('Common | Jobs')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Job details fetched successfully')
  @Cached()
  @CacheKey((req: any) => `jobs:detail:${req.params.id}:${req.user?.id}`)
  @ApiOperation({ summary: 'Get job details' })
  @ApiResponse({ status: 200, description: 'Job detail. If the viewer is the selected provider, also includes selectedBidPrice and paymentStatus.', type: JobDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobService.findOneDetail(id, user.id, user.roles);
  }

  @Patch(':id/status')
  @ApiTags('Provider | Jobs')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Job status updated successfully')
  @InvalidateCache(...invalidateJobViews((req: any) => req.params.id, (req: any) => req._seekerId))
  @ApiOperation({ summary: 'Update job status as provider (SELECTED → IN_PROGRESS → COMPLETED)' })
  @ApiResponse({ status: 200, description: 'Job status updated', type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'You are not the assigned provider for this job' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProviderJobStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<IdResponseDto> {
    const job = await this.jobService.updateStatus(id, user.id, dto);
    (req as any)._seekerId = job.seeker.id;
    return { id: job.id };
  }
}

