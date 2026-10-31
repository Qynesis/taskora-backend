import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfessionalDetailsDto } from './dto/update-professional-details.dto';
import { PatchProfessionalDetailsDto } from './dto/patch-professional-details.dto';
import { UpdateWorkInfoDto } from './dto/update-work-info.dto';
import { PatchWorkInfoDto } from './dto/patch-work-info.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { PatchEmployeeDto } from './dto/patch-employee.dto';
import { CreateBankDetailsDto } from './dto/create-bank-details.dto';
import { PatchBankDetailsDto } from './dto/patch-bank-details.dto';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { PatchCertificationDto } from './dto/patch-certification.dto';
import { WorkInfoResponseDto } from './dto/work-info-response.dto';
import { ActionResponseDto } from './dto/action-response.dto';
import { ProfileStatusDto } from './dto/profile-completeness.dto';
import { MyProfileResDto } from './dto/my-profile-res.dto';
import { VerifyOtpDto, PhoneVerifiedResDto } from './dto/phone-otp.dto';

import { StripeOnboardingStatusDto } from './dto/stripe-onboarding-status.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Cached } from '../../cache/decorators/cached.decorator';
import { CacheKey } from '../../cache/decorators/cache-key.decorator';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { ProviderProfessionalDetails } from '../../database/entities/provider_professional_details.entity';
import { ProviderEmployee } from '../../database/entities/provider_employee.entity';
import { ProviderBankDetails } from '../../database/entities/provider_bank_details.entity';
import { ProviderCertification } from '../../database/entities/provider_certification.entity';
import { IdResponseDto } from '../../interfaces';
import { UsersService } from '../users/users.service';

