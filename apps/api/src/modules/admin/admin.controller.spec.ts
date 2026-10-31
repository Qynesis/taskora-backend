import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ReportService } from '../reports/report.service';
import { UsersService } from '../users/users.service';
import { WarningThreadService } from '../warning/warning-thread.service';
import { SupportTicketService } from '../support/support-ticket.service';
import { PdfExportService } from './pdf-export.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: {
    dashboardSummary: jest.Mock;
    getRevenueChart: jest.Mock;
    getJobsChart: jest.Mock;
    findAllProviders: jest.Mock;
    getPaymentSummary: jest.Mock;
    getTransactionList: jest.Mock;
    exportPaymentsCsv: jest.Mock;
  };
  let usersService: { deactivate: jest.Mock; reactivate: jest.Mock; suspend: jest.Mock };
  let warningThreadService: { sendAdminMessage: jest.Mock };

  beforeEach(async () => {
    adminService = {
      dashboardSummary: jest.fn(),
      getRevenueChart: jest.fn(),
      getJobsChart: jest.fn(),
      findAllProviders: jest.fn(),
      getPaymentSummary: jest.fn(),
      getTransactionList: jest.fn(),
      exportPaymentsCsv: jest.fn(),
    };
    usersService = { deactivate: jest.fn(), reactivate: jest.fn(), suspend: jest.fn() };
    warningThreadService = { sendAdminMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: adminService },
        {
          provide: ReportService,
          useValue: {
            updateAdmin: jest.fn().mockResolvedValue({}),
            markAsSuspended: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: UsersService, useValue: usersService },
        { provide: WarningThreadService, useValue: warningThreadService },
        { provide: SupportTicketService, useValue: {} },
        { provide: PdfExportService, useValue: {} },
      ],
    })
      .useMocker((_token) =>
        new Proxy(
          {},
          {
            get: (_target, prop) => (prop === 'then' ? undefined : jest.fn()),
          },
        ),
      )
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getProviders to adminService', async () => {
    adminService.findAllProviders.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.getProviders({ page: 1, limit: 10 } as any);

    expect(adminService.findAllProviders).toHaveBeenCalledWith(expect.any(Object));
    expect(result.total).toBe(0);
  });

  it('should delegate getDashboardSummary to adminService', async () => {
    adminService.dashboardSummary.mockResolvedValue({
      user: { provider: 2, seeker: 3, total: 5 },
      jobs: { provider: 1, seeker: 4, total: 4 },
      revenue: { provider: 50, seeker: 100, total: 150 },
      currency: 'AUD',
      pending_verifications: { total: 5, pending: 2, verified: 3 },
    });

    const result = await controller.getDashboardSummary();

    expect(adminService.dashboardSummary).toHaveBeenCalledTimes(1);
    expect(result.pending_verifications).toEqual({ total: 5, pending: 2, verified: 3 });
  });

  it('should delegate getRevenueChart to adminService with query year', async () => {
    adminService.getRevenueChart.mockResolvedValue({
      year: 2026,
      monthlyRevenue: [],
      revenueChangePercent: 0,
    });

    const result = await controller.getRevenueChart({ year: 2026 } as any);

    expect(adminService.getRevenueChart).toHaveBeenCalledWith(2026);
    expect(result.year).toBe(2026);
  });

  it('should delegate getJobsChart to adminService with query year', async () => {
    adminService.getJobsChart.mockResolvedValue({
      year: 2026,
      jobsOverview: [],
      jobChangePercent: 0,
    });

    const result = await controller.getJobsChart({ year: 2026 } as any);

    expect(adminService.getJobsChart).toHaveBeenCalledWith(2026);
    expect(result.year).toBe(2026);
  });

  it('should delegate deactivateUser and return { id }', async () => {
    usersService.deactivate.mockResolvedValue({ id: 'u1' });

    const result = await controller.deactivateUser('u1', { id: 'admin1' } as any);

    expect(usersService.deactivate).toHaveBeenCalledWith('u1', 'admin1');
    expect(result).toEqual({ id: 'u1' });
  });

  it('should delegate reactivateUser and return { id }', async () => {
    usersService.reactivate.mockResolvedValue({ id: 'u1' });

    const result = await controller.reactivateUser('u1', { id: 'admin1' } as any);

    expect(usersService.reactivate).toHaveBeenCalledWith('u1', 'admin1');
    expect(result).toEqual({ id: 'u1' });
  });

  it('should delegate suspendUser and return { id }', async () => {
    usersService.suspend.mockResolvedValue({ id: 'u1' });

    const result = await controller.suspendUser('u1', { reportId: 'r1' } as any, { id: 'admin1' } as any);

    expect(usersService.suspend).toHaveBeenCalledWith('u1', 'admin1');
    expect(result).toEqual({ id: 'u1' });
  });

  it('should delegate getPaymentSummary to adminService', async () => {
    const summary = { platformRevenue: 4200, totalTransactions: 38, totalRefunded: 300, currency: 'AUD' };
    adminService.getPaymentSummary.mockResolvedValue(summary);

    const result = await controller.getPaymentSummary();

    expect(adminService.getPaymentSummary).toHaveBeenCalledTimes(1);
    expect(result).toEqual(summary);
  });

  it('should delegate getTransactionList and pass query through', async () => {
    const paginated = { items: [], total: 0, page: 2, limit: 5, totalPages: 0 };
    adminService.getTransactionList.mockResolvedValue(paginated);

    const query: any = { page: 2, limit: 5, type: 'payment' };
    const result = await controller.getTransactionList(query);

    expect(adminService.getTransactionList).toHaveBeenCalledWith(query);
    expect(result.page).toBe(2);
  });

  it('should delegate exportPaymentsCsv and return base64 payload', async () => {
    const payload = { data: 'VHJhbnNhY3Rpb24gSUQ=', filename: 'payments-2025-06-05.csv' };
    adminService.exportPaymentsCsv.mockResolvedValue(payload);

    const result = await controller.exportPaymentsCsv();

    expect(adminService.exportPaymentsCsv).toHaveBeenCalledTimes(1);
    expect(result).toEqual(payload);
  });

  it('should delegate sendWarningThreadMessage with admin user id', async () => {
    warningThreadService.sendAdminMessage.mockResolvedValue({ id: 'm1' });

    const result = await controller.sendWarningThreadMessage(
      'thread-1',
      { body: 'Please update' } as any,
      { id: 'admin-1' } as any,
    );

    expect(warningThreadService.sendAdminMessage).toHaveBeenCalledWith('thread-1', 'admin-1', {
      body: 'Please update',
    });
    expect(result.id).toBe('m1');
  });
});