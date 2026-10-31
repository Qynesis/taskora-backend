import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { EchoResponseDto, PingResponseDto } from './dto/dev-response.dto';

class EchoDto {
  @ApiProperty({ example: 'hello world', required: false })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ example: { key: 'value' }, required: false })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}

@ApiTags('Dev')
@Controller('dev')
export class DevController {
  /** Public — no auth required */
  @Get('ping')
  @ResponseMessage('Ping successful')
  @ApiOperation({ summary: 'Public ping (no auth)' })
  @ApiResponse({ status: 200, description: 'Ping response', type: PingResponseDto })
  ping() {
    return { pong: true, timestamp: new Date().toISOString() };
  }

  /** Authenticated — echoes payload + resolved user from the guard */
  @Post('echo')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER, Role.ADMIN)
  @ResponseMessage('Echo response generated successfully')
  @ApiOperation({ summary: 'Auth echo — returns your payload and resolved user identity' })
  @ApiResponse({ status: 201, description: 'Echo response', type: EchoResponseDto })
  echo(@Body() dto: EchoDto, @CurrentUser() user: AuthenticatedUser) {
    return {
      received: dto,
      resolvedUser: user,
      timestamp: new Date().toISOString(),
    };
  }
}
