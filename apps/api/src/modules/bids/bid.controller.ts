import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BidService } from './bid.service';
import { UpdateBidDto } from './dto/update-bid.dto';
import { BidQueryDto } from './dto/bid-query.dto';
import { MyBidsResponseDto } from './dto/my-bids-response.dto';
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
import { IdResponseDto } from '../../interfaces';

@ApiTags('Provider | Bids')
@Controller('bids')
@UseInterceptors(CacheInterceptor)
export class BidController {
  constructor(private readonly bidService: BidService) {}

  @Get('my/counts')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Bid counts fetched successfully')
  @ApiOperation({ summary: 'Get bid status counts for the authenticated provider' })
  @ApiResponse({ status: 200, description: 'Bid counts by status' })
  getMyBidCounts(@CurrentUser() user: AuthenticatedUser) {
    return this.bidService.getMyBidCounts(user.id);
  }

  @Get('my')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('My bids fetched successfully')
  @Cached()
  @CacheKey((req: any) => `bids:my:${req.user?.id}:${req.originalUrl}`)
  @ApiOperation({ summary: 'Get all bids submitted by the authenticated provider' })
  @ApiResponse({ status: 200, description: 'Paginated list of my bids', type: MyBidsResponseDto })
  getMyBids(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BidQueryDto,
  ) {
    return this.bidService.findMyBids(user.id, query);
  }

  @Patch(':id/decline')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Bid declined successfully')
  @ApiTags('Seeker | Bids')
  @InvalidateCache(
    ...invalidateJobViews((req: any) => req._jobId, (req: any) => req.user?.id),
    (req: any) => `bids:my:${req._bidProviderId}:*`,
  )
  @ApiOperation({ summary: 'Decline a bid on your job (seeker)' })
  @ApiResponse({ status: 200, description: 'Bid declined', type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'Bid is not in SUBMITTED status' })
  @ApiResponse({ status: 403, description: 'You are not the seeker of this job' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async decline(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<IdResponseDto> {
    const bid = await this.bidService.decline(id, user.id);
    (req as any)._jobId = bid.job.id;
    (req as any)._bidProviderId = bid.provider.id;
    return { id: bid.id };
  }

  @Patch(':id')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Bid updated successfully')
  @InvalidateCache(
    ...invalidateJobViews((req: any) => req._jobId, (req: any) => req._seekerId),
    (req: any) => `bids:my:${req.user?.id}:*`,
  )
  @ApiOperation({ summary: 'Update a bid (provider)' })
  @ApiResponse({ status: 200, description: 'Bid updated successfully', type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'Job is no longer accepting bid updates' })
  @ApiResponse({ status: 403, description: 'You do not own this bid' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBidDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<IdResponseDto> {
    const bid = await this.bidService.update(id, dto, user.id);
    (req as any)._jobId = bid.job.id;
    (req as any)._seekerId = bid.job.seeker.id;
    return { id: bid.id };
  }
}

