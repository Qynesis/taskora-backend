import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { ReportableUserQueryDto } from './dto/reportable-user-query.dto';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { ReportableUserDto } from './dto/reportable-user.dto';
import { IdResponseDto } from '../../interfaces';

@Controller('reports')
@ApiTags('Common | Reports')
@UseInterceptors(CacheInterceptor)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('reportable-users')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Reportable users fetched successfully')
  @ApiOperation({
    summary: 'List users available to report',
    description:
      'Seekers receive the provider list; providers receive the seeker list.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of reportable users', type: ReportableUserDto, isArray: true })
  findReportableUsers(
    @Query() query: ReportableUserQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportService.findReportableUsers(user.id, query);
  }

  @Post()
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Report submitted successfully')
  @InvalidateCache('reports:list')
  @ApiOperation({ summary: 'Submit a user report' })
  @ApiResponse({ status: 201, description: 'Report submitted successfully', type: IdResponseDto })
  async create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const report = await this.reportService.create(dto, user.id);
    return { id: report.id };
  }
}

