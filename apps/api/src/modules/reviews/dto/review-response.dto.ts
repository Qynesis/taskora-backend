import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Review } from '../../../database/entities/review.entity';

export class ReviewResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  seekerName!: string;

  @ApiPropertyOptional()
  seekerAvatarUrl?: string | null;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty()
  rating!: number;

  @ApiPropertyOptional()
  title?: string | null;

  @ApiPropertyOptional()
  comment?: string | null;

  @ApiProperty()
  createdAt!: Date;

  static fromTestimonial(review: Review): ReviewResponseDto {
    const dto = new ReviewResponseDto();
    // A reviewer who deleted their account is shown anonymously: the review is retained as the
    // provider's reputation data, but the author's identity is scrubbed (name → Anonymous, no avatar).
    const deleted = !!review.seeker?.accountDeletedAt;
    const profile = deleted ? null : review.seeker?.profile;
    dto.seekerName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Anonymous';
    dto.seekerAvatarUrl = profile?.avatarUrl ?? null;
    dto.rating = review.rating;
    dto.comment = review.comment ?? null;
    dto.createdAt = review.createdAt;
    return dto;
  }

  static from(review: Review): ReviewResponseDto {
    const dto = new ReviewResponseDto();
    dto.id = review.id;
    // See fromTestimonial: deleted reviewers appear as "Anonymous" on the public reviews list.
    const deleted = !!review.seeker?.accountDeletedAt;
    const profile = deleted ? null : review.seeker?.profile;
    dto.seekerName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Anonymous';
    dto.seekerAvatarUrl = profile?.avatarUrl ?? null;
    dto.jobTitle = review.job?.title ?? '';
    dto.rating = review.rating;
    dto.comment = review.comment ?? null;
    dto.createdAt = review.createdAt;
    return dto;
  }
}
