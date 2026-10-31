import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Job } from './job.entity';
import { StorageProvider } from '../common/enum';

@Entity('job_photos')
export class JobPhoto extends BaseEntity {
  @ManyToOne(() => Job, (j) => j.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'storage', type: 'enum', enum: StorageProvider, enumName: 'storage_provider', default: StorageProvider.AZURE_BLOB })
  storage!: StorageProvider;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}