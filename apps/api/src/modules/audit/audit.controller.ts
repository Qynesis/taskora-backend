import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Cached } from '../../cache/decorators/cached.decorator';
import { CacheKey } from '../../cache/decorators/cache-key.decorator';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Controller('audits')
@UseInterceptors(CacheInterceptor)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiTags('Admin | Audit')
  @ApiAuth()
  @Roles(Role.ADMIN)
  @ResponseMessage('Audit logs fetched successfully')
  @Cached()
  @CacheKey((req: any) => `audits:list:${req.originalUrl}`)
  @ApiOperation({ summary: 'List all audit logs with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of audit logs', type: AuditLog, isArray: true })
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  @ApiTags('Admin | Audit')
  @ApiAuth()
  @Roles(Role.ADMIN)
  @ResponseMessage('Audit log fetched successfully')
  @ApiOperation({ summary: 'Get an audit log by ID' })
  @ApiResponse({ status: 200, description: 'The audit log entry', type: AuditLog })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
