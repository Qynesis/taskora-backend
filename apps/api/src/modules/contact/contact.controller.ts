import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { ContactFormDto } from './dto/contact.dto';
import { ResponseMessage } from '../../http/decorators/response-message.decorator';

@ApiTags('Public | Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  // Tighter rate limit for public spam-prone endpoint: 3 submissions per minute per IP
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @ResponseMessage('Your message has been sent successfully.')
  @ApiOperation({ summary: 'Submit a contact form message (public)' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async submit(@Body() dto: ContactFormDto): Promise<null> {
    await this.contactService.sendContactEmail(dto);
    return null;
  }
}
