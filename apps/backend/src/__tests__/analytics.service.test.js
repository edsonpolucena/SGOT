// apps/backend/src/modules/analytics/__tests__/analytics.service.test.js

jest.mock('../../prisma', () => {
  // Mock básico do prisma usado pelo analytics.service
  const prisma = {
    obligation: {
      findMany: jest.fn(),
    },
    empresa: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  return { prisma };
});

const { prisma } = require('../../prisma');

const {
  getMonthlySummary,
  getMonthlyVariationByTax,
  getDocumentControlDashboard,
  getTaxTypeStats,
  getClientTaxReport,
  getDeadlineComplianceStats,
  getOverdueAndUpcomingTaxes,
  getUnviewedAlertsForAccounting,
} = require('../analytics.service');

describe('Analytics Service (unit - cobertura)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------
  // getMonthlySummary
  // -------------------------------------------------------------------
  test('getMonthlySummary deve somar e agrupar impostos', async () => {
    prisma.obligation.findMany.mockResolvedValue([
      { title: 'DAS - Janeiro', amount: 1000 },
      { title: 'ISS', amount: 500 },
      { title: 'SEM VALOR', amount: null },
    ]);

    const result = await getMonthlySummary(1, '2025-01');

    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(1);
    expect(result.empresaId).toBe(1);
    expect(result.mes).toBe('2025-01');
    expect(result.total).toBe(1500);
    expect(result.impostos).toHaveLength(2);
  });

  // -------------------------------------------------------------------
  // getMonthlyVariationByTax
  // -------------------------------------------------------------------
  test('getMonthlyVariationByTax deve calcular variação entre meses', async () => {
    // 1ª chamada: mês atual
    prisma.obligation.findMany
      .mockResolvedValueOnce([
        { title: 'DAS - Atual', amount: 200 },
        { title: 'ISS - Atual', amount: 100 },
      ])
      // 2ª chamada: mês anterior
      .mockResolvedValueOnce([
        { title: 'DAS - Anterior', amount: 100 },
      ]);

    const result = await getMonthlyVariationByTax(1, '2025-02');

    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(2);
    expect(result.empresaId).toBe(1);
    expect(result.mesAtual).toBe('2025-02');

    const das = result.impostos.find((i) => i.imposto === 'DAS');
    expect(das.valorAnterior).toBe(100);
    expect(das.valorAtual).toBe(200);
    expect(das.variacao).toBe(100);
  });

  // -------------------------------------------------------------------
  // getDocumentControlDashboard
  // -------------------------------------------------------------------
  test('getDocumentControlDashboard deve montar companies e summary', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        nome: 'Empresa 1',
        status: 'ativa',
        taxProfiles: [{ taxType: 'DAS', isActive: true }],
        obligations: [
          {
            taxType: 'DAS',
            status: 'PENDING',
            amount: 1000,
            files: [{ id: 1 }],
          },
          {
            taxType: 'DAS',
            status: 'NOT_APPLICABLE',
            amount: null,
            files: [],
          },
        ],
      },
    ]);

    const result = await getDocumentControlDashboard(
      '2025-01',
      'ACCOUNTING_SUPER',
      null,
    );

    expect(prisma.empresa.findMany).toHaveBeenCalledTimes(1);
    expect(result.month).toBe('2025-01');
    expect(Array.isArray(result.companies)).toBe(true);
    expect(result.summary.totalCompanies).toBe(1);
  });

  test('getDocumentControlDashboard deve filtrar empresa quando CLIENT_', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 99,
        nome: 'Cliente',
        status: 'ativa',
        taxProfiles: [],
        obligations: [],
      },
    ]);

    const result = await getDocumentControlDashboard(
      '2025-01',
      'CLIENT_ADMIN',
      99,
    );

    expect(prisma.empresa.findMany.mock.calls[0][0].where).toEqual({
      status: 'ativa',
      id: 99,
    });
    expect(result.companies[0].companyId).toBe(99);
  });

  // -------------------------------------------------------------------
  // getTaxTypeStats
  // -------------------------------------------------------------------
  test('getTaxTypeStats deve calcular completionRate por imposto', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        codigo: 'EMP002',
        status: 'ativa',
        taxProfiles: [{ taxType: 'DAS', isActive: true }],
      },
    ]);

    prisma.obligation.findMany.mockResolvedValue([
      {
        companyId: 1,
        taxType: 'DAS',
        amount: 1000,
        files: [],
      },
    ]);

    const result = await getTaxTypeStats('2025-01');

    expect(prisma.empresa.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(1);
    expect(result.month).toBe('2025-01');
    expect(result.totalCompanies).toBe(1);
    expect(result.taxStats[0].taxType).toBe('DAS');
  });

  // -------------------------------------------------------------------
  // getClientTaxReport
  // -------------------------------------------------------------------
  test('getClientTaxReport deve montar relatório para a empresa', async () => {
    prisma.empresa.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Empresa Cliente',
    });

    prisma.obligation.findMany.mockImplementation(async () => [
      { taxType: 'DAS', amount: 100 },
      { taxType: 'ISS', amount: 50 },
    ]);

    const result = await getClientTaxReport(1, 3); // últimos 3 meses

    expect(prisma.empresa.findUnique).toHaveBeenCalledTimes(1);
    // findMany chamado 3x (1 por mês)
    expect(prisma.obligation.findMany).toHaveBeenCalled();
    expect(result.companyId).toBe(1);
    expect(result.monthlyData).toHaveLength(3);
    expect(result.taxTypeTotals.length).toBeGreaterThan(0);
  });

  test('getClientTaxReport deve lançar erro se empresa não existir', async () => {
    prisma.empresa.findUnique.mockResolvedValue(null);

    await expect(getClientTaxReport(999, 3)).rejects.toThrow(
      'Empresa não encontrada',
    );
  });

  // -------------------------------------------------------------------
  // getDeadlineComplianceStats
  // -------------------------------------------------------------------
  test('getDeadlineComplianceStats deve calcular complianceRate', async () => {
    const now = new Date();
    const dueFuture = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const duePast = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        taxType: 'DAS',
        amount: 100,
        status: 'PENDING',
        dueDate: dueFuture,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        files: [{ createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) }],
        company: { codigo: 'EMP002', nome: 'Empresa 2' },
      },
      {
        taxType: 'ISS',
        amount: 50,
        status: 'PENDING',
        dueDate: duePast,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        files: [{ createdAt: new Date(now.getTime()) }],
        company: { codigo: 'EMP002', nome: 'Empresa 2' },
      },
    ]);

    const result = await getDeadlineComplianceStats('2025-01');

    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(1);
    expect(result.month).toBe('2025-01');
    expect(result.total).toBe(2);
    expect(result.details.length).toBe(2);
  });

  // -------------------------------------------------------------------
  // getOverdueAndUpcomingTaxes
  // -------------------------------------------------------------------
  test('getOverdueAndUpcomingTaxes deve separar overdue e dueSoon', async () => {
    const now = new Date();
    const ontem = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const amanha = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        taxType: 'DAS',
        amount: null,
        dueDate: ontem,
        files: [],
        company: { id: 1, codigo: 'EMP002', nome: 'Empresa 2' },
      },
      {
        taxType: 'ISS',
        amount: 0,
        dueDate: amanha,
        files: [],
        company: { id: 1, codigo: 'EMP002', nome: 'Empresa 2' },
      },
    ]);

    const result = await getOverdueAndUpcomingTaxes('2025-01');

    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(1);
    expect(result.month).toBe('2025-01');
    expect(result.overdue.count + result.dueSoon.count).toBe(2);
  });

  // -------------------------------------------------------------------
  // getUnviewedAlertsForAccounting
  // -------------------------------------------------------------------
  test('getUnviewedAlertsForAccounting deve agrupar por dias até vencimento', async () => {
    const now = new Date();
    const in1 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const in2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        id: 1,
        title: 'DAS 1',
        taxType: 'DAS',
        dueDate: in1,
        company: { codigo: 'EMP010', nome: 'Empresa 10' },
        files: [{}],
      },
      {
        id: 2,
        title: 'DAS 2',
        taxType: 'DAS',
        dueDate: in2,
        company: { codigo: 'EMP010', nome: 'Empresa 10' },
        files: [{}],
      },
      {
        id: 3,
        title: 'DAS 3',
        taxType: 'DAS',
        dueDate: in3,
        company: { codigo: 'EMP010', nome: 'Empresa 10' },
        files: [{}],
      },
    ]);

    const result = await getUnviewedAlertsForAccounting();

    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(3);
    expect(result.oneDay.length).toBeGreaterThanOrEqual(1);
    expect(result.twoDays.length).toBeGreaterThanOrEqual(1);
    expect(result.threeDays.length).toBeGreaterThanOrEqual(1);
  });
});
