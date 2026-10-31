import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Category } from './category.entity';

export enum CategoryAssetType {
  COVER = 'cover',
  SUB_COVER = 'sub_cover',
}

@Entity({ name: 'category_assets', schema: 'service' })
export class CategoryAsset extends BaseEntity {
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ name: 'type', type: 'enum', enum: CategoryAssetType })
  type!: CategoryAssetType;

  @Column({ name: 'url', type: 'varchar', length: 500 })
  url!: string;

  @ManyToOne(() => Category, (category) => category.assets)
  @JoinColumn({ name: 'category_id' })
  category!: Category;
}
