import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EsendexService } from './esendex.service';

describe('EsendexService', () => {
  let service: EsendexService;
  let fetchMock: jest.Mock;

  const config = {
    accountRef: 'EXAU0000547',
    username: 'user@example.com',
    password: 'secret-api-key',
    originator: 'Taskora',
  };

  const ok = (status = 200, body = '{"ok":true}') =>
    ({ ok: status < 400, status, text: async () => body }) as Response;

  beforeEach(async () => {
    fetchMock = jest.fn().mockResolvedValue(ok());
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EsendexService,
        { provide: ConfigService, useValue: { get: () => config } },
      ],
    }).compile();

    service = module.get(EsendexService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should POST to Esendex over fetch, not a curl subprocess', async () => {
    // The previous implementation shelled out to curl, which does not exist in node:20-alpine
    // — every send died with "spawn curl ENOENT" once it ran in a container.
    await service.sendSms('0412345678', 'Your code is 123456');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.developer.esendex.com.au/v2/messages');
    expect(init.method).toBe('POST');
    expect(init.headers['Api-Key']).toBe('secret-api-key');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('should send the expected payload', async () => {
    await service.sendSms('0412345678', 'Your code is 123456');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      accountReference: 'EXAU0000547',
      from: 'Taskora',
      channel: 'SMS',
      messageType: 'AuthenticationAndSecurity',
      body: { text: 'Your code is 123456' },
      recipients: [{ msisdn: '+61412345678' }],
    });
  });

  describe('normalisePhone', () => {
    it.each([
      ['0412345678', '+61412345678'],
      ['61412345678', '+61412345678'],
      ['+61412345678', '+61412345678'],
      ['0412 345 678', '+61412345678'],
    ])('should normalise %s to %s', async (input, expected) => {
      await service.sendSms(input, 'x');
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.recipients[0].msisdn).toBe(expected);
    });
  });

  describe('errors', () => {
    it('should throw on a 4xx from Esendex', async () => {
      fetchMock.mockResolvedValue(ok(401, 'unauthorised'));

      await expect(service.sendSms('0412345678', 'x')).rejects.toThrow(
        'Failed to send SMS: 401 — unauthorised',
      );
    });

    it('should throw on a 5xx from Esendex', async () => {
      fetchMock.mockResolvedValue(ok(503, 'unavailable'));

      await expect(service.sendSms('0412345678', 'x')).rejects.toThrow('503');
    });

    it('should throw when the network call fails', async () => {
      fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

      await expect(service.sendSms('0412345678', 'x')).rejects.toThrow(
        'Failed to send SMS: getaddrinfo ENOTFOUND',
      );
    });

    it('should surface an abort as a timeout', async () => {
      // A hung Esendex used to hold the request open indefinitely — curl was given no timeout.
      const abort = new Error('aborted');
      abort.name = 'AbortError';
      fetchMock.mockRejectedValue(abort);

      await expect(service.sendSms('0412345678', 'x')).rejects.toThrow('timed out after 10000ms');
    });

    it('should pass an abort signal so a hung request cannot hang forever', async () => {
      await service.sendSms('0412345678', 'x');
      expect(fetchMock.mock.calls[0][1].signal).toBeDefined();
    });
  });
});
