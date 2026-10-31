import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExtraModels, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import {
  SubmitBusinessDto,
  SubmitIdentityDto,
  SubmitPoliceCheckDto,
  SubmitRightToWorkDto,
  VerificationCaseResDto,
  VerificationStepResDto,
  BusinessStepResDto,
  IdentityStepResDto,
  RightToWorkStepResDto,
  PoliceCheckStepResDto,
  SelfieStepResDto,
  ALL_STEP_RES_DTOS,
} from './dto';

@ApiExtraModels(...ALL_STEP_RES_DTOS)
@ApiTags('Provider | Verification')
@Controller('verification-docs')
@UseInterceptors(CacheInterceptor)
@ApiAuth()
@Roles(Role.PROVIDER)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('case')
  @ResponseMessage('Verification case fetched successfully')
  @ApiOperation({ summary: 'Get my verification case with all steps' })
  @ApiResponse({ status: 200, type: VerificationCaseResDto })
  @ApiResponse({ status: 404, description: 'No verification case started yet' })
  getCase(@CurrentUser() user: AuthenticatedUser): Promise<VerificationCaseResDto> {
    return this.verificationService.getCase(user.id);
  }

  @Post('case/steps/business')
  @ResponseMessage('Business verification submitted successfully')
  @InvalidateCache('verification-docs:case')
  @ApiOperation({ summary: 'Submit business verification step (ABN)' })
  @ApiResponse({ status: 201, type: BusinessStepResDto })
  submitBusiness(
    @Body() dto: SubmitBusinessDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VerificationStepResDto> {
    return this.verificationService.submitBusiness(user.id, dto);
  }

  @Post('case/steps/identity')
  @ResponseMessage('Identity verification submitted successfully')
  @InvalidateCache('verification-docs:case')
  @ApiOperation({ summary: 'Submit identity verification step (DL or Passport)' })
  @ApiBody({
    type: SubmitIdentityDto,
    examples: {
      drivingLicense: {
        summary: 'Driving licence — front and back required',
        value: {
          identityType: 'DRIVING_LICENSE',
          frontUrl: 'https://cdn.example.com/dl-front.jpg',
          backUrl: 'https://cdn.example.com/dl-back.jpg',
        },
      },
      passport: {
        summary: 'Passport — front only',
        value: {
          identityType: 'PASSPORT',
          frontUrl: 'https://cdn.example.com/passport.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    type: IdentityStepResDto,
    description: 'Driving licence returns two labelled files (front + back); passport returns one (front).',
  })
  submitIdentity(
    @Body() dto: SubmitIdentityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VerificationStepResDto> {
    return this.verificationService.submitIdentity(user.id, dto);
  }

  @Post('case/steps/right-to-work')
  @ResponseMessage('Right-to-work verification submitted successfully')
  @InvalidateCache('verification-docs:case')
  @ApiOperation({ summary: 'Submit right-to-work verification step' })
  @ApiResponse({ status: 201, type: RightToWorkStepResDto })
  submitRightToWork(
    @Body() dto: SubmitRightToWorkDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VerificationStepResDto> {
    return this.verificationService.submitRightToWork(user.id, dto);
  }

  @Post('case/steps/police-check')
  @ResponseMessage('Police check submitted successfully')
  @InvalidateCache('verification-docs:case')
  @ApiOperation({ summary: 'Submit police check verification step' })
  @ApiResponse({ status: 201, type: PoliceCheckStepResDto })
  submitPoliceCheck(
    @Body() dto: SubmitPoliceCheckDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VerificationStepResDto> {
    return this.verificationService.submitPoliceCheck(user.id, dto);
  }

  @Post('case/steps/selfie')
  @ResponseMessage('Selfie verification initiated successfully')
  @InvalidateCache('verification-docs:case')
  @ApiOperation({ summary: 'Initiate selfie verification via Stripe Identity — returns a redirect URL' })
  @ApiResponse({ status: 201, schema: { properties: { url: { type: 'string' } } } })
  initiateSelfie(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ url: string }> {
    return this.verificationService.initiateSelfie(user.id);
  }
}
