import { Test, TestingModule } from '@nestjs/testing';
import { PdfExportService } from './pdf-export.service';
import { UserRole } from '../../database/common/enum';
import { WarningThreadService } from '../warning/warning-thread.service';
import { SupportTicketService } from '../support/support-ticket.service';

describe('PdfExportService', () => {
  let module: TestingModule;
  let service: PdfExportService;
  let warningThreadService: { getThreadMeta: jest.Mock; findAllMessages: jest.Mock };
  let supportTicketService: { getTicketMeta: jest.Mock; findAllMessages: jest.Mock };

  beforeEach(async () => {
    warningThreadService = {
      getThreadMeta: jest.fn(),
      findAllMessages: jest.fn(),
    };
    supportTicketService = {
      getTicketMeta: jest.fn(),
      findAllMessages: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        PdfExportService,
        { provide: WarningThreadService, useValue: warningThreadService },
        { provide: SupportTicketService, useValue: supportTicketService },
      ],
    }).compile();

    service = module.get<PdfExportService>(PdfExportService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should map warning thread metadata/messages into buildPdf call', async () => {
    warningThreadService.getThreadMeta.mockResolvedValue({
      recipientRole: UserRole.PROVIDER,
      recipientName: 'Jane Smith',
      isClosed: false,
      reportRef: 'RPT-123',
    });
    warningThreadService.findAllMessages.mockResolvedValue([
      {
        createdAt: '2026-03-30T00:00:00.000Z',
        senderName: 'Admin',
        body: 'Please follow guidelines.',
        attachments: ['https://cdn.example.com/a.png'],
      },
    ]);

    const buildPdfSpy = jest.spyOn(service as any, 'buildPdf').mockResolvedValue(Buffer.from('pdf'));

    const result = await service.exportWarningThread('thread-1');

    expect(buildPdfSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Chat Conversation',
        statusLine: 'Status: Active Case – Warning Issued',
        refLine: 'Report Ref: RPT-123',
      }),
      [
        expect.objectContaining({
          senderName: 'Admin',
          body: 'Please follow guidelines.',
        }),
      ],
    );
    expect(result).toEqual({
      data: Buffer.from('pdf').toString('base64'),
      filename: 'warning-thread-thread-1.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('should map support ticket metadata/messages into buildPdf call', async () => {
    supportTicketService.getTicketMeta.mockResolvedValue({
      senderName: 'John Doe',
      subject: 'Payment issue',
    });
    supportTicketService.findAllMessages.mockResolvedValue([
      {
        createdAt: '2026-03-30T00:00:00.000Z',
        senderName: 'John Doe',
        body: 'I need help with payment.',
        attachments: null,
      },
    ]);

    const buildPdfSpy = jest.spyOn(service as any, 'buildPdf').mockResolvedValue(Buffer.from('pdf'));

    const result = await service.exportSupportTicket('ticket-1');

    expect(buildPdfSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Support Conversation',
        statusLine: 'Subject: Payment issue',
      }),
      [
        expect.objectContaining({
          senderName: 'John Doe',
          body: 'I need help with payment.',
        }),
      ],
    );
    expect(result).toEqual({
      data: Buffer.from('pdf').toString('base64'),
      filename: 'support-ticket-ticket-1.pdf',
      mimeType: 'application/pdf',
    });
  });
});