import { registerAs } from '@nestjs/config';

export interface EsendexConfigType {
  accountRef: string;
  username: string;
  password: string;
  originator: string;
}

export const esendexConfig = registerAs(
  'esendex',
  (): EsendexConfigType => ({
    accountRef: process.env['ESENDEX_ACCOUNT_REF'] || '',
    username: process.env['ESENDEX_USERNAME'] || '',
    password: process.env['ESENDEX_PASSWORD'] || '',
    originator: process.env['ESENDEX_ORIGINATOR'] || '',
  }),
);
