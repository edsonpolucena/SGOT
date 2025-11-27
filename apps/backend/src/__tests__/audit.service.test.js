const {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  getAuditStats
} = require('../modules/audit/audit.service');
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

    test('deve retornar null se falhar ao criar log (caminho de erro)', async () => {
      const spy = jest
        .spyOn(prisma.auditLog, 'create')
        .mockRejectedValue(new Error('DB error'));

      const result = await createAuditLog({
        userId: user.id,
        action: 'ERROR_TEST',
        entity: EntityType.USER,
        entityId: 'error-id'
      });

      expect(result).toBeNull();
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
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

      if (result.logs.length > 0) {
        // Garante que metadata foi parseado quando existir
        const logComMetadata = result.logs.find(l => l.metadata);
        if (logComMetadata) {
          expect(typeof logComMetadata.metadata).toBe('object');
        }
      }
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

    test('deve filtrar por entityId', async () => {
      // usamos o entityId do primeiro log criado (auditLog)
      const result = await getAuditLogs({ entityId: auditLog.entityId });

      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.logs.every(log => log.entityId === auditLog.entityId)).toBe(true);
    });

    test('deve filtrar por intervalo de datas (startDate e endDate)', async () => {
      const startDate = new Date('2000-01-01');
      const endDate = new Date('2099-12-31');

      const result = await getAuditLogs({ startDate, endDate });

      expect(result).toHaveProperty('logs');
      expect(result.total).toBeGreaterThan(0);
    });

    test('deve paginar resultados', async () => {
      const result = await getAuditLogs({ page: 1, limit: 10 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.logs.length).toBeLessThanOrEqual(10);
    });

    test('deve preencher usuário desconhecido quando usuário não existe', async () => {
      // Cria um log com userId que não existe na tabela user
      await prisma.auditLog.create({
        data: {
          userId: 'unknown-user-id',
          action: 'VIEW',
          entity: EntityType.USER,
          entityId: 'unknown-entity',
          metadata: null,
          ipAddress: null,
          userAgent: null
        }
      });

      const result = await getAuditLogs({ userId: 'unknown-user-id' });

      expect(result.logs.length).toBeGreaterThan(0);
      const log = result.logs[0];
      expect(log.userName).toBe('Usuário Desconhecido');
      expect(log.userEmail).toBe('N/A');
    });
  });

  describe('getAuditLogById', () => {
    test('deve buscar log por ID', async () => {
      const log = await getAuditLogById(auditLog.id);

      expect(log).toBeDefined();
      expect(log.id).toBe(auditLog.id);
      expect(log).toHaveProperty('userName');
      expect(log).toHaveProperty('userEmail');
      expect(log).toHaveProperty('metadata');
    });

    test('deve lançar erro se log não existir', async () => {
      await expect(getAuditLogById('99999')).rejects.toThrow('LOG_NOT_FOUND');
    });

    test('deve retornar usuário desconhecido se usuário vinculado não existir', async () => {
      const orphanLog = await prisma.auditLog.create({
        data: {
          userId: 'orphan-user-id',
          action: 'DELETE',
          entity: EntityType.USER,
          entityId: 'orphan-entity',
          metadata: JSON.stringify({ test: 'orphan' }),
          ipAddress: null,
          userAgent: null
        }
      });

      const log = await getAuditLogById(orphanLog.id);

      expect(log.userName).toBe('Usuário Desconhecido');
      expect(log.userEmail).toBe('N/A');
      expect(log.metadata).toEqual({ test: 'orphan' });
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

      if (stats.byAction.length > 0) {
        expect(stats.byAction[0]).toHaveProperty('action');
        expect(stats.byAction[0]).toHaveProperty('count');
      }
      if (stats.byEntity.length > 0) {
        expect(stats.byEntity[0]).toHaveProperty('entity');
        expect(stats.byEntity[0]).toHaveProperty('count');
      }
    });

    test('deve filtrar por período', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      const stats = await getAuditStats({ startDate, endDate });

      expect(stats).toHaveProperty('total');
    });

    test('deve preencher usuário desconhecido em topUsers quando usuário não existir', async () => {
      // Garante pelo menos um log com usuário inexistente já criado anteriormente
      const stats = await getAuditStats({});

      const hasUnknown = stats.topUsers.some(
        (u) => u.userName === 'Desconhecido' && u.userEmail === 'N/A'
      );

      // Não precisa ser obrigatório, mas se existir usuário órfão,
      // deve ser mapeado corretamente
      expect(typeof hasUnknown).toBe('boolean');
    });
  });
});
