import { Controller, Delete, Get, HttpCode, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { ProvidersQueryDto } from './dto/providers-query.dto';
import { ProviderListItemDto, PublicProviderListItemDto } from './dto/provider-list-item.dto';
import { ProviderDetailDto } from './dto/provider-detail.dto';
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
import { IdResponseDto } from '../../interfaces';

@ApiTags('Seeker | Providers')
@Controller('providers')
@UseInterceptors(CacheInterceptor)
export class ProvidersController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('browse')
  @ApiTags('Public | Providers')
  @ResponseMessage('Providers fetched successfully')
  @ApiOperation({ summary: 'Browse providers — guest accessible, no isFavourite field' })
  @ApiResponse({ status: 200, type: PublicProviderListItemDto, isArray: true })
  findPublic(@Query() query: ProvidersQueryDto) {
    return this.profileService.findPublicProviders(query);
  }

  @Get()
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Providers fetched successfully')
  @Cached()
  @CacheKey((req: any) => `providers:list:${req.user?.id}:${req.originalUrl}`)
  @ApiOperation({ summary: 'Browse providers with filtering and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated list of providers', type: ProviderListItemDto, isArray: true })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ProvidersQueryDto) {
    return this.profileService.findProviders(user.id, query);
  }

  @Get('favourites')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Favourite providers fetched successfully')
  @Cached()
  @CacheKey((req: any) => `providers:favourites:${req.user?.id}:${req.originalUrl}`)
  @ApiOperation({ summary: 'List favourite providers' })
  @ApiResponse({ status: 200, description: 'Paginated list of favourite providers', type: ProviderListItemDto, isArray: true })
  findFavourites(@CurrentUser() user: AuthenticatedUser, @Query() query: ProvidersQueryDto) {
    return this.profileService.findFavouriteProviders(user.id, query);
  }

  @Get(':id')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Provider details fetched successfully')
  @Cached()
  @CacheKey((req: any) => `providers:detail:${req.params.id}:seeker:${req.user?.id}`)
  @ApiOperation({ summary: 'View provider details' })
  @ApiResponse({ status: 200, description: 'Provider detail', type: ProviderDetailDto })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') providerProfileId: string) {
    return this.profileService.findProviderById(user.id, providerProfileId);
  }

  @Post(':id/favourite')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Provider added to favourites successfully')
  @HttpCode(200)
  @InvalidateCache(
    (req: any) => `providers:favourites:${req.user?.id}:*`,
    (req: any) => `providers:list:${req.user?.id}:*`,
    (req: any) => `providers:detail:${req.params.id}:seeker:${req.user?.id}`,
  )
  @ApiOperation({ summary: 'Add a provider to favourites' })
  @ApiResponse({ status: 200, type: IdResponseDto })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  addFavourite(@CurrentUser() user: AuthenticatedUser, @Param('id') providerProfileId: string): Promise<IdResponseDto> {
    return this.profileService.addFavourite(user.id, providerProfileId);
  }

  @Delete(':id/favourite')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Provider removed from favourites successfully')
  @HttpCode(200)
  @InvalidateCache(
    (req: any) => `providers:favourites:${req.user?.id}:*`,
    (req: any) => `providers:list:${req.user?.id}:*`,
    (req: any) => `providers:detail:${req.params.id}:seeker:${req.user?.id}`,
  )
  @ApiOperation({ summary: 'Remove a provider from favourites' })
  @ApiResponse({ status: 200, description: 'Removed from favourites' })
  @ApiResponse({ status: 404, description: 'Favourite not found' })
  removeFavourite(@CurrentUser() user: AuthenticatedUser, @Param('id') providerProfileId: string) {
    return this.profileService.removeFavourite(user.id, providerProfileId);
  }
}
