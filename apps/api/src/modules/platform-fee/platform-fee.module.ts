import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformFeeConfig } from '../../database/entities/platform-fee-config.entity';
import { PlatformFeeService } from './platform-fee.service';

@Module({
    imports: [TypeOrmModule.forFeature([PlatformFeeConfig])],
    providers: [PlatformFeeService],
    exports: [PlatformFeeService],
})
export class PlatformFeeModule {}
