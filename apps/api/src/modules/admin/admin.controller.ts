import {
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExtraModels, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { SeekerQueryDto } from './dto/seeker-query.dto';
import { SeekerListItemDto } from './dto/seeker-list-item.dto';
import { SeekerDetailDto } from './dto/seeker-detail.dto';
import { ProviderQueryDto } from './dto/provider-query.dto';
import { AdminProviderListItemDto } from './dto/provider-list-item.dto';
import { AdminProviderDetailDto } from './dto/provider-detail.dto';
import { ProviderSummaryDto } from './dto/provider-summary.dto';
import { VerificationSubmissionsQueryDto } from './dto/verification-submissions-query.dto';
import { VerificationCaseResDto, VerificationStepResDto, ALL_STEP_RES_DTOS, BaseVerificationStepResDto } from '../verification/dto';
import { ReviewVerificationStepDto } from './dto/review-verification-step.dto';
import { CertificationStatusQueryDto } from './dto/certification-status-query.dto';
import { ReviewCertificationDto } from './dto/review-certification.dto';
import { CertificationListItemDto } from './dto/certification-list-item.dto';
import { CertificationDetailDto } from './dto/certification-detail.dto';
import { CertificationProviderSummaryDto } from './dto/certification-provider-summary.dto';
import { CertificationQueryDto } from './dto/certification-query.dto';
import { ReportService } from '../reports/report.service';
import { ReportQueryDto } from '../reports/dto/report-query.dto';
import { UpdateReportAdminDto } from '../reports/dto/update-report-admin.dto';
import { SendWarningAdminDto } from '../reports/dto/send-warning-admin.dto';
import { ReportListItemDto } from '../reports/dto/report-list-item.dto';
import { ReportDetailDto } from '../reports/dto/report-detail.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { WarningThreadService } from '../warning/warning-thread.service';
import { SendWarningMessageDto } from '../warning/dto/send-warning-message.dto';
import { WarningRepliesItemDto } from '../warning/dto/warning-replies-item.dto';
import { WarningMessageResponseDto } from '../warning/dto/warning-message-response.dto';
import { WarningThreadQueryDto } from '../warning/dto/warning-thread-query.dto';
import { SupportTicketService } from '../support/support-ticket.service';
import { PdfExportService } from './pdf-export.service';
import { SupportTicketListItemDto } from '../support/dto/support-ticket-list-item.dto';
import { SupportMessageResponseDto } from '../support/dto/support-message-response.dto';
import { SupportTicketQueryDto } from '../support/dto/support-ticket-query.dto';
import { SendSupportMessageDto } from '../support/dto/send-support-message.dto';
import { AuthenticatedUser } from '@app/shared-types';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { RevenueChartDto, JobsChartDto, DashboardChartsQueryDto } from './dto';
import { IdResponseDto, PaginatedResponseDto } from '../../interfaces';
import { AdminPaymentSummaryDto } from './dto/admin-payment-summary.dto';
import { AdminTransactionListItemDto } from './dto/admin-transaction-list-item.dto';
import { AdminPaymentQueryDto } from './dto/admin-payment-query.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationQueryDto } from '../notification/dto/notification-query.dto';
import { AdminBidNotificationDto } from './dto/admin-bid-notification.dto';
import { AuditLogListItemDto } from './dto/audit-log-list-item.dto';
import { AuditQueryDto } from '../audit/dto/audit-query.dto';

@ApiExtraModels(...ALL_STEP_RES_DTOS)
@ApiTags('Admin | Console')
@Controller('admin')
@UseInterceptors(CacheInterceptor)
@ApiAuth()
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly reportService: ReportService,
    private readonly usersService: UsersService,
    private readonly warningThreadService: WarningThreadService,
    private readonly supportTicketService: SupportTicketService,
    private readonly pdfExportService: PdfExportService,
    private readonly notificationService: NotificationService,
  ) { }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  @Get('dashboard/summary')
  @ResponseMessage('Dashboard summary fetched successfully')
  @ApiOperation({summary: 'Summary of total users, jobs, revenue and pending verifications'})
  @ApiResponse({ status: 200, description: 'Dashboard summary', type: DashboardSummaryDto})
  getDashboardSummary(): Promise<DashboardSummaryDto>{
    return this.adminService.dashboardSummary();
  }

  @Get('dashboard/charts/revenue')
  @ResponseMessage('Revenue chart data fetched successfully')
  @ApiOperation({ summary: 'Monthly platform revenue and YoY change for a given year' })
  @ApiResponse({ status: 200, description: 'Revenue chart data', type: RevenueChartDto })
  getRevenueChart(@Query() query: DashboardChartsQueryDto): Promise<RevenueChartDto> {
    return this.adminService.getRevenueChart(query.year);
  }

  @Get('dashboard/charts/jobs')
  @ResponseMessage('Jobs chart data fetched successfully')
  @ApiOperation({ summary: 'Monthly completed vs active jobs and YoY change for a given year' })
  @ApiResponse({ status: 200, description: 'Jobs chart data', type: JobsChartDto })
  getJobsChart(@Query() query: DashboardChartsQueryDto): Promise<JobsChartDto> {
    return this.adminService.getJobsChart(query.year);
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  @Get('notifications/bids')
  @ResponseMessage('Bid notifications fetched successfully')
  @ApiOperation({ summary: 'Get all bid-related notifications across all users' })
  @ApiResponse({ status: 200, type: AdminBidNotificationDto, isArray: true })
  getBidNotifications(@Query() query: NotificationQueryDto) {
    return this.notificationService.findBidNotificationsForAdmin(query);
  }

  // ── Providers ─────────────────────────────────────────────────────────────

  @Get('providers')
  @ResponseMessage('Providers fetched successfully')
  @ApiOperation({ summary: 'List all providers' })
  @ApiResponse({ status: 200, description: 'Paginated list of providers', type: AdminProviderListItemDto, isArray: true })
  getProviders(@Query() query: ProviderQueryDto) {
    return this.adminService.findAllProviders(query);
  }

  // ── Providers Verification ─────────────────────────────────────────────────────────────

  @Get('providers/verification-submissions')
  @ResponseMessage('Verification submissions fetched successfully')
  @ApiOperation({ summary: 'List all providers who have submitted verification documents' })
  @ApiResponse({ status: 200, description: 'Providers with verification submissions', type: ProviderSummaryDto, isArray: true })
  getVerificationSubmissions(@Query() query: VerificationSubmissionsQueryDto) {
    return this.adminService.getVerificationSubmissions(query);
  }

  @Get('providers/:id')
  @ResponseMessage('Provider details fetched successfully')
  @ApiOperation({ summary: 'Get provider detail' })
  @ApiResponse({ status: 200, description: 'Provider details with recent activity', type: AdminProviderDetailDto })
  getProvider(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneProvider(id);
  }

  @Get('providers/:id/verification')
  @ResponseMessage('Provider verification case fetched successfully')
  @ApiOperation({ summary: 'Get provider verification case and all submitted steps (each step includes its id for review)' })
  @ApiResponse({ status: 200, description: 'Verification case with steps', type: VerificationCaseResDto })
  getProviderVerification(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getProviderVerificationCase(id);
  }

  @Patch('providers/verification/steps/:stepId')
  @InvalidateCache('verification-docs:case')
  @ResponseMessage('Verification step reviewed successfully')
  @ApiOperation({ summary: 'Approve or reject a single verification step' })
  @ApiResponse({ status: 200, description: 'Updated step', type: BaseVerificationStepResDto })
  reviewVerificationStep(
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: ReviewVerificationStepDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminService.reviewVerificationStep(stepId, dto, admin.id);
  }

  // ── Seekers ───────────────────────────────────────────────────────────────

  @Get('seekers')
  @ResponseMessage('Seekers fetched successfully')
  @ApiOperation({ summary: 'List all seekers' })
  @ApiResponse({ status: 200, description: 'Paginated list of seekers', type: SeekerListItemDto, isArray: true })
  getSeekers(@Query() query: SeekerQueryDto) {
    return this.adminService.findAllSeekers(query);
  }

  @Get('seekers/:id')
  @ResponseMessage('Seeker details fetched successfully')
  @ApiOperation({ summary: 'Get seeker detail' })
  @ApiResponse({ status: 200, description: 'Seeker details with recent activity', type: SeekerDetailDto })
  getSeeker(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneSeeker(id);
  }

  // ── User Account Actions ───────────────────────────────────────────────────

  @Patch('users/:id/deactivate')
  @InvalidateCache('users:list')
  @ResponseMessage('User deactivated successfully')
  @ApiOperation({ summary: 'Deactivate a user account' })
  @ApiResponse({ status: 200, description: 'User deactivated', type: IdResponseDto })
  async deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const user = await this.usersService.deactivate(id, admin.id);
    return { id: user.id };
  }

  @Patch('users/:id/reactivate')
  @InvalidateCache('users:list')
  @ResponseMessage('User reactivated successfully')
  @ApiOperation({ summary: 'Reactivate a user account' })
  @ApiResponse({ status: 200, description: 'User reactivated', type: IdResponseDto })
  async reactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const user = await this.usersService.reactivate(id, admin.id);
    return { id: user.id };
  }

  @Post('users/:id/suspend')
  @InvalidateCache('users:list')
  @ResponseMessage('User suspended successfully')
  @ApiOperation({ summary: 'Suspend a user account (soft-deletes and blocks platform access)' })
  @ApiResponse({ status: 201, description: 'User suspended', type: IdResponseDto })
  async suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const user = await this.usersService.suspend(id, admin.id);
    await this.reportService.markAsSuspended(dto.reportId, admin.id);
    return { id: user.id };
  }

  // ── User Reports ──────────────────────────────────────────────────────────

  @Get('reports')
  @ResponseMessage('Reports fetched successfully')
  @ApiOperation({ summary: 'List all user reports' })
  @ApiResponse({ status: 200, description: 'Paginated list of reports', type: ReportListItemDto, isArray: true })
  getReports(@Query() query: ReportQueryDto) {
    return this.reportService.findAll(query);
  }

  @Get('reports/:id')
  @ResponseMessage('Report details fetched successfully')
  @ApiOperation({ summary: 'Get a single user report' })
  @ApiResponse({ status: 200, description: 'Report details', type: ReportDetailDto })
  getReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportService.findOne(id);
  }

  @Patch('reports/:id')
  @InvalidateCache('reports:list')
  @ResponseMessage('Report updated successfully')
  @ApiOperation({ summary: 'Update status, notes, or assignment of a user report' })
  @ApiResponse({ status: 200, description: 'Report updated', type: ReportDetailDto })
  updateReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportAdminDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.reportService.updateAdmin(id, dto, admin.id);
  }

  @Post('reports/:id/warn')
  @InvalidateCache('reports:list')
  @ResponseMessage('Warning sent successfully')
  @ApiOperation({ summary: 'Send a warning to the subject user of a report (sets 14-day resolution deadline)' })
  @ApiResponse({ status: 201, description: 'Warning sent, report status set to warning_sent', type: ReportDetailDto })
  sendWarning(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendWarningAdminDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportService.sendWarning(id, dto, user.id);
  }

  // ── Warning Threads ───────────────────────────────────────────────────────

  @Get('warning-threads/:id/export.pdf')
  @ResponseMessage('Warning thread exported successfully')
  @ApiOperation({ summary: 'Export a warning thread conversation as a base64-encoded PDF' })
  @ApiResponse({
    status: 200,
    description: 'Base64-encoded PDF of the warning thread conversation',
    schema: {
      type: 'object',
      properties: {
        data:     { type: 'string', description: 'Base64-encoded PDF content', example: 'JVBERi0xLjQK...' },
        filename: { type: 'string', example: 'warning-thread-3f2a1b4c-....pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Warning thread not found' })
  exportWarningThreadPdf(@Param('id', ParseUUIDPipe) id: string) {
    return this.pdfExportService.exportWarningThread(id);
  }

  @Get('warning-threads')
  @ResponseMessage('Warning threads fetched successfully')
  @ApiOperation({ summary: 'List all warning threads (admin inbox)' })
  @ApiResponse({ status: 200, type: WarningRepliesItemDto, isArray: true })
  getAllWarningThreads(@Query() query: WarningThreadQueryDto) {
    return this.warningThreadService.findAllThreads(query);
  }

  @Get('warning-threads/replies')
  @ResponseMessage('Warning thread replies fetched successfully')
  @ApiOperation({ summary: 'List warning threads with unread user replies' })
  @ApiResponse({ status: 200, type: WarningRepliesItemDto, isArray: true })
  getWarningThreadReplies(@Query() query: WarningThreadQueryDto) {
    return this.warningThreadService.findWithUserReplies(query);
  }

  @Post('warning-threads/:id/close')
  @HttpCode(200)
  @ResponseMessage('Warning thread closed and report resolved successfully')
  @ApiOperation({ summary: 'Close a warning thread and mark the linked report as resolved' })
  @ApiResponse({ status: 200 })
  async closeWarningThread(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<void> {
    const { reportId } = await this.warningThreadService.closeThread(id);
    await this.reportService.markAsResolved(reportId, admin.id);
  }

  @Get('warning-threads/:id/messages')
  @ResponseMessage('Warning thread messages fetched successfully')
  @ApiOperation({ summary: 'Get messages in a warning thread (admin view, paginated)' })
  @ApiResponse({ status: 200, type: WarningMessageResponseDto, isArray: true })
  getWarningThreadMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: WarningThreadQueryDto,
  ) {
    return this.warningThreadService.findMessages(id, query);
  }

  @Post('warning-threads/:id/messages')
  @ResponseMessage('Warning thread message sent successfully')
  @ApiOperation({ summary: 'Send an admin message to a warning thread' })
  @ApiResponse({ status: 201, type: WarningMessageResponseDto })
  sendWarningThreadMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendWarningMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.warningThreadService.sendAdminMessage(id, user.id, dto);
  }

  // ── Support Tickets ───────────────────────────────────────────────────────

  @Get('support-tickets/:id/export.pdf')
  @ResponseMessage('Support ticket exported successfully')
  @ApiOperation({ summary: 'Export a support ticket conversation as a base64-encoded PDF' })
  @ApiResponse({
    status: 200,
    description: 'Base64-encoded PDF of the support ticket conversation',
    schema: {
      type: 'object',
      properties: {
        data:     { type: 'string', description: 'Base64-encoded PDF content', example: 'JVBERi0xLjQK...' },
        filename: { type: 'string', example: 'support-ticket-3f2a1b4c-....pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Support ticket not found' })
  exportSupportTicketPdf(@Param('id', ParseUUIDPipe) id: string) {
    return this.pdfExportService.exportSupportTicket(id);
  }

  @Get('support-tickets')
  @ResponseMessage('Support tickets fetched successfully')
  @ApiOperation({ summary: 'List all support tickets (admin view)' })
  @ApiResponse({ status: 200, type: SupportTicketListItemDto, isArray: true })
  getAllSupportTickets(@Query() query: SupportTicketQueryDto) {
    return this.supportTicketService.findAllTickets(query);
  }


  @Get('support-tickets/:id/messages')
  @ResponseMessage('Support ticket messages fetched successfully')
  @ApiOperation({ summary: 'Get messages in a support ticket (admin view, paginated)' })
  @ApiResponse({ status: 200, type: SupportMessageResponseDto, isArray: true })
  getSupportTicketMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SupportTicketQueryDto,
  ) {
    return this.supportTicketService.findMessages(id, query);
  }

  @Post('support-tickets/:id/messages')
  @ResponseMessage('Support ticket message sent successfully')
  @ApiOperation({ summary: 'Send an admin message to a support ticket' })
  @ApiResponse({ status: 201, type: SupportMessageResponseDto })
  sendSupportTicketMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendSupportMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.supportTicketService.sendAdminMessage(id, user.id, dto);
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  @Get('payments/summary')
  @ResponseMessage('Payment summary fetched successfully')
  @ApiOperation({ summary: 'Platform financial overview: revenue, transaction count, total refunded' })
  @ApiResponse({ status: 200, description: 'Payment summary', type: AdminPaymentSummaryDto })
  getPaymentSummary(): Promise<AdminPaymentSummaryDto> {
    return this.adminService.getPaymentSummary();
  }

  @Get('payments')
  @ResponseMessage('Transaction list fetched successfully')
  @ApiOperation({ summary: 'Paginated list of all platform transactions (payments + refunds)' })
  @ApiResponse({ status: 200, description: 'Paginated transactions', type: AdminTransactionListItemDto, isArray: true })
  getTransactionList(@Query() query: AdminPaymentQueryDto) {
    return this.adminService.getTransactionList(query);
  }

  @Get('exports/payments.csv')
  @ResponseMessage('Payments exported successfully')
  @ApiOperation({ summary: 'Export all transactions as base64-encoded CSV' })
  @ApiResponse({ status: 200, description: 'Base64 CSV string with filename', type: Object })
  exportPaymentsCsv() {
    return this.adminService.exportPaymentsCsv();
  }

  // ── Certifications ────────────────────────────────────────────────────────

  @Get('providers/:id/certifications')
  @ResponseMessage('Provider certifications fetched successfully')
  @ApiOperation({ summary: 'List all certifications for a specific provider' })
  @ApiResponse({ status: 200, description: 'List of certifications', type: CertificationListItemDto, isArray: true })
  getProviderCertifications(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getCertificationsByProvider(id);
  }

  @Get('certifications')
  @ResponseMessage('Certifications fetched successfully')
  @ApiOperation({ summary: 'Paginated list of providers who submitted certifications, showing latest cert status' })
  @ApiResponse({ status: 200, type: CertificationProviderSummaryDto, isArray: true })
  getAllCertifications(@Query() query: CertificationQueryDto) {
    return this.adminService.getAllCertifications(query);
  }

  @Get('certifications/:id')
  @ResponseMessage('Certification details fetched successfully')
  @ApiOperation({ summary: 'Get full certification details for admin review' })
  @ApiResponse({ status: 200, description: 'Certification details', type: CertificationDetailDto })
  @ApiResponse({ status: 404, description: 'Certification not found' })
  getCertification(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getCertificationById(id);
  }

  @Patch('certifications/:id')
  @InvalidateCache('certifications')
  @ResponseMessage('Certification reviewed successfully')
  @ApiOperation({ summary: 'Accept or reject a provider certification' })
  @ApiResponse({ status: 200, description: 'Updated certification', type: CertificationDetailDto })
  reviewCertification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewCertificationDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.adminService.reviewCertification(id, dto.status, admin.id);
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @ResponseMessage('Audit logs fetched successfully')
  @ApiOperation({ summary: 'List all audit logs' })
  @ApiResponse({ status: 200, description: 'Paginated audit log', type: AuditLogListItemDto, isArray: true })
  getAuditLogs(@Query() query: AuditQueryDto): Promise<PaginatedResponseDto<AuditLogListItemDto>> {
    return this.adminService.getAuditLogs(query);
  }
}
