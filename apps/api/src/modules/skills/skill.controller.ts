import { Controller, Get, Post, Body, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkillService } from './skill.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillQueryDto } from './dto/skill-query.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Cached } from '../../cache/decorators/cached.decorator';
import { CacheKey } from '../../cache/decorators/cache-key.decorator';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { SkillOptionsPaginatedResponseDto } from './dto/skill-option-response.dto';
import { IdResponseDto } from '../../interfaces';

@Controller('skills')
@UseInterceptors(CacheInterceptor)
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get()
  @ApiTags('Provider | Skills')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Skills fetched successfully')
  @Cached()
  @CacheKey((req: any) => `skills:list:${req.originalUrl}`)
  @ApiOperation({ summary: 'List all available skills' })
  @ApiResponse({ status: 200, description: 'Paginated list of skill options', type: SkillOptionsPaginatedResponseDto })
  findAll(@Query() query: SkillQueryDto) {
    return this.skillService.findAll(query);
  }

  @Post()
  @ApiTags('Provider | Skills')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Skill created successfully')
  @InvalidateCache('skills:list:*')
  @ApiOperation({ summary: 'Create a new skill' })
  @ApiResponse({ status: 201, description: 'Skill created', type: IdResponseDto })
  async create(@Body() dto: CreateSkillDto): Promise<IdResponseDto> {
    const skill = await this.skillService.create(dto);
    return { id: skill.id };
  }
}
