import { Module } from '@nestjs/common';
import { EsendexService } from './esendex.service';

@Module({
  providers: [EsendexService],
  exports: [EsendexService],
})
export class SmsModule {}
