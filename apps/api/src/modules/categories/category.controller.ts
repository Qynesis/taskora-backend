import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { Cached } from '../../cache/decorators/cached.decorator';
import { CacheKey } from '../../cache/decorators/cache-key.decorator';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { CategoryOptionsPaginatedResponseDto, CategoryNamesPaginatedResponseDto, CategoryAssetsResponseDto } from './dto/category-option-response.dto';
import { IdResponseDto } from '../../interfaces';

@Controller('categories')
@UseInterceptors(CacheInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get(':id/assets')
  @ApiTags('Public | Categories')
  @ResponseMessage('Category assets fetched successfully')
  @Cached()
  @CacheKey((req: any) => `categories:assets:${req.params.id}`)
  @ApiOperation({ summary: 'Get cover and sub-cover asset URLs for a category (guest-accessible)' })
  @ApiResponse({ status: 200, description: 'Category asset URLs', type: CategoryAssetsResponseDto })
  findAssets(@Param('id') id: string): Promise<CategoryAssetsResponseDto> {
    return this.categoryService.findAssets(id);
  }

  @Get('names')
  @ApiTags('Public | Categories')
  @ResponseMessage('Category names fetched successfully')
  @Cached()
  @CacheKey((req: any) => `categories:names:${req.originalUrl}`)
  @ApiOperation({ summary: 'Get paginated category names (guest-accessible, for dropdowns and filters)' })
  @ApiResponse({ status: 200, description: 'Paginated list of { value, level, icon }', type: CategoryNamesPaginatedResponseDto })
  findNames(@Query() query: CategoryQueryDto) {
    return this.categoryService.findNames(query);
  }

  @Get()
  @ApiTags('Provider | Categories')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Categories fetched successfully')
  @Cached()
  @CacheKey((req: any) => `categories:list:${req.originalUrl}`)
  @ApiOperation({ summary: 'List all available categories (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of category options', type: CategoryOptionsPaginatedResponseDto })
  findAll(@Query() query: CategoryQueryDto) {
    return this.categoryService.findAll(query);
  }

  @Post()
  @ApiTags('Provider | Categories')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Category created successfully')
  @InvalidateCache('categories:list:*', 'categories:names:*')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created', type: IdResponseDto })
  async create(@Body() dto: CreateCategoryDto): Promise<IdResponseDto> {
    const category = await this.categoryService.create(dto);
    return { id: category.id };
  }
}
