import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingDetailDto, BookingListItemDto } from './dto/booking-response.dto';
import { ApiAuth } from '../../security/decorators/api-auth.decorator';
import { CurrentUser } from '../../security/decorators/current-user.decorator';
import { Roles } from '../../security/decorators/roles.decorator';
import { Role } from '../../security/rbac/roles.enum';
import { AuthenticatedUser } from '@app/shared-types';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { InvalidateCache } from '../../cache/decorators/invalidate-cache.decorator';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';
import { IdResponseDto } from '../../interfaces';

@Controller('bookings')
@UseInterceptors(CacheInterceptor)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiTags('Seeker | Bookings')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Booking created successfully')
  @InvalidateCache('bookings:*')
  @ApiOperation({ summary: 'Book a provider directly' })
  @ApiResponse({ status: 201, description: 'Booking created', type: IdResponseDto })
  async create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthenticatedUser): Promise<IdResponseDto> {
    return this.bookingService.create(user.id, dto);
  }

  @Get('my')
  @ApiTags('Common | Bookings')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Bookings fetched successfully')
  @ApiOperation({ summary: 'List bookings — seeker sees outgoing, provider sees incoming' })
  @ApiResponse({ status: 200, description: 'Paginated list of bookings', type: BookingListItemDto, isArray: true })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: BookingQueryDto) {
    return this.bookingService.findBookings(user.id, user.roles, query);
  }

  @Get('my/:id')
  @ApiTags('Common | Bookings')
  @ApiAuth()
  @Roles(Role.SEEKER, Role.PROVIDER)
  @ResponseMessage('Booking details fetched successfully')
  @ApiOperation({ summary: 'View booking details' })
  @ApiResponse({ status: 200, description: 'Booking detail', type: BookingDetailDto })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.findBookingDetail(user.id, user.roles, id);
  }

  @Delete(':id')
  @ApiTags('Seeker | Bookings')
  @ApiAuth()
  @Roles(Role.SEEKER)
  @ResponseMessage('Booking cancelled successfully')
  @HttpCode(200)
  @InvalidateCache('bookings:*')
  @ApiOperation({ summary: 'Cancel a pending booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled', type: BookingDetailDto })
  @ApiResponse({ status: 400, description: 'Booking is not in a cancellable state' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.cancelBySeeker(user.id, id);
  }

  @Patch(':id/status')
  @ApiTags('Provider | Bookings')
  @ApiAuth()
  @Roles(Role.PROVIDER)
  @ResponseMessage('Booking status updated successfully')
  @HttpCode(200)
  @InvalidateCache('bookings:*')
  @ApiOperation({ summary: 'Approve or reject a pending booking' })
  @ApiResponse({ status: 200, description: 'Booking status updated', type: IdResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.bookingService.updateStatus(user.id, id, dto.status);
  }
}
