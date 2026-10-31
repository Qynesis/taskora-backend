import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EsendexConfigType } from '../../config/namespaces/esendex.config';

const ESENDEX_URL = 'https://api.developer.esendex.com.au/v2/messages';
const TIMEOUT_MS = 10_000;

@Injectable()
export class EsendexService {
  private readonly logger = new Logger(EsendexService.name);
  private readonly config: EsendexConfigType;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<EsendexConfigType>('esendex')!;
  }

  async sendSms(to: string, text: string): Promise<void> {
    const { accountRef, password, originator } = this.config;
    const phone = this.normalisePhone(to);

    const payload = {
      accountReference: accountRef,
      from: originator,
      channel: 'SMS',
      messageType: 'AuthenticationAndSecurity',
      body: { text },
      recipients: [{ msisdn: phone }],
    };

    this.logger.debug(`Sending SMS to ${phone} via account ${accountRef}`);

    // fetch, not a curl subprocess: node:20-alpine has no curl, so the previous
    // execFile('curl', ...) died with ENOENT the moment this ran in a container.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(ESENDEX_URL, {
        method: 'POST',
        headers: {
          'Api-Key': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      const reason =
        (err as Error).name === 'AbortError'
          ? `timed out after ${TIMEOUT_MS}ms`
          : (err as Error).message;
      this.logger.error(`Esendex request failed: ${reason}`);
      throw new Error(`Failed to send SMS: ${reason}`);
    } finally {
      clearTimeout(timeout);
    }

    const responseBody = await response.text();

    if (!response.ok) {
      this.logger.error({ status: response.status, responseBody }, 'Esendex send failed');
      throw new Error(`Failed to send SMS: ${response.status} — ${responseBody}`);
    }

    this.logger.debug(`Esendex send response: ${response.status} ${responseBody}`);
  }

  private normalisePhone(phone: string): string {
    const digits = phone.replace(/\s+/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('61')) return `+${digits}`;
    if (digits.startsWith('0')) return `+61${digits.slice(1)}`;
    return digits;
  }
}
