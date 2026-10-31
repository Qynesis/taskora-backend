import { ApiProperty } from '@nestjs/swagger';

export class RequestedServicePaymentCountsDto {
  @ApiProperty()
  all!: number;

  @ApiProperty()
  paid!: number;

  @ApiProperty()
  due!: number;

  @ApiProperty()
  refunded!: number;
}
