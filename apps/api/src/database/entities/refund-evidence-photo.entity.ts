import { Entity, ManyToOne, JoinColumn, Column, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { RefundRequest } from './refund-request.entity';
import { RefundEvidenceSide, StorageProvider } from '../common/enum';

/**
 * Evidence photos attached to a RefundRequest.
 * `side` distinguishes seeker-uploaded photos (submitted with the request)
 * from admin-uploaded counter-evidence (attached on rejection).
 */
@Entity('refund_evidence_photos')
export class RefundEvidencePhoto extends BaseEntity {
  @ManyToOne(() => RefundRequest, (r) => r.evidencePhotos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'refund_request_id' })
  @Index()
  refundRequest!: RefundRequest;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({
    name: 'storage',
    type: 'enum',
    enum: StorageProvider,
    enumName: 'storage_provider',
    default: StorageProvider.AZURE_BLOB,
  })
  storage!: StorageProvider;

  /** Who uploaded this photo: seeker (on submission) or admin (on rejection) */
  @Column({ name: 'side', type: 'enum', enum: RefundEvidenceSide, enumName: 'refund_evidence_side' })
  side!: RefundEvidenceSide;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}
