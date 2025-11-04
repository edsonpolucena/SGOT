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

    await logAudit(req, 'CREATE', 'Test', 'test-id');

    const logs = await prisma.auditLog.findMany({
      where: { userId: user.id }
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe('CREATE');
    expect(logs[0].entityType).toBe('Test');
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
    await expect(logAudit(req, 'VIEW', 'Test', 'test-id')).resolves.not.toThrow();
  });

  test('deve lidar com req sem headers', async () => {
    const req = {
      user: { id: user.id, role: user.role },
      method: 'GET',
      url: '/api/test'
    };

    // Não deve lançar erro
    await expect(logAudit(req, 'VIEW', 'Test', 'test-id')).resolves.not.toThrow();
  });
});






