// apps/backend/src/modules/analytics/__tests__/analytics.service.test.js

jest.mock('../prisma', () => {
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

const { prisma } = require('../prisma');

const {
  getMonthlySummary,
  getMonthlyVariationByTax,
  getDocumentControlDashboard,
  getTaxTypeStats,
  getClientTaxReport,
  getDeadlineComplianceStats,
  getOverdueAndUpcomingTaxes,
  getUnviewedAlertsForAccounting,
  getTaxName,
} = require('../modules/analytics/analytics.service');

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

  test('getMonthlySummary deve ignorar obrigações sem amount', async () => {
    prisma.obligation.findMany.mockResolvedValue([
      { title: 'DAS - Sem Valor', amount: null },
      { title: 'ISS - Sem Valor', amount: undefined },
    ]);

    const result = await getMonthlySummary(1, '2025-01');

    expect(result.total).toBe(0);
    expect(result.impostos).toHaveLength(0);
  });

  test('getMonthlySummary deve extrair tipo de título com hífen', async () => {
    prisma.obligation.findMany.mockResolvedValue([
      { title: 'DAS - Janeiro 2025', amount: 1000 },
      { title: 'ISS Retido', amount: 500 }, // sem hífen
    ]);

    const result = await getMonthlySummary(1, '2025-01');

    expect(result.impostos).toHaveLength(2);
    const das = result.impostos.find(i => i.tipo === 'DAS');
    const iss = result.impostos.find(i => i.tipo === 'ISS Retido');
    expect(das).toBeDefined();
    expect(iss).toBeDefined();
  });

  test('getMonthlySummary deve retornar percentual 0 quando total é 0', async () => {
    prisma.obligation.findMany.mockResolvedValue([]);

    const result = await getMonthlySummary(1, '2025-01');

    expect(result.total).toBe(0);
    expect(result.impostos).toHaveLength(0);
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

  test('getMonthlyVariationByTax deve calcular mês anterior quando mês atual é janeiro', async () => {
    prisma.obligation.findMany
      .mockResolvedValueOnce([{ title: 'DAS', amount: 100 }]) // janeiro
      .mockResolvedValueOnce([{ title: 'DAS', amount: 50 }]); // dezembro anterior

    const result = await getMonthlyVariationByTax(1, '2025-01');

    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(2);
    // Deve buscar dezembro de 2024
    const calls = prisma.obligation.findMany.mock.calls;
    expect(calls.length).toBe(2);
  });

  test('getMonthlyVariationByTax deve calcular variação quando valorAnterior > 0', async () => {
    prisma.obligation.findMany
      .mockResolvedValueOnce([{ title: 'DAS', amount: 200 }]) // atual
      .mockResolvedValueOnce([{ title: 'DAS', amount: 100 }]); // anterior

    const result = await getMonthlyVariationByTax(1, '2025-02');

    const das = result.impostos.find((i) => i.imposto === 'DAS');
    expect(das.variacao).toBe(100); // (200-100)/100 * 100 = 100%
  });

  test('getMonthlyVariationByTax deve calcular variação 100 quando valorAnterior = 0 e valorAtual > 0', async () => {
    prisma.obligation.findMany
      .mockResolvedValueOnce([{ title: 'DAS', amount: 100 }]) // atual
      .mockResolvedValueOnce([]); // anterior vazio

    const result = await getMonthlyVariationByTax(1, '2025-02');

    const das = result.impostos.find((i) => i.imposto === 'DAS');
    expect(das.valorAnterior).toBe(0);
    expect(das.valorAtual).toBe(100);
    expect(das.variacao).toBe(100);
  });

  test('getMonthlyVariationByTax deve ignorar obrigações sem amount', async () => {
    prisma.obligation.findMany
      .mockResolvedValueOnce([
        { title: 'DAS', amount: null },
        { title: 'ISS', amount: 100 },
      ])
      .mockResolvedValueOnce([{ title: 'DAS', amount: 50 }]);

    const result = await getMonthlyVariationByTax(1, '2025-02');

    const das = result.impostos.find((i) => i.imposto === 'DAS');
    expect(das.valorAtual).toBe(0); // null foi ignorado
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

  test('getDocumentControlDashboard NÃO deve filtrar quando userRole não é CLIENT_', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        nome: 'Empresa 1',
        status: 'ativa',
        taxProfiles: [],
        obligations: [],
      },
      {
        id: 2,
        nome: 'Empresa 2',
        status: 'ativa',
        taxProfiles: [],
        obligations: [],
      },
    ]);

    const result = await getDocumentControlDashboard(
      '2025-01',
      'ACCOUNTING_SUPER',
      null,
    );

    expect(prisma.empresa.findMany.mock.calls[0][0].where).toEqual({
      status: 'ativa',
    });
    expect(result.companies.length).toBe(2);
  });

  test('getDocumentControlDashboard deve ter completionRate = 1 quando expectedTaxes.length = 0', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        nome: 'Empresa Sem Perfil',
        status: 'ativa',
        taxProfiles: [], // sem taxProfiles
        obligations: [],
      },
    ]);

    const result = await getDocumentControlDashboard(
      '2025-01',
      'ACCOUNTING_SUPER',
      null,
    );

    expect(result.companies[0].completionRate).toBe(1);
    expect(result.companies[0].status).toBe('COMPLETE');
  });

  test('getDocumentControlDashboard deve ter status COMPLETE quando completionRate === 1', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        nome: 'Empresa Completa',
        status: 'ativa',
        taxProfiles: [{ taxType: 'DAS', isActive: true }],
        obligations: [
          {
            taxType: 'DAS',
            status: 'PENDING',
            amount: 1000,
            files: [{ id: 1 }], // tem arquivo = postado
          },
        ],
      },
    ]);

    const result = await getDocumentControlDashboard(
      '2025-01',
      'ACCOUNTING_SUPER',
      null,
    );

    expect(result.companies[0].completionRate).toBe(1);
    expect(result.companies[0].status).toBe('COMPLETE');
  });

  test('getDocumentControlDashboard deve ter status INCOMPLETE quando completionRate < 1', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        nome: 'Empresa Incompleta',
        status: 'ativa',
        taxProfiles: [
          { taxType: 'DAS', isActive: true },
          { taxType: 'ISS', isActive: true },
        ],
        obligations: [
          {
            taxType: 'DAS',
            status: 'PENDING',
            amount: 1000,
            files: [{ id: 1 }], // apenas 1 de 2 impostos
          },
        ],
      },
    ]);

    const result = await getDocumentControlDashboard(
      '2025-01',
      'ACCOUNTING_SUPER',
      null,
    );

    expect(result.companies[0].completionRate).toBeLessThan(1);
    expect(result.companies[0].status).toBe('INCOMPLETE');
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

  test('getTaxTypeStats deve ter completionRate = 0 quando expectedCount = 0', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        codigo: 'EMP002',
        status: 'ativa',
        taxProfiles: [], // sem taxProfiles
      },
    ]);

    prisma.obligation.findMany.mockResolvedValue([]);

    const result = await getTaxTypeStats('2025-01');

    expect(result.taxStats).toHaveLength(0);
  });

  test('getTaxTypeStats deve considerar obrigação postada quando tem arquivo', async () => {
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
        amount: null,
        files: [{ id: 1 }], // tem arquivo = postado
      },
    ]);

    const result = await getTaxTypeStats('2025-01');

    expect(result.taxStats[0].postedCount).toBe(1);
  });

  test('getTaxTypeStats deve considerar NOT_APPLICABLE como tratado', async () => {
    prisma.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        codigo: 'EMP002',
        status: 'ativa',
        taxProfiles: [{ taxType: 'DAS', isActive: true }],
      },
      {
        id: 2,
        codigo: 'EMP003',
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
        status: 'PENDING',
      },
      {
        companyId: 2,
        taxType: 'DAS',
        amount: null,
        files: [],
        status: 'NOT_APPLICABLE', // Marcado como não aplicável
      },
    ]);

    const result = await getTaxTypeStats('2025-01');

    expect(result.taxStats[0].expectedCount).toBe(2);
    expect(result.taxStats[0].postedCount).toBe(2); // Ambas tratadas (1 postada + 1 not applicable)
    expect(result.taxStats[0].completionRate).toBe(100);
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

  test('getClientTaxReport deve calcular variação quando previous.total > 0', async () => {
    prisma.empresa.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Empresa Cliente',
    });

    prisma.obligation.findMany
      .mockResolvedValueOnce([{ taxType: 'DAS', amount: 100 }]) // mês 1
      .mockResolvedValueOnce([{ taxType: 'DAS', amount: 200 }]); // mês 2

    const result = await getClientTaxReport(1, 2);

    expect(result.monthlyData[0].variation).toBe(null); // primeiro mês
    expect(result.monthlyData[1].variation).toBe(100); // (200-100)/100 * 100 = 100%
  });

  test('getClientTaxReport deve calcular variação 100 quando previous.total = 0 e current.total > 0', async () => {
    prisma.empresa.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Empresa Cliente',
    });

    prisma.obligation.findMany
      .mockResolvedValueOnce([]) // mês 1 sem obrigações
      .mockResolvedValueOnce([{ taxType: 'DAS', amount: 100 }]); // mês 2 com obrigação

    const result = await getClientTaxReport(1, 2);

    expect(result.monthlyData[0].variation).toBe(null);
    expect(result.monthlyData[1].variation).toBe(100); // novo imposto
  });

  test('getClientTaxReport deve calcular variação 0 quando previous.total = 0 e current.total = 0', async () => {
    prisma.empresa.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Empresa Cliente',
    });

    prisma.obligation.findMany.mockResolvedValue([]); // ambos meses vazios

    const result = await getClientTaxReport(1, 2);

    expect(result.monthlyData[0].variation).toBe(null);
    expect(result.monthlyData[1].variation).toBe(0);
  });

  test('getClientTaxReport deve ignorar obrigações com amount <= 0', async () => {
    prisma.empresa.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Empresa Cliente',
    });

    prisma.obligation.findMany.mockResolvedValue([
      { taxType: 'DAS', amount: null },
      { taxType: 'ISS', amount: 0 },
      { taxType: 'FGTS', amount: 100 }, // apenas este deve contar
    ]);

    const result = await getClientTaxReport(1, 1);

    expect(result.monthlyData[0].total).toBe(100);
  });

  test('getClientTaxReport deve usar OUTRO quando taxType é null', async () => {
    prisma.empresa.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Empresa Cliente',
    });

    prisma.obligation.findMany.mockResolvedValue([
      { taxType: null, amount: 100 },
    ]);

    const result = await getClientTaxReport(1, 1);

    expect(result.monthlyData[0].byTaxType['OUTRO']).toBe(100);
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

  test('getDeadlineComplianceStats deve usar createdAt quando não há arquivos', async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        taxType: 'DAS',
        amount: 100,
        status: 'PENDING',
        dueDate,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        files: [], // sem arquivos
        company: { codigo: 'EMP002', nome: 'Empresa 2' },
      },
    ]);

    const result = await getDeadlineComplianceStats('2025-01');

    expect(result.details[0].uploadDate).toBeDefined();
  });

  test('getDeadlineComplianceStats deve contar como onTime quando diffDays >= 4', async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        taxType: 'DAS',
        amount: 100,
        status: 'PENDING',
        dueDate,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        files: [{ createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }], // 5 dias antes
        company: { codigo: 'EMP002', nome: 'Empresa 2' },
      },
    ]);

    const result = await getDeadlineComplianceStats('2025-01');

    expect(result.onTime).toBeGreaterThanOrEqual(1);
    expect(result.details[0].isOnTime).toBe(true);
  });

  test('getDeadlineComplianceStats deve contar como late quando diffDays < 4', async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        taxType: 'DAS',
        amount: 100,
        status: 'PENDING',
        dueDate,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        files: [{ createdAt: new Date(now.getTime()) }], // upload hoje, vence em 2 dias
        company: { codigo: 'EMP002', nome: 'Empresa 2' },
      },
    ]);

    const result = await getDeadlineComplianceStats('2025-01');

    expect(result.late).toBeGreaterThanOrEqual(1);
    expect(result.details[0].isOnTime).toBe(false);
  });

  test('getDeadlineComplianceStats deve retornar complianceRate 100 quando total é 0', async () => {
    prisma.obligation.findMany.mockResolvedValue([]);

    const result = await getDeadlineComplianceStats('2099-01');

    expect(result.total).toBe(0);
    expect(result.complianceRate).toBe(100);
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
        referenceMonth: '2025-01',
        company: { id: 1, codigo: 'EMP002', nome: 'Empresa 2' },
      },
      {
        taxType: 'ISS',
        amount: 0,
        dueDate: amanha,
        files: [],
        referenceMonth: '2025-01',
        company: { id: 1, codigo: 'EMP002', nome: 'Empresa 2' },
      },
    ]);

    const result = await getOverdueAndUpcomingTaxes('2025-01');

    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(1);
    expect(result.month).toBe('2025-01');
    expect(result.overdue.count + result.dueSoon.count).toBe(2);
    // Verifica que não filtra por referenceMonth no where
    expect(prisma.obligation.findMany.mock.calls[0][0].where.referenceMonth).toBeUndefined();
  });

  test('getOverdueAndUpcomingTaxes deve buscar todos os meses quando month é null', async () => {
    const now = new Date();
    const ontem = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        taxType: 'DAS',
        amount: null,
        dueDate: ontem,
        files: [],
        referenceMonth: '2025-05', // Mês anterior
        company: { id: 1, codigo: 'EMP002', nome: 'Empresa 2' },
      },
    ]);

    const result = await getOverdueAndUpcomingTaxes(null);

    expect(prisma.obligation.findMany).toHaveBeenCalledTimes(1);
    expect(result.month).toBe('all');
    expect(result.overdue.count).toBe(1);
    // Verifica que não filtra por referenceMonth
    expect(prisma.obligation.findMany.mock.calls[0][0].where.referenceMonth).toBeUndefined();
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

  test('getUnviewedAlertsForAccounting deve agrupar corretamente daysUntilDue <= 1', async () => {
    const now = new Date();
    const in1 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        id: 1,
        title: 'DAS 1',
        taxType: 'DAS',
        dueDate: in1,
        company: { codigo: 'EMP010', nome: 'Empresa 10' },
        files: [{}],
      },
    ]);

    const result = await getUnviewedAlertsForAccounting();

    expect(result.oneDay.length).toBe(1);
    expect(result.oneDay[0].daysUntilDue).toBeLessThanOrEqual(1);
  });

  test('getUnviewedAlertsForAccounting deve agrupar corretamente daysUntilDue <= 2', async () => {
    const now = new Date();
    const in2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
      {
        id: 2,
        title: 'DAS 2',
        taxType: 'DAS',
        dueDate: in2,
        company: { codigo: 'EMP010', nome: 'Empresa 10' },
        files: [{}],
      },
    ]);

    const result = await getUnviewedAlertsForAccounting();

    expect(result.twoDays.length).toBe(1);
    expect(result.twoDays[0].daysUntilDue).toBe(2);
  });

  test('getUnviewedAlertsForAccounting deve agrupar corretamente daysUntilDue <= 3', async () => {
    const now = new Date();
    const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    prisma.obligation.findMany.mockResolvedValue([
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

    expect(result.threeDays.length).toBe(1);
    expect(result.threeDays[0].daysUntilDue).toBe(3);
  });

  // -------------------------------------------------------------------
  // getTaxName
  // -------------------------------------------------------------------
  describe('getTaxName (função auxiliar)', () => {
    test('deve retornar nome mapeado para DAS', () => {
      expect(getTaxName('DAS')).toBe('DAS');
    });

    test('deve retornar nome mapeado para ISS_RETIDO', () => {
      expect(getTaxName('ISS_RETIDO')).toBe('ISS Retido');
    });

    test('deve retornar nome mapeado para FGTS', () => {
      expect(getTaxName('FGTS')).toBe('FGTS');
    });

    test('deve retornar nome mapeado para DCTFWeb', () => {
      expect(getTaxName('DCTFWeb')).toBe('DCTFWeb');
    });

    test('deve retornar nome mapeado para OUTRO', () => {
      expect(getTaxName('OUTRO')).toBe('Outro');
    });

    test('deve retornar taxType quando não está no mapeamento (fallback)', () => {
      expect(getTaxName('IMPOSTO_DESCONHECIDO')).toBe('IMPOSTO_DESCONHECIDO');
    });

    test('deve retornar taxType quando é null', () => {
      expect(getTaxName(null)).toBe(null);
    });

    test('deve retornar taxType quando é undefined', () => {
      expect(getTaxName(undefined)).toBe(undefined);
    });
  });
});
