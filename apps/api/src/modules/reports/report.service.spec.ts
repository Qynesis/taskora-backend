import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportService } from './report.service';
import { UserReport } from '../../database/entities/user-report.entity';
import { User } from '../../database/entities/user.entity';
import { UserWarning } from '../../database/entities/user-warning.entity';
import { WarningThread } from '../../database/entities/warning-thread.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportAdminDto } from './dto/update-report-admin.dto';
import { SendWarningAdminDto } from './dto/send-warning-admin.dto';
import { TransactionHelper } from '../../database/transaction.helper';
import { DomainEventEmitter } from '../../events/domain-event-emitter.service';
import { WarningThreadService } from '../warning/warning-thread.service';
import { ReportStatus, ReportType } from '../../database/common/enum';
import {
  createMockRepository,
  createMockEventEmitter,
} from '../../../test/helpers/test-factory';

const REPORT_ID = '00000000-0000-0000-0000-000000000010';
const REPORTER_ID = '00000000-0000-0000-0000-000000000001';
const SUBJECT_ID = '00000000-0000-0000-0000-000000000002';
const ADMIN_ID = '00000000-0000-0000-0000-000000000003';
const WARNING_ID = '00000000-0000-0000-0000-000000000020';
const THREAD_ID = '00000000-0000-0000-0000-000000000030';

function makeReport(overrides: Partial<any> = {}): any {
  return {
    id: REPORT_ID,
    reportRef: 'RPT-123456',
    status: ReportStatus.PENDING,
    reportKind: ReportType.HARASSMENT,
    description: 'Test report',
    reporter: { id: REPORTER_ID, email: 'reporter@test.com', profile: null, createdAt: new Date('2026-01-01T00:00:00Z') },
    subjectUser: { id: SUBJECT_ID, email: 'subject@test.com', profile: null, createdAt: new Date('2026-01-01T00:00:00Z') },
    dismissedReason: null,
    resolvedAt: null,
    warningMessage: null,
    warnedAt: null,
    suspensionDeadline: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeTxHelper() {
  return {
    run: jest.fn().mockImplementation(async (cb: (qr: any) => Promise<unknown>) => {
      const manager = {
        create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
        save: jest.fn().mockImplementation((_entity: unknown, data: any) => ({
          id: WARNING_ID,
          ...data,
        })),
      };
      return cb({ manager });
    }),
  };
}

describe('ReportService', () => {
  let module: TestingModule;
  let service: ReportService;
  let reportRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let warningRepo: ReturnType<typeof createMockRepository>;
  let warningThreadRepo: ReturnType<typeof createMockRepository>;
  let txHelper: ReturnType<typeof makeTxHelper>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;
  let warningThreadService: { createForWarning: jest.Mock };

  beforeEach(async () => {
    reportRepo = createMockRepository();
    userRepo = createMockRepository();
    warningRepo = createMockRepository();
    warningThreadRepo = createMockRepository();
    txHelper = makeTxHelper();
    eventEmitter = createMockEventEmitter();
    warningThreadService = {
      createForWarning: jest.fn().mockResolvedValue({ thread: { id: THREAD_ID } }),
    };

    module = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: getRepositoryToken(UserReport), useValue: reportRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserWarning), useValue: warningRepo },
        { provide: getRepositoryToken(WarningThread), useValue: warningThreadRepo },
        { provide: TransactionHelper, useValue: txHelper },
        { provide: DomainEventEmitter, useValue: eventEmitter },
        { provide: WarningThreadService, useValue: warningThreadService },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a report and emit ReportCreatedEvent', async () => {
      const createdReport = makeReport();
      txHelper.run.mockImplementation(async (cb: (qr: any) => Promise<unknown>) => {
        const manager = {
          create: jest.fn().mockReturnValue(createdReport),
          save: jest.fn().mockResolvedValue(createdReport),
        };
        return cb({ manager });
      });

      const result = await service.create(
        { subjectUserId: SUBJECT_ID, reportKind: ReportType.HARASSMENT, description: 'Bad behaviour' } as CreateReportDto,
        REPORTER_ID,
      );

      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe(REPORT_ID);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should throw NotFoundException when report does not exist', async () => {
      reportRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return report detail when found', async () => {
      reportRepo.findOne.mockResolvedValue(makeReport());

      const result = await service.findOne(REPORT_ID);

      expect(result.id).toBe(REPORT_ID);
    });
  });

  // ── updateAdmin ────────────────────────────────────────────────────────────

  describe('updateAdmin', () => {
    it('should throw NotFoundException when report does not exist', async () => {
      reportRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateAdmin('non-existent-id', { status: ReportStatus.DISMISSED } as UpdateReportAdminDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when dismissing without a reason', async () => {
      reportRepo.findOne.mockResolvedValue(makeReport());

      await expect(
        service.updateAdmin(REPORT_ID, { status: ReportStatus.DISMISSED } as UpdateReportAdminDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should dismiss with reason and emit event when status is DISMISSED', async () => {
      const report = makeReport();
      reportRepo.findOne.mockResolvedValue(report);
      reportRepo.save.mockResolvedValue({ ...report, status: ReportStatus.DISMISSED, dismissedReason: 'Duplicate report' });

      const result = await service.updateAdmin(REPORT_ID, {
        status: ReportStatus.DISMISSED,
        dismissedReason: 'Duplicate report',
      } as UpdateReportAdminDto);

      expect(reportRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe(REPORT_ID);
    });

    it('should dismiss with reason and emit event', async () => {
      const report = makeReport();
      reportRepo.findOne.mockResolvedValue(report);
      reportRepo.save.mockResolvedValue({ ...report, status: ReportStatus.DISMISSED, dismissedReason: 'Not valid' });

      const result = await service.updateAdmin(REPORT_ID, {
        status: ReportStatus.DISMISSED,
        dismissedReason: 'Not valid',
      } as UpdateReportAdminDto);

      expect(reportRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe(REPORT_ID);
    });
  });

  // ── sendWarning ────────────────────────────────────────────────────────────

  describe('sendWarning', () => {
    it('should throw NotFoundException when report does not exist', async () => {
      reportRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendWarning('non-existent-id', { warningMessage: 'Stop it' } as SendWarningAdminDto, ADMIN_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when report status is not PENDING', async () => {
      reportRepo.findOne.mockResolvedValue(makeReport({ status: ReportStatus.DISMISSED }));

      await expect(
        service.sendWarning(REPORT_ID, { warningMessage: 'Stop it' } as SendWarningAdminDto, ADMIN_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send warning, create thread, and emit event', async () => {
      reportRepo.findOne.mockResolvedValue(makeReport());

      const result = await service.sendWarning(
        REPORT_ID,
        { warningMessage: 'Final warning' } as SendWarningAdminDto,
        ADMIN_ID,
      );

      expect(txHelper.run).toHaveBeenCalled();
      expect(warningThreadService.createForWarning).toHaveBeenCalledWith(
        WARNING_ID,
        SUBJECT_ID,
        ADMIN_ID,
        'Final warning',
      );
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(result.id).toBe(REPORT_ID);
    });
  });
});
