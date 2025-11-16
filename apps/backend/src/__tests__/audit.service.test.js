const { createAuditLog, getAuditLogs, getAuditLogById, getAuditStats } = require('../modules/audit/audit.service');
const { prisma } = require('../prisma');
const { EntityType } = require('@prisma/client');

describe('Audit Service', () => {
  let user;
  let auditLog;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: 'auditservice@test.com',
        name: 'Audit Service User',
        passwordHash: 'hash',
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createAuditLog', () => {
    test('deve criar log de auditoria com sucesso', async () => {
      const log = await createAuditLog({
        userId: user.id,
        action: 'CREATE',
        entity: EntityType.USER,
        entityId: user.id,
        metadata: { test: true },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent'
      });

      expect(log).toBeDefined();
      expect(log.userId).toBe(user.id);
      expect(log.action).toBe('CREATE');
      auditLog = log;
    });

    test('deve criar log sem metadata', async () => {
      const log = await createAuditLog({
        userId: user.id,
        action: 'VIEW',
        entity: EntityType.OBLIGATION,
        entityId: '123'
      });

      expect(log).toBeDefined();
      expect(log.metadata).toBeNull();
    });
  });

  describe('getAuditLogs', () => {
    test('deve listar logs sem filtros', async () => {
      const result = await getAuditLogs({});

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.logs)).toBe(true);
    });

    test('deve filtrar por userId', async () => {
      const result = await getAuditLogs({ userId: user.id });

      expect(result.logs.every(log => log.userId === user.id)).toBe(true);
    });

    test('deve filtrar por action', async () => {
      const result = await getAuditLogs({ action: 'CREATE' });

      expect(result.logs.every(log => log.action === 'CREATE')).toBe(true);
    });

    test('deve filtrar por entity', async () => {
      const result = await getAuditLogs({ entity: EntityType.USER });

      expect(result.logs.every(log => log.entity === EntityType.USER)).toBe(true);
    });

    test('deve paginar resultados', async () => {
      const result = await getAuditLogs({ page: 1, limit: 10 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.logs.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getAuditLogById', () => {
    test('deve buscar log por ID', async () => {
      const log = await getAuditLogById(auditLog.id);

      expect(log).toBeDefined();
      expect(log.id).toBe(auditLog.id);
      expect(log).toHaveProperty('userName');
      expect(log).toHaveProperty('userEmail');
    });

    test('deve lançar erro se log não existir', async () => {
      await expect(getAuditLogById('99999')).rejects.toThrow('LOG_NOT_FOUND');
    });
  });

  describe('getAuditStats', () => {
    test('deve retornar estatísticas de auditoria', async () => {
      const stats = await getAuditStats({});

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byAction');
      expect(stats).toHaveProperty('byEntity');
      expect(stats).toHaveProperty('topUsers');
      expect(Array.isArray(stats.byAction)).toBe(true);
      expect(Array.isArray(stats.byEntity)).toBe(true);
      expect(Array.isArray(stats.topUsers)).toBe(true);
    });

    test('deve filtrar por período', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      const stats = await getAuditStats({ startDate, endDate });

      expect(stats).toHaveProperty('total');
    });
  });
});