@Controller('me')
@UseInterceptors(CacheInterceptor)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly usersService: UsersService,
  ) { }

  // ─── Basic Profile ──────────────────────────────────────────────────────────

  @Get()
  @ApiTags('Common | My Profile')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Profile fetched successfully')
  @Cached()
  @CacheKey((req: any) => `me:profile:${req.user?.id}`)
  @ApiOperation({ summary: 'Get current user basic profile. Providers also get a `locked` flag (name/DOB frozen after identity approval); seekers do not.' })
  @ApiResponse({ status: 200, type: MyProfileResDto })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const { nameLocked, ...profile } = await this.profileService.findOne(user.id);
    return user.roles?.includes(Role.PROVIDER) ? { ...profile, locked: nameLocked } : profile;
  }

  @Get('profile-completeness')
  @ApiTags('Common | My Profile')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Profile completeness fetched successfully')
  @ApiOperation({ summary: 'Get profile completeness percentage and missing fields' })
  @ApiResponse({ status: 200, type: ProfileStatusDto })
  getProfileCompleteness(@CurrentUser() user: AuthenticatedUser) {
    const isProvider = user.roles.includes(Role.PROVIDER);
    return this.profileService.getCompleteness(user.id, isProvider);
  }

  @Post('profile')
  @ApiTags('Common | My Profile')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Profile created successfully')
  @InvalidateCache((req: any) => `me:profile:${req.user?.id}`)
  @ApiOperation({ summary: 'Create profile' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async createProfile(
    @Body() dto: CreateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    // Self-heal: a fresh account may create its profile before the frontend calls
    // POST /users/sync, which would trip the profiles_user_id foreign key. Provision the
    // user row from the verified JWT first (idempotent) so onboarding never dead-ends.
    await this.usersService.ensureSynced(user);
    const profile = await this.profileService.create(user.id, dto);
    return { id: profile.id };
  }

  @Patch('profile')
  @ApiTags('Common | My Profile')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Profile updated successfully')
  @InvalidateCache((req: any) => `me:profile:${req.user?.id}`)
  @ApiOperation({ summary: 'Update profile (partial)' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const profile = await this.profileService.update(user.id, dto);
    return { id: profile.id };
  }

  // ─── Professional Details (Provider only) ───────────────────────────────────

  @Get('professional-details')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Professional details fetched successfully')
  @Cached()
  @CacheKey((req: any) => `me:professional:${req.user?.id}`)
  @ApiOperation({ summary: 'Get professional details' })
  @ApiResponse({ status: 200, type: ProviderProfessionalDetails })
  getProfessionalDetails(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getProfessionalDetails(user.id);
  }

  @Post('professional-details')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Professional details saved successfully')
  @InvalidateCache((req: any) => `me:professional:${req.user?.id}`)
  @ApiOperation({ summary: 'Save professional details (full replace)' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  async saveProfessionalDetails(
    @Body() dto: UpdateProfessionalDetailsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const entity = await this.profileService.saveProfessionalDetails(user.id, dto);
    return { id: entity.id };
  }

  @Patch('professional-details')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Professional details updated successfully')
  @InvalidateCache((req: any) => `me:professional:${req.user?.id}`)
  @ApiOperation({ summary: 'Update professional details (partial)' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async patchProfessionalDetails(
    @Body() dto: PatchProfessionalDetailsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const entity = await this.profileService.patchProfessionalDetails(user.id, dto);
    return { id: entity.id };
  }

  // ─── Work Info (Provider only) ───────────────────────────────────────────────

  @Get('work-info')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Work info fetched successfully')
  @Cached()
  @CacheKey((req: any) => `me:work-info:${req.user?.id}`)
  @ApiOperation({ summary: 'Get work info' })
  @ApiResponse({ status: 200, type: WorkInfoResponseDto })
  getWorkInfo(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getWorkInfo(user.id);
  }

  @Post('work-info')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Work info saved successfully')
  @InvalidateCache((req: any) => `me:work-info:${req.user?.id}`)
  @ApiOperation({ summary: 'Save work info (full replace)' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  async saveWorkInfo(
    @Body() dto: UpdateWorkInfoDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const entity = await this.profileService.saveWorkInfo(user.id, dto);
    return { id: entity.id };
  }

  @Patch('work-info')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Work info updated successfully')
  @InvalidateCache((req: any) => `me:work-info:${req.user?.id}`)
  @ApiOperation({ summary: 'Update work info (partial)' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async patchWorkInfo(
    @Body() dto: PatchWorkInfoDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const entity = await this.profileService.patchWorkInfo(user.id, dto);
    return { id: entity.id };
  }

  // ─── Employees (Provider only) ───────────────────────────────────────────────

  @Get('employees')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Employees fetched successfully')
  @Cached()
  @CacheKey((req: any) => `me:employees:${req.user?.id}`)
  @ApiOperation({ summary: 'List employees' })
  @ApiResponse({ status: 200, type: ProviderEmployee, isArray: true })
  getEmployees(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getEmployees(user.id);
  }

  @Post('employees')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Employee added successfully')
  @InvalidateCache((req: any) => `me:employees:${req.user?.id}`)
  @ApiOperation({ summary: 'Add an employee' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  async createEmployee(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const employee = await this.profileService.createEmployee(user.id, dto);
    return { id: employee.id };
  }

  @Patch('employees/:id')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Employee updated successfully')
  @InvalidateCache((req: any) => `me:employees:${req.user?.id}`)
  @ApiOperation({ summary: 'Update an employee (partial)' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async patchEmployee(
    @Param('id') id: string,
    @Body() dto: PatchEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const employee = await this.profileService.patchEmployee(user.id, id, dto);
    return { id: employee.id };
  }

  @Delete('employees/:id')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Employee removed successfully')
  @InvalidateCache((req: any) => `me:employees:${req.user?.id}`)
  @ApiOperation({ summary: 'Remove an employee' })
  @ApiResponse({ status: 200, type: ActionResponseDto })
  async deleteEmployee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.profileService.deleteEmployee(user.id, id);
    return { completed: true };
  }

  // ─── Bank Details (Provider only) ────────────────────────────────────────────

  @Get('bank-details')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Bank details fetched successfully')
  @Cached()
  @CacheKey((req: any) => `me:bank-details:${req.user?.id}`)
  @ApiOperation({ summary: 'Get bank details' })
  @ApiResponse({ status: 200, type: ProviderBankDetails })
  getBankDetails(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getBankDetails(user.id);
  }

  @Post('bank-details')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Bank details saved successfully')
  @InvalidateCache((req: any) => `me:bank-details:${req.user?.id}`)
  @ApiOperation({ summary: 'Save bank details (full replace)' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  async saveBankDetails(
    @Body() dto: CreateBankDetailsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<IdResponseDto> {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? '0.0.0.0';
    const entity = await this.profileService.saveBankDetails(user.id, dto, ip);
    return { id: entity.id };
  }

  // ─── Stripe Onboarding (Provider only) ──────────────────────────────────────

  @Post('stripe/onboard')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Stripe onboarding initiated successfully')
  @ApiOperation({ summary: 'Initiate Stripe Connect onboarding for the provider' })
  async initiateStripeOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<any> {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? '0.0.0.0';
    return this.profileService.initiateStripeOnboarding(user.id, ip);
  }

  @Get('stripe/status')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Stripe onboarding status fetched successfully')
  @ApiOperation({
    summary: 'Get Stripe Connect onboarding status for the provider',
    description:
      'Poll this after POST /me/stripe/onboard — Stripe can take days to decide, and the ' +
      'onboard response is only a snapshot of that moment. When state is action_required, ' +
      'send the provider to POST /me/stripe/onboarding-link to supply requirementsDue.',
  })
  @ApiResponse({ status: 200, type: StripeOnboardingStatusDto })
  getStripeOnboardingStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getStripeOnboardingStatus(user.id);
  }

  @Post('stripe/onboarding-link')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Stripe onboarding link generated successfully')
  @ApiOperation({
    summary: 'Generate a Stripe hosted onboarding link so the provider can complete any outstanding requirements',
  })
  @ApiResponse({
    status: 201,
    description: 'Hosted onboarding link',
    schema: { type: 'object', properties: { url: { type: 'string', example: 'https://connect.stripe.com/setup/...' } } },
  })
  createStripeOnboardingLink(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.createStripeOnboardingLink(user.id);
  }

  @Patch('bank-details')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Bank details updated successfully')
  @InvalidateCache((req: any) => `me:bank-details:${req.user?.id}`)
  @ApiOperation({ summary: 'Update bank details (partial)' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async patchBankDetails(
    @Body() dto: PatchBankDetailsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const entity = await this.profileService.patchBankDetails(user.id, dto);
    return { id: entity.id };
  }

  // ─── Certifications (Provider only) ─────────────────────────────────────────

  @Get('certifications')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Certifications fetched successfully')
  @Cached()
  @CacheKey((req: any) => `me:certifications:${req.user?.id}`)
  @ApiOperation({ summary: 'List certifications' })
  @ApiResponse({ status: 200, type: ProviderCertification, isArray: true })
  getCertifications(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getCertifications(user.id);
  }

  @Post('certifications')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Certification added successfully')
  @InvalidateCache((req: any) => `me:certifications:${req.user?.id}`)
  @ApiOperation({ summary: 'Add a certification' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  async createCertification(
    @Body() dto: CreateCertificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const cert = await this.profileService.createCertification(user.id, dto);
    return { id: cert.id };
  }

  @Patch('certifications/:id')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Certification updated successfully')
  @InvalidateCache((req: any) => `me:certifications:${req.user?.id}`)
  @ApiOperation({ summary: 'Update a certification (partial)' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  async patchCertification(
    @Param('id') id: string,
    @Body() dto: PatchCertificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const cert = await this.profileService.patchCertification(user.id, id, dto);
    return { id: cert.id };
  }

  @Delete('certifications/:id')
  @ApiTags('Provider | My Profile')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Certification removed successfully')
  @InvalidateCache((req: any) => `me:certifications:${req.user?.id}`)
  @ApiOperation({ summary: 'Remove a certification' })
  @ApiResponse({ status: 200, type: ActionResponseDto })
  async deleteCertification(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.profileService.deleteCertification(user.id, id);
    return { completed: true };
  }

  // ─── Reports ─────────────────────────────────────────────────────────────────

  @Get('reports')
  @ApiTags('Common | My Profile')
  @ApiAuth()
  @ResponseMessage('Reports fetched successfully')
  @ApiOperation({ summary: 'Get my submitted reports' })
  @ApiResponse({ status: 200, type: ActionResponseDto })
  getMyReports(@CurrentUser() user: AuthenticatedUser) {
    // TODO: delegate to ReportService once cross-module injection is wired
    void user;
    throw new Error('Not implemented');
  }

  // ─── Phone OTP ──────────────────────────────────────────────────────────────

  @Post('phone/send-otp')
  @ApiTags('Common | My Profile')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('OTP sent successfully')
  @ApiOperation({ summary: 'Send OTP to the phone number on the profile (60 s cooldown)' })
  @ApiResponse({ status: 201, schema: { example: { message: 'OTP sent to your phone number' } } })
  sendPhoneOtp(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.sendPhoneOtp(user.id);
  }

  @Post('phone/verify-otp')
  @ApiTags('Common | My Profile')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Phone verified successfully')
  @InvalidateCache((req: any) => `me:profile:${req.user?.id}`)
  @ApiOperation({ summary: 'Verify the OTP and mark phone as verified' })
  @ApiResponse({ status: 201, type: PhoneVerifiedResDto })
  verifyPhoneOtp(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyOtpDto) {
    return this.profileService.verifyPhoneOtp(user.id, dto.code);
  }
}
