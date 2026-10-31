import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Cached, CacheKey, InvalidateCache } from '../../cache/decorators';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { ReviewResponseDto } from './dto/review-response.dto';
import { IdResponseDto } from '../../interfaces';

@Controller('reviews')
@UseInterceptors(CacheInterceptor)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('testimonials')
  @ApiTags('Public | Reviews')
  @ResponseMessage('Testimonials fetched successfully')
  @Cached()
  @CacheKey(() => 'reviews:testimonials')
  @ApiOperation({ summary: 'Get top platform testimonials for the landing page (guest-accessible)' })
  @ApiResponse({ status: 200, type: ReviewResponseDto, isArray: true })
  findTestimonials(): Promise<ReviewResponseDto[]> {
    return this.reviewService.findTestimonials();
  }

  @Post()
  @ApiTags('Seeker | Reviews')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Review submitted successfully')
  @InvalidateCache(
    'reviews:testimonials',
    (req: any) => `reviews:provider:${req._providerId}:*`,
    (req: any) => `reviews:provider:${req._providerProfileId}:*`,
    (req: any) => `providers:detail:${req._providerProfileId}:seeker:*`,
    (req: any) => `jobs:detail:${req.body?.jobId}:*`,
  )
  @ApiOperation({ summary: 'Submit a review for a completed job' })
  @ApiResponse({ status: 201, type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'Job not completed or no provider selected' })
  @ApiResponse({ status: 403, description: 'Not your job' })
  @ApiResponse({ status: 409, description: 'Review already submitted for this job' })
  async create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<IdResponseDto> {
    const { review, providerProfileId } = await this.reviewService.create(user.id, dto);
    (req as any)._providerId = review.providerId;
    (req as any)._providerProfileId = providerProfileId;
    return { id: review.id };
  }

  @Get('provider/:providerId')
  @ApiTags('Seeker | Reviews')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Provider reviews fetched successfully')
  @Cached()
  @CacheKey((req) => `reviews:provider:${req.params.providerId}:${req.originalUrl}`)
  @ApiOperation({ summary: 'Get all reviews for a provider' })
  @ApiResponse({ status: 200, type: ReviewResponseDto, isArray: true })
  getByProvider(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.findByProvider(providerId, query);
  }
}
