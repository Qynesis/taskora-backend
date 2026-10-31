import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Single item returned inside GET /categories/names */
export class CategoryNameResponseDto {
  @ApiProperty({ example: '4a199575-27bb-4071-81bf-bc392791f470', description: 'Category id' })
  value!: string;

  @ApiProperty({ example: 'Plumbing', description: 'Category name' })
  level!: string;

  @ApiProperty({ type: 'string', example: 'https://storagesandboxbd.blob.core.windows.net/serviceapp-public/categories/electricians.png', nullable: true, description: 'Public URL of the category icon' })
  icon!: string | null;
}

export class CategoryNamesPaginatedResponseDto {
  @ApiProperty({ type: CategoryNameResponseDto, isArray: true })
  items!: CategoryNameResponseDto[];

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}

export class CategoryOptionResponseDto {
  @ApiProperty({ example: 'Plumbing' })
  label!: string;

  @ApiProperty({ example: '4a199575-27bb-4071-81bf-bc392791f470' })
  value!: string;
}

export class CategoryAssetsResponseDto {
  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'https://storage.blob.core.windows.net/public/category-assets/uuid/cover.png' })
  cover!: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'https://storage.blob.core.windows.net/public/category-assets/uuid/sub-cover.png' })
  subCover!: string | null;
}

export class CategoryOptionsPaginatedResponseDto {
  @ApiProperty({ type: CategoryOptionResponseDto, isArray: true })
  items!: CategoryOptionResponseDto[];

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}
