import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateBillingCustomerDto } from './dto/create-billing-customer.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { AuthenticatedUser } from '@app/shared-types';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { CreateCustomerDto, GetCustomerDto } from './dto/request.dto';
import { CreateCustomerResponseDto, GetCustomerStatusResponseDto } from './dto/response.dto';

@ApiTags('Seeker | Billing')
@Controller('billing')
@UseInterceptors(CacheInterceptor)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('customer')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Stripe customer created successfully')
  @ApiOperation({ 
    summary: 'Create a Stripe customer record for the seeker',
    description: 'Idempotent operation - returns existing customer ID if already created'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Stripe customer created (new)',
    type: CreateCustomerResponseDto
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Stripe customer already exists (idempotent)',
    type: CreateCustomerResponseDto
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Profile information incomplete - cannot create customer without complete profile'
  })
  async createCustomer(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreateCustomerResponseDto> {
    const dto: CreateCustomerDto = {
        id: user.id,
        email: user.email
    }
    return await this.billingService.createCustomer(dto);
  }

  @Get('customer')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Stripe customer fetched successfully')
  @ApiOperation({ summary: 'Get the Stripe customer record for the seeker' })
  @ApiResponse({ status: 200, description: 'Stripe customer record', type: GetCustomerStatusResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 410, description: 'Customer removed from stripe' })
  async getCustomer(@CurrentUser() user: AuthenticatedUser): Promise<GetCustomerStatusResponseDto> {
    const dto: GetCustomerDto={
        id: user.id
    }
    return await this.billingService.getCustomer(dto);
  }
}
