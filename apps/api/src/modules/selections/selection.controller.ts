import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SelectionService } from './selection.service';
import { CreateSelectionDto } from './dto/create-selection.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { invalidateJobViews } from '../../cache/job-view-invalidation';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { IdResponseDto } from '../../interfaces';

@ApiTags('Seeker | Selections')
@Controller()
@UseInterceptors(CacheInterceptor)
export class SelectionController {
  constructor(private readonly selectionService: SelectionService) {}

  @Post('jobs/:jobId/select')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Provider selected successfully')
  @InvalidateCache(...invalidateJobViews((req: any) => req.params.jobId, (req: any) => req.user?.id))
  @ApiOperation({ summary: 'Select a provider bid for a job (seeker)' })
  @ApiResponse({ status: 201, description: 'Provider selected successfully', type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'A provider has already been selected for this job' })
  async selectProvider(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateSelectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const selection = await this.selectionService.create(dto, user.id, jobId);
    return { id: selection.id };
  }
}

