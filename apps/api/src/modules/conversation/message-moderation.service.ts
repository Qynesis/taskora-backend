import { Injectable, UnprocessableEntityException } from '@nestjs/common';

@Injectable()
export class MessageModerationService {
  private readonly rules: Array<{ label: string; pattern: RegExp }> = [
    {
      label: 'email address',
      pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i,
    },
    {
      label: 'phone number',
      pattern: /(\+?61[\s\-.]?)?(\(0?\d\)[\s\-.]?)?\d{4}[\s\-.]?\d{4}|\b0[45]\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3}\b/i,
    },
    {
      label: 'website or link',
      pattern: /https?:\/\/[^\s]+|www\.[^\s]+/i,
    },
    {
      label: 'street address',
      pattern: /\b\d{1,4}\s+[A-Za-z0-9\s]{2,30}(street|st|road|rd|avenue|ave|drive|dr|lane|ln|court|ct|place|pl|boulevard|blvd|crescent|cres|parade|pde|way|close|cl|circuit|cct)\b/i,
    },
  ];

  validate(body: string): void {
    for (const rule of this.rules) {
      if (rule.pattern.test(body)) {
        throw new UnprocessableEntityException(
          `Your message appears to contain a ${rule.label}. For security and platform compliance, please keep personal contact details off-platform.`,
        );
      }
    }
  }
}
