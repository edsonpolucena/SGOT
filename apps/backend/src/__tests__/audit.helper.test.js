const { logAudit } = require('../utils/audit.helper');
const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Audit Helper', () => {
  let user;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: `audit${Date.now()}@test.com`,
        name: 'Audit Test User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  test('deve criar log de auditoria', async () => {
    const req = {
      user: { id: user.id, role: user.role },
      method: 'POST',
      url: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      }
    };

    await logAudit(req, 'CREATE', 'User', 'test-id');

    const logs = await prisma.auditLog.findMany({
      where: { userId: user.id }
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe('CREATE');
    expect(logs[0].entity).toBe('User');
    expect(logs[0].entityId).toBe('test-id');
  });

  test('deve lidar com req sem user', async () => {
    const req = {
      method: 'GET',
      url: '/api/test',
      connection: { remoteAddress: '127.0.0.1' },
      headers: {
        'user-agent': 'test-agent'
      }
    };

    // Não deve lançar erro
    await expect(logAudit(req, 'VIEW', 'User', 'test-id')).resolves.not.toThrow();
  });

  test('deve lidar com req sem headers', async () => {
    const req = {
      user: { id: user.id, role: user.role },
      method: 'GET',
      url: '/api/test'
    };

    // Não deve lançar erro
    await expect(logAudit(req, 'VIEW', 'User', 'test-id')).resolves.not.toThrow();
  });

  test('deve criar log com metadata', async () => {
    const req = {
      user: { id: user.id, role: user.role },
      method: 'PUT',
      url: '/api/test',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' }
    };

    await logAudit(req, 'UPDATE', 'User', 'test-id', { field: 'email', oldValue: 'old@test.com', newValue: 'new@test.com' });

    const logs = await prisma.auditLog.findMany({
      where: { userId: user.id, action: 'UPDATE' },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    expect(logs.length).toBeGreaterThan(0);
    const metadata = JSON.parse(logs[0].metadata);
    expect(metadata).toHaveProperty('field', 'email');
  });

  test('deve criar log com diferentes tipos de ação', async () => {
    const req = {
      user: { id: user.id, role: user.role },
      method: 'DELETE',
      url: '/api/test',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' }
    };

    await logAudit(req, 'DELETE', 'Obligation', 'obligation-id');

    const logs = await prisma.auditLog.findMany({
      where: { userId: user.id, action: 'DELETE' }
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].entity).toBe('Obligation');
  });

  test('deve lidar com erro ao criar log sem falhar', async () => {
    const req = {
      user: { id: 'invalid-user-id', role: 'ADMIN' },
      method: 'POST',
      url: '/api/test',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' }
    };

    // Não deve lançar erro mesmo com userId inválido
    await expect(logAudit(req, 'CREATE', 'User', 'test-id')).resolves.not.toThrow();
  });
});






