import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { UserRole } from '../../database/common/enum';
import { WarningThreadService } from '../warning/warning-thread.service';
import { SupportTicketService } from '../support/support-ticket.service';

interface ExportMessage {
  timestamp: string;
  senderName: string;
  body: string;
  attachments?: string[] | null;
}

export interface PdfExportResult {
  data: string;
  filename: string;
  mimeType: 'application/pdf';
}

const SEPARATOR = '-'.repeat(60);

@Injectable()
export class PdfExportService {
  constructor(
    private readonly warningThreadService: WarningThreadService,
    private readonly supportTicketService: SupportTicketService,
  ) {}

  async exportWarningThread(threadId: string): Promise<PdfExportResult> {
    const [meta, messages] = await Promise.all([
      this.warningThreadService.getThreadMeta(threadId),
      this.warningThreadService.findAllMessages(threadId),
    ]);

    const roleLabel = meta.recipientRole === UserRole.PROVIDER ? 'Provider' : 'User';
    const status = meta.isClosed ? 'Case Closed' : 'Active Case – Warning Issued';

    const exportMessages: ExportMessage[] = messages.map((m) => ({
      timestamp: m.createdAt,
      senderName: m.senderName,
      body: m.body,
      attachments: m.attachments,
    }));

    const buffer = await this.buildPdf(
      {
        title: 'Chat Conversation',
        participants: ['Admin (Taskora Support)', `${roleLabel}: ${meta.recipientName}`],
        statusLine: `Status: ${status}`,
        refLine: meta.reportRef ? `Report Ref: ${meta.reportRef}` : undefined,
      },
      exportMessages,
    );

    return {
      data: buffer.toString('base64'),
      filename: `warning-thread-${threadId}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  async exportSupportTicket(ticketId: string): Promise<PdfExportResult> {
    const [meta, messages] = await Promise.all([
      this.supportTicketService.getTicketMeta(ticketId),
      this.supportTicketService.findAllMessages(ticketId),
    ]);

    const exportMessages: ExportMessage[] = messages.map((m) => ({
      timestamp: m.createdAt,
      senderName: m.senderName,
      body: m.body,
      attachments: m.attachments,
    }));

    const buffer = await this.buildPdf(
      {
        title: 'Support Conversation',
        participants: ['Admin (Taskora Support)', meta.senderName],
        statusLine: `Subject: ${meta.subject}`,
      },
      exportMessages,
    );

    return {
      data: buffer.toString('base64'),
      filename: `support-ticket-${ticketId}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  private buildPdf(
    meta: {
      title: string;
      participants: string[];
      statusLine: string;
      refLine?: string;
    },
    messages: ExportMessage[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(16).font('Helvetica-Bold').text(meta.title, { align: 'left' });
      doc.moveDown(0.4);
      doc.fontSize(10).font('Helvetica').text(SEPARATOR);
      doc.moveDown(0.6);

      // Participants
      doc.fontSize(11).font('Helvetica-Bold').text('Participants:');
      for (const p of meta.participants) {
        doc.fontSize(11).font('Helvetica').text(p);
      }
      doc.moveDown(0.6);

      // Status / subject
      doc.fontSize(11).font('Helvetica').text(meta.statusLine);
      if (meta.refLine) {
        doc.fontSize(11).font('Helvetica').text(meta.refLine);
      }
      doc.moveDown(0.6);
      doc.fontSize(10).font('Helvetica').text(SEPARATOR);
      doc.moveDown(0.8);

      // Messages grouped by date
      let lastDate = '';
      for (const msg of messages) {
        const date = new Date(msg.timestamp);
        const dateLabel = date.toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const timeLabel = date.toLocaleTimeString('en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        if (dateLabel !== lastDate) {
          if (lastDate !== '') doc.moveDown(0.4);
          doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text(dateLabel);
          doc.fillColor('#000000');
          doc.moveDown(0.4);
          lastDate = dateLabel;
        }

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`${timeLabel} - ${msg.senderName}:`, { continued: false });
        doc.fontSize(11).font('Helvetica').text(msg.body);

        if (msg.attachments && msg.attachments.length > 0) {
          doc.fontSize(9).font('Helvetica-Oblique').fillColor('#444444');
          for (const url of msg.attachments) {
            doc.text(`Attachment: ${url}`);
          }
          doc.fillColor('#000000');
        }

        doc.moveDown(0.6);
      }

      // Footer
      doc.moveDown(0.4);
      doc.fontSize(10).font('Helvetica').text(SEPARATOR);
      doc.moveDown(0.4);
      doc.fontSize(11).font('Helvetica-Oblique').text('End of Conversation', { align: 'center' });

      doc.end();
    });
  }
}
