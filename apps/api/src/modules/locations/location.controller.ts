import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { LocationQueryDto, SuburbQueryDto } from './dto/location-query.dto';
import { PaginatedStatesResponseDto, PaginatedSuburbsResponseDto } from './dto/location-response.dto';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Cached } from '../../cache/decorators/cached.decorator';
import { CacheKey } from '../../cache/decorators/cache-key.decorator';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';

@Controller('locations')
@UseInterceptors(CacheInterceptor)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('states')
  @ApiTags('Public | Locations')
  @ResponseMessage('States fetched successfully')
  @Cached()
  @CacheKey((req: any) => `locations:states:${req.originalUrl}`)
  @ApiOperation({ summary: 'Get paginated list of Australian states and territories' })
  @ApiResponse({ status: 200, description: 'Paginated list of states', type: PaginatedStatesResponseDto })
  findStates(@Query() query: LocationQueryDto) {
    return this.locationService.findStates(query);
  }

  @Get('suburbs')
  @ApiTags('Public | Locations')
  @ResponseMessage('Suburbs fetched successfully')
  @Cached()
  @CacheKey((req: any) => `locations:suburbs:${req.originalUrl}`)
  @ApiOperation({ summary: 'Get paginated list of Australian suburbs, optionally filtered by stateId' })
  @ApiResponse({ status: 200, description: 'Paginated list of suburbs', type: PaginatedSuburbsResponseDto })
  findSuburbs(@Query() query: SuburbQueryDto) {
    return this.locationService.findSuburbs(query);
  }
}
