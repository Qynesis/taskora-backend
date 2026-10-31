import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ResendConfigType } from '../../config/namespaces/resend.config';
import { ContactFormDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly resend: Resend;
  private readonly cfg: ResendConfigType;

  constructor(private readonly configService: ConfigService) {
    this.cfg = this.configService.get<ResendConfigType>('resend')!;
    this.resend = new Resend(this.cfg.apiKey);
  }

  async sendContactEmail(dto: ContactFormDto): Promise<void> {
    const { name, email, message } = dto;

    await this.resend.emails.send({
      from: this.cfg.fromAddress,
      to: this.cfg.contactToAddress,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #1a2535;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #56687e; width: 80px;"><strong>Name</strong></td>
              <td style="padding: 8px 0;">${this.escape(name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #56687e;"><strong>Email</strong></td>
              <td style="padding: 8px 0;"><a href="mailto:${this.escape(email)}">${this.escape(email)}</a></td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #d8e2ee; margin: 16px 0;" />
          <h3 style="color: #1a2535;">Message</h3>
          <p style="white-space: pre-wrap; color: #374151;">${this.escape(message)}</p>
        </div>
      `,
    });

    this.logger.log(`Contact form email sent from ${email}`);
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
