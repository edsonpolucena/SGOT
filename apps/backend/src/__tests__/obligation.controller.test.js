const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const bcrypt = require('bcryptjs');

// Mock do S3 para não chamar AWS de verdade
jest.spyOn(require('../services/s3.service'), 'getSignedUrl').mockReturnValue('https://s3.amazonaws.com/test-url');

describe('ObligationController', () => {
  let accountingUser;
  let accountingToken;
  let clientUser;
  let clientToken;
  let company;
  let otherCompany;
  let obligation;

  beforeAll(async () => {
    // Empresa principal
    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Teste',
        cnpj: `${Date.now()}000190`,
        status: 'ativa',
        email: 'empresa@teste.com'
      }
    });

    // Outra empresa (para teste de 403 em monthly-control)
    otherCompany = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}B`,
        nome: 'Outra Empresa',
        cnpj: `${Date.now()}000290`,
        status: 'ativa',
        email: 'outra@empresa.com'
      }
    });

    // Empresa de contabilidade EMP001 (remetente de e-mail)
    await prisma.empresa.upsert({
      where: { codigo: 'EMP001' },
      update: { email: 'contabilidade@teste.com' },
      create: {
        codigo: 'EMP001',
        nome: 'Contabilidade Teste',
        cnpj: `${Date.now()}000999`,
        status: 'ativa',
        email: 'contabilidade@teste.com'
      }
    });

    // Usuário contabilidade
    accountingUser = await prisma.user.create({
      data: {
        email: 'test@obligation.com',
        name: 'Accounting User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    accountingToken = jwt.sign(
      { sub: accountingUser.id, role: accountingUser.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Usuário cliente da empresa principal
    clientUser = await prisma.user.create({
      data: {
        email: 'client@obligation.com',
        name: 'Client User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        companyId: company.id
      }
    });

    clientToken = jwt.sign(
      { sub: clientUser.id, role: clientUser.role, companyId: company.id },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.obligationFile.deleteMany();
    await prisma.obligationNotification.deleteMany();
    await prisma.obligationView.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.empresa.deleteMany();
  });

  // -----------------------------
  // CRUD básico de obrigações
  // -----------------------------

  test('deve criar obrigação', async () => {
    const payload = {
      title: 'DAS 08/2025',
      regime: 'SIMPLES',
      periodStart: '2025-08-01',
      periodEnd: '2025-08-31',
      dueDate: '2025-09-10',
      companyId: company.id,
      amount: 1000,
      notes: 'Teste automatizado'
    };

    const res = await request(app)
      .post('/api/obligations')
      .set('Authorization', `Bearer ${accountingToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('DAS 08/2025');
    obligation = res.body;
  });

  test('não deve criar obrigação sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/obligations')
      .set('Authorization', `Bearer ${accountingToken}`)
      .send({
        title: 'Obrigação sem campos'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing required fields');
  });

  test('deve listar obrigações', async () => {
    const res = await request(app)
      .get('/api/obligations')
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('deve filtrar obrigações por status', async () => {
    await request(app)
      .post('/api/obligations')
      .set('Authorization', `Bearer ${accountingToken}`)
      .send({
        title: 'PENDING Obligation',
        regime: 'SIMPLES',
        periodStart: '2025-08-01',
        periodEnd: '2025-08-31',
        dueDate: '2026-09-10',
        companyId: company.id
      });

    const res = await request(app)
      .get('/api/obligations?status=PENDING')
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deve filtrar obrigações por regime', async () => {
    const res = await request(app)
      .get('/api/obligations?regime=SIMPLES')
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deve filtrar obrigações por referenceMonth', async () => {
    const res = await request(app)
      .get('/api/obligations?referenceMonth=2025-08')
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deve buscar obrigação por ID', async () => {
    const res = await request(app)
      .get(`/api/obligations/${obligation.id}`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(res.body.id).toBe(obligation.id);
    expect(res.body.title).toBe(obligation.title);
  });

  test('deve retornar 404 se obrigação não existir', async () => {
    const res = await request(app)
      .get('/api/obligations/999999')
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(404);

    expect(res.body.message).toBe('Obligation not found');
  });

  test('deve atualizar obrigação', async () => {
    const res = await request(app)
      .put(`/api/obligations/${obligation.id}`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .send({
        title: 'DAS Atualizado',
        regime: 'SIMPLES',
        periodStart: '2025-08-01',
        periodEnd: '2025-08-31',
        dueDate: '2025-09-10',
        companyId: company.id,
        amount: 1500,
        notes: 'Atualizado'
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('DAS Atualizado');
    expect(Number(res.body.amount)).toBe(1500);
  });

  test('deve retornar 404 ao atualizar obrigação inexistente', async () => {
    const res = await request(app)
      .put('/api/obligations/999999')
      .set('Authorization', `Bearer ${accountingToken}`)
      .send({ title: 'Test Updated' })
      .expect(404);

    expect(res.body.message).toBe('Obligation not found');
  });

  test('deve deletar obrigação', async () => {
    const newObligation = await prisma.obligation.create({
      data: {
        title: 'To Delete',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: accountingUser.id,
        status: 'PENDING',
        taxType: 'DAS',
        referenceMonth: '2025-01'
      }
    });

    await request(app)
      .delete(`/api/obligations/${newObligation.id}`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(204);
  });

  // -----------------------------
  // NOT_APPLICABLE / controle
  // -----------------------------

  test('deve marcar obrigação como não aplicável', async () => {
    const newObligation = await prisma.obligation.create({
      data: {
        title: 'Not Applicable Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: accountingUser.id,
        status: 'PENDING',
        taxType: 'DAS',
        referenceMonth: '2025-01'
      }
    });

    const res = await request(app)
      .patch(`/api/obligations/${newObligation.id}/not-applicable`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .send({ reason: 'Não se aplica' })
      .expect(200);

    expect(res.body.status).toBe('NOT_APPLICABLE');
    expect(res.body.notApplicableReason).toBe('Não se aplica');
  });

  test('deve retornar 404 ao marcar NOT_APPLICABLE em obrigação inexistente', async () => {
    const res = await request(app)
      .patch('/api/obligations/999999/not-applicable')
      .set('Authorization', `Bearer ${accountingToken}`)
      .send({ reason: 'Teste' })
      .expect(404);

    expect(res.body.message).toBe('Obligation not found');
  });

  test('CLIENT não pode marcar obrigação como não aplicável (403)', async () => {
    const newObligation = await prisma.obligation.create({
      data: {
        title: 'Client Not Applicable Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: accountingUser.id,
        status: 'PENDING',
        taxType: 'DAS',
        referenceMonth: '2025-01'
      }
    });

    const res = await request(app)
      .patch(`/api/obligations/${newObligation.id}/not-applicable`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ reason: 'Tentativa inválida' })
      .expect(403);

    expect(res.body.message).toContain('Apenas usuários da contabilidade');
  });

  test('deve buscar controle mensal (ACCOUNTING)', async () => {
    const res = await request(app)
      .get(`/api/obligations/monthly-control?companyId=${company.id}&month=2025-01`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('month');
    expect(res.body).toHaveProperty('companyId');
  });

  test('deve retornar erro 400 ao fazer monthly-control sem parâmetros', async () => {
    const res = await request(app)
      .get('/api/obligations/monthly-control')
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(400);

    expect(res.body.message).toContain('companyId e month são obrigatórios');
  });

  test('CLIENT não pode acessar monthly-control de outra empresa (403)', async () => {
    const res = await request(app)
      .get(`/api/obligations/monthly-control?companyId=${otherCompany.id}&month=2025-01`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);

    expect(res.body.message).toContain('Acesso negado a esta empresa');
  });

  // -----------------------------
  // Arquivos (view/download/list/upload error)
  // -----------------------------

  test('deve retornar erro 400 ao fazer upload sem arquivos', async () => {
    const newObligation = await prisma.obligation.create({
      data: {
        title: 'Upload Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: accountingUser.id
      }
    });

    const res = await request(app)
      .post(`/api/obligations/${newObligation.id}/files`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(400);

    expect(res.body.message).toContain('No files uploaded');
  });

  test('deve listar arquivos de obrigação (lista vazia OK)', async () => {
    const newObligation = await prisma.obligation.create({
      data: {
        title: 'Files Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: accountingUser.id
      }
    });

    const res = await request(app)
      .get(`/api/obligations/${newObligation.id}/files`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deve gerar URL de visualização de arquivo (ACCOUNTING)', async () => {
    const newObligation = await prisma.obligation.create({
      data: {
        title: 'View File Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: accountingUser.id
      }
    });

    const testFile = await prisma.obligationFile.create({
      data: {
        obligationId: newObligation.id,
        fileName: 'test-view.pdf',
        originalName: 'test-view.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        s3Key: 'obligations/test-view.pdf',
        uploadedBy: accountingUser.id
      }
    });

    const res = await request(app)
      .get(`/api/obligations/files/${testFile.id}/view`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('viewUrl');
  });

  test('deve gerar URL de visualização de arquivo registrando view para CLIENT', async () => {
    const newObligation = await prisma.obligation.create({
      data: {
        title: 'View File Client Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: accountingUser.id
      }
    });

    const testFile = await prisma.obligationFile.create({
      data: {
        obligationId: newObligation.id,
        fileName: 'test-view-client.pdf',
        originalName: 'test-view-client.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        s3Key: 'obligations/test-view-client.pdf',
        uploadedBy: accountingUser.id
      }
    });

    const res = await request(app)
      .get(`/api/obligations/files/${testFile.id}/view`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('viewUrl');

    const views = await prisma.obligationView.findMany({
      where: { obligationId: newObligation.id, viewedBy: clientUser.id }
    });
    expect(views.length).toBeGreaterThan(0);
  });

  test('deve gerar URL de download de arquivo', async () => {
    const newObligation = await prisma.obligation.create({
      data: {
        title: 'Download File Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: accountingUser.id
      }
    });

    const testFile = await prisma.obligationFile.create({
      data: {
        obligationId: newObligation.id,
        fileName: 'test-download.pdf',
        originalName: 'test-download.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        s3Key: 'obligations/test-download.pdf',
        uploadedBy: accountingUser.id
      }
    });

    const res = await request(app)
      .get(`/api/obligations/files/${testFile.id}/download`)
      .set('Authorization', `Bearer ${accountingToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('downloadUrl');
  });
});
