import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Job } from '../../database/entities/job.entity';
import { JobContract } from '../../database/entities/job-contract.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { Profile } from '../../database/entities/profile.entity';
import { SavedPaymentMethod } from '../../database/entities/saved-payment-method.entity';
import { PaymentStatus } from '../../database/common/enum';
import { PlatformFeeService } from '../platform-fee/platform-fee.service';
import { money } from '../../interfaces/money.util';

@Injectable()
export class ContractPdfService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobContract)
    private readonly contractRepo: Repository<JobContract>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(SavedPaymentMethod)
    private readonly savedPmRepo: Repository<SavedPaymentMethod>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly platformFeeService: PlatformFeeService,
  ) {}

  async generatePdf(jobId: string, requesterId: string): Promise<{ base64: string; filename: string }> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId } as any,
      relations: {
        seeker: true,
        provider: true,
        category: true,
      },
    });
    if (!job) throw new NotFoundException(`Job "${jobId}" not found`);

    const effectiveProvider = job.provider;
    const isParticipant = job.seeker?.id === requesterId || effectiveProvider?.id === requesterId;
    if (!isParticipant) throw new ForbiddenException('Access denied');

    const contract = await this.contractRepo.findOne({ where: { job: { id: jobId } } as any });
    if (!contract) throw new NotFoundException('No contract found for this job');

    // Allow access if payment fully succeeded OR if at least one subscription
    // installment has been collected (a Transaction row exists for this job's payment).
    const payment = await this.paymentRepo.findOne({
      where: { job: { id: jobId } } as any,
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      throw new ForbiddenException('Service agreement is only available after a successful payment');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      const hasTxn = await this.transactionRepo.exists({
        where: { payment: { id: payment.id } },
      });
      if (!hasTxn) {
        throw new ForbiddenException('Service agreement is only available after a successful payment');
      }
    }

    const seekerProfile = await this.profileRepo.findOne({
      where: { user_id: job.seeker.id } as any,
    });

    const providerProfile = effectiveProvider
      ? await this.profileRepo.findOne({
          where: { user_id: effectiveProvider.id } as any,
          relations: { workInfo: true },
        })
      : null;

    const providerWorkInfo = providerProfile?.workInfo ?? null;

    const savedPm = await this.savedPmRepo.findOne({
      where: { seeker: { id: job.seeker.id }, isDefault: true } as any,
    });

    // The whole-contract cost breakdown is derived from the (GST-inclusive) contract total and the
    // active platform-charge %, mirroring the consolidated tax invoice — NOT summed from the
    // transaction ledger, which for a running subscription only holds the cycles collected so far.
    const { platformCharge } = await this.platformFeeService.getCharge();

    const buffer = await this._build(
      job, contract, payment,
      seekerProfile, providerProfile, providerWorkInfo, savedPm,
      platformCharge,
    );

    return { base64: buffer.toString('base64'), filename: `service-agreement-${job.jobRef ?? job.id}.pdf` };
  }

  // ─────────────────────────────────────────────────────────────────────────────

  private _build(
    job: Job,
    contract: JobContract,
    payment: Payment,
    seekerProfile: Profile | null,
    providerProfile: Profile | null,
    providerWorkInfo: any | null,
    savedPm: SavedPaymentMethod | null,
    platformChargePercent: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 48, bottom: 30, left: 48, right: 48 },
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;
      const MARGIN = 48;
      const W = pageW - MARGIN * 2;
      const BLUE = '#1D3461';
      const MUTED = '#6B7280';
      const LIGHT = '#F3F4F6';
      const BORDER = '#E5E7EB';
      const BLACK = '#111827';
      const fmt = (amount: number, currency = 'AUD') =>
        `$${Number(amount).toFixed(2)} ${currency}`;

      // ── Header bar ──────────────────────────────────────────────────────────
      doc.rect(0, 0, pageW, 70).fill(BLUE);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('Service Agreement', MARGIN, 16);
      doc.fillColor('#A8C0DD').font('Helvetica').fontSize(10).text(`Contract ID: ${job.jobRef ?? job.id}`, MARGIN, 42);
      doc.y = 86;

      // ── Helpers ─────────────────────────────────────────────────────────────
      const BAR_H = 16;
      const section = (title: string) => {
        doc.moveDown(0.35);
        const barY = doc.y;
        doc.rect(MARGIN, barY, W, BAR_H).fill(LIGHT);
        doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(9)
          .text(title, MARGIN + 6, barY + 4, { lineBreak: false });
        doc.y = barY + BAR_H + 3;
      };

      const kv = (
        label: string,
        value: string | null | undefined,
        x = MARGIN,
        w = W,
        opts?: { bold?: boolean },
      ) => {
        const y = doc.y;
        doc.fillColor(MUTED).font('Helvetica').fontSize(8.5)
          .text(label, x, y, { width: w * 0.36, continued: false });
        const afterLabelY = doc.y;
        doc.fillColor(BLACK).font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
          .text(value ?? '—', x + w * 0.38, y, { width: w * 0.62 });
        doc.y = Math.max(afterLabelY, doc.y);
      };

      const rule = () => {
        doc.moveDown(0.3);
        doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + W, doc.y).strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.moveDown(0.3);
      };

      // ── Party details (two columns) ─────────────────────────────────────────
      const colW = W / 2 - 10;
      const colR = MARGIN + colW + 20;

      const partyY = doc.y;

      // Left: Seeker
      doc.rect(MARGIN, partyY, colW, 14).fill(BLUE);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5)
        .text('SEEKER DETAILS', MARGIN + 6, partyY + 3);
      let sy = partyY + 20;
      const sName = [seekerProfile?.firstName, seekerProfile?.lastName].filter(Boolean).join(' ') || '—';
      const sAddr = [seekerProfile?.suburb, seekerProfile?.state].filter(Boolean).join(', ') || '—';
      for (const [l, v] of [
        ['Name', sName],
        ['Email', job.seeker?.email ?? '—'],
        ['Phone', seekerProfile?.phone ?? '—'],
        ['Current Location', sAddr],
      ] as [string, string][]) {
        doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(l, MARGIN, sy, { width: colW * 0.42 });
        doc.fillColor(BLACK).fontSize(8).text(v, MARGIN + colW * 0.44, sy, { width: colW * 0.56 });
        sy += 14;
      }

      // Right: Provider
      doc.rect(colR, partyY, colW, 14).fill(BLUE);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5)
        .text('PROVIDER DETAILS', colR + 6, partyY + 3);
      const effectiveProvider = job.provider;
      let py = partyY + 20;
      const pName = [providerProfile?.firstName, providerProfile?.lastName].filter(Boolean).join(' ') || '—';
      const pAddr = [providerProfile?.suburb, providerProfile?.state].filter(Boolean).join(', ') || '—';
      for (const [l, v] of [
        ['Name', pName],
        ['Email', effectiveProvider?.email ?? '—'],
        ['Phone', providerProfile?.phone ?? '—'],
        ['Address', pAddr],
        ['ABN', providerWorkInfo?.abn ?? '—'],
      ] as [string, string][]) {
        doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(l, colR, py, { width: colW * 0.42 });
        doc.fillColor(BLACK).fontSize(8).text(v, colR + colW * 0.44, py, { width: colW * 0.56 });
        py += 14;
      }

      doc.y = Math.max(sy, py) + 10;

      rule();

      // ── Service Details ──────────────────────────────────────────────────────
      section('SERVICE DETAILS');
      kv('Service', job.title ?? job.category?.name ?? '—');
      kv('Duration', job.serviceDuration?.replace(/_/g, ' ') ?? '—');
      kv('Start Date', job.startDate ?? '—');
      kv('End Date', job.endDate ?? '—');
      kv('Service Location', job.locationText ?? '—');

      rule();

      // ── Service Schedule ─────────────────────────────────────────────────────
      section('SERVICE SCHEDULE');
      const days = job.scheduledDays?.length ? job.scheduledDays : [];
      const timeRange =
        job.startTime && job.endTime
          ? `${_to12h(job.startTime)} - ${_to12h(job.endTime)}`
          : '—';

      if (days.length === 0) {
        kv('Schedule', timeRange);
      } else {
        const headerY = doc.y;
        doc.rect(MARGIN, headerY, W * 0.45, 14).fill(LIGHT);
        doc.rect(MARGIN + W * 0.47, headerY, W * 0.53, 14).fill(LIGHT);
        doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
          .text('Day', MARGIN + 6, headerY + 3)
          .text('Time', MARGIN + W * 0.47 + 6, headerY + 3);
        doc.moveDown(0.1);
        days.forEach((d, i) => {
          const rowY = doc.y + i * 14;
          if (i % 2 === 0) doc.rect(MARGIN, rowY, W, 14).fill('#FAFAFA');
          const dayLabel = d.charAt(0).toUpperCase() + d.slice(1);
          doc.fillColor(BLACK).font('Helvetica').fontSize(8)
            .text(dayLabel, MARGIN + 6, rowY + 3)
            .text(timeRange, MARGIN + W * 0.47 + 6, rowY + 3);
        });
        doc.moveDown((days.length * 14) / doc.currentLineHeight());
      }

      rule();

      // ── Payment Details ──────────────────────────────────────────────────────
      section('PAYMENT DETAILS');
      const durationMonths = job.durationMonths ?? null;
      const totalAmount = payment.amount;
      const freq = contract.paymentFrequency;

      const FREQ_LABEL: Record<string, string> = {
        weekly: 'Weekly',
        bi_weekly: 'Bi-Weekly',
        fortnightly: 'Fortnightly',
        monthly: 'Monthly',
      };
      const FREQ_CYCLES_PER_MONTH: Record<string, number> = {
        weekly: 4,
        bi_weekly: 2,
        fortnightly: 2,
        monthly: 1,
      };

      const freqLabel = FREQ_LABEL[freq] ?? 'Per-Period';
      const cyclesPerMonth = FREQ_CYCLES_PER_MONTH[freq] ?? 1;
      const totalCycles = durationMonths && durationMonths > 0 ? durationMonths * cyclesPerMonth : null;
      const installmentAmount = totalCycles
        ? totalAmount / totalCycles
        : (job.totalBudget ?? job.budgetPrice ?? totalAmount);

      kv('Payment Frequency', freqLabel);
      kv('Total Duration', durationMonths ? `${durationMonths} Month${durationMonths > 1 ? 's' : ''}` : '—');
      if (totalCycles) kv('Total Installments', String(totalCycles));
      if (contract.depositAmount != null) {
        kv('1st Installment (Deposit)', fmt(contract.depositAmount, payment.currency));
        if (totalCycles && totalCycles > 1) {
          kv('Remaining Installments', `${totalCycles - 1} × ${fmt(installmentAmount, payment.currency)}`);
        }
      } else {
        kv(`${freqLabel} Fee`, fmt(installmentAmount, payment.currency));
      }

      // Cost breakdown (new model). The provider's job price is the base; the GST-inclusive service
      // fee is added ON TOP, and GST is calculated on the fee only. A multi-cycle subscription shows
      // what the seeker pays each installment (how it's actually billed) plus the contract total;
      // a single payment shows one whole-amount block. The fee line is GST-inclusive so its % is truthful.
      const feeLabel = platformChargePercent > 0
        ? `Taskora Service Fee (${platformChargePercent}%) — GST inclusive`
        : 'Taskora Service Fee — GST inclusive';
      const isMultiCycle = !!totalCycles && totalCycles > 1;

      doc.moveDown(0.3); // separate the payment schedule above from the cost breakdown below

      if (isMultiCycle) {
        const cycleFee = money(installmentAmount * (platformChargePercent / 100));
        const cycleCharged = money(installmentAmount + cycleFee);
        const grossFee = money(totalAmount * (platformChargePercent / 100));
        const contractCharged = money(totalAmount + grossFee);

        kv('Service Payment (per installment)', fmt(money(installmentAmount), payment.currency));
        kv(`${feeLabel} (per installment)`, fmt(cycleFee, payment.currency));
        kv('Amount per Installment', fmt(cycleCharged, payment.currency), MARGIN, W, { bold: true });
        kv(`Total (${totalCycles} installments)`, fmt(contractCharged, payment.currency), MARGIN, W, { bold: true });
      } else {
        const grossFee = money(totalAmount * (platformChargePercent / 100));
        const chargedTotal = money(totalAmount + grossFee);

        kv('Service Payment', fmt(totalAmount, payment.currency));
        kv(feeLabel, fmt(grossFee, payment.currency));
        kv('Total Amount', fmt(chargedTotal, payment.currency), MARGIN, W, { bold: true });
      }

      rule();

      // ── Payment Method ───────────────────────────────────────────────────────
      section('PAYMENT METHOD');
      if (savedPm) {
        const brand = savedPm.brand
          ? savedPm.brand.charAt(0).toUpperCase() + savedPm.brand.slice(1)
          : 'Credit Card';
        const masked = `${'x'.repeat(8)}${savedPm.last4 ?? '****'}`;
        kv('Method', brand);
        kv('Card Number', masked);
        if (savedPm.expMonth && savedPm.expYear) {
          kv('Expiry', `${String(savedPm.expMonth).padStart(2, '0')}/${savedPm.expYear}`);
        }
      } else {
        kv('Method', payment.method ?? 'Credit Card');
      }

      rule();

      // ── Terms & Conditions ───────────────────────────────────────────────────
      section('TERMS & CONDITIONS');
      const terms = [
        'The service provider agrees to provide the service professionally.',
        'The service seeker must provide safe access to the service location.',
        'If either party cancels early, platform cancellation policies will apply.',
        'Payment must be completed before service begins.',
        'Any disputes will be resolved through the platform administration.',
        ...(contract.depositAmount != null
          ? [`A deposit of ${fmt(contract.depositAmount, payment.currency)} is required from the seeker before work commences.`]
          : []),
        ...(contract.confidentialityClause
          ? ['The provider must keep all seeker information strictly confidential.']
          : []),
        ...(contract.earlyTermination
          ? ['Either party may terminate with 14 days written notice.']
          : []),
        ...(contract.additionalClause ? [`Additional clause: ${contract.additionalClause}`] : []),
      ];
      terms.forEach((t, i) => {
        doc.fillColor(BLACK).font('Helvetica').fontSize(8.5)
          .text(`${i + 1}.  ${t}`, MARGIN, doc.y, { width: W, lineGap: 1 });
        doc.moveDown(0.35);
      });

      rule();

      // ── Cancellation Policy ──────────────────────────────────────────────────
      section('CANCELLATION POLICY');
      doc.fillColor(BLACK).font('Helvetica').fontSize(8.5)
        .text(
          'Cancellation must be requested 48 hours before the next scheduled service.',
          MARGIN, doc.y, { width: W, lineGap: 2 },
        );

      rule();

      // ── Signatures ───────────────────────────────────────────────────────────
      const sigMaxY = doc.page.height - 100;
      const sigY = Math.min(doc.y + 14, sigMaxY);
      const sigColW = W / 2 - 20;

      doc.moveTo(MARGIN, sigY + 30).lineTo(MARGIN + sigColW, sigY + 30)
        .strokeColor('#374151').lineWidth(0.5).stroke();
      doc.fillColor(BLACK).font('Helvetica').fontSize(8)
        .text('Service Seeker Signature', MARGIN, sigY + 34, { lineBreak: false });
      doc.fillColor(MUTED).fontSize(7.5).text(sName, MARGIN, sigY + 46, { lineBreak: false });

      const pSigX = MARGIN + sigColW + 40;
      doc.moveTo(pSigX, sigY + 30).lineTo(pSigX + sigColW, sigY + 30)
        .strokeColor('#374151').lineWidth(0.5).stroke();
      doc.fillColor(BLACK).font('Helvetica').fontSize(8)
        .text('Service Provider Signature', pSigX, sigY + 34, { lineBreak: false });
      doc.fillColor(MUTED).fontSize(7.5).text(pName, pSigX, sigY + 46, { lineBreak: false });

      // ── Footer on every page ─────────────────────────────────────────────────
      const range = (doc as any).bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.fillColor(MUTED).font('Helvetica').fontSize(7)
          .text(
            `Generated ${new Date().toLocaleDateString('en-AU')}  |  Contract ID: ${job.jobRef ?? job.id}  |  Page ${i + 1} of ${range.count}`,
            MARGIN, doc.page.height - 30,
            { width: W, align: 'center', lineBreak: false },
          );
      }

      doc.end();
    });
  }
}

function _to12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}
