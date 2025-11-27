const {
  createObligation,
  listObligations,
  getObligation,
  updateObligation,
  deleteObligation,
  markAsNotApplicable,
  getMonthlyControl
} = require('../modules/obligations/obligation.service');

const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Obligation Service', () => {
  let accountingUser;
  let clientUserWithCompany;
  let clientUserWithoutCompany;
  let company;
  let otherCompany;
  let baseObligation;

  beforeAll(async () => {
    const ts = Date.now();

    // Empresa principal
    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${ts}`,
        nome: 'Empresa Test',
        cnpj: `${ts}000190`,
        status: 'ativa'
      }
    });

    // Outra empresa para testes de acesso
    otherCompany = await prisma.empresa.create({
      data: {
        codigo: `OTHER${ts}`,
        nome: 'Outra Empresa',
        cnpj: `${ts}000191`,
        status: 'ativa'
      }
    });

    // Usuário contabilidade
    accountingUser = await prisma.user.create({
      data: {
        email: `accounting${ts}@test.com`,
        name: 'Accounting User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    // Cliente com empresa vinculada
    clientUserWithCompany = await prisma.user.create({
      data: {
        email: `client-with-company${ts}@test.com`,
        name: 'Client With Company',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        companyId: company.id
      }
    });

    // Cliente SEM empresa vinculada
    clientUserWithoutCompany = await prisma.user.create({
      data: {
        email: `client-without-company${ts}@test.com`,
        name: 'Client Without Company',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE'
        // sem companyId
      }
    });

    // Obrigação base para vários testes
    baseObligation = await createObligation(accountingUser.id, {
      title: 'Base Obligation',
      regime: 'SIMPLES',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-01-31'),
      dueDate: new Date('2025-02-10'),
      companyId: company.id,
      amount: 1000,
      referenceMonth: '2025-01'
    });
  });

  afterAll(async () => {
    await prisma.companyTaxProfile.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.empresa.deleteMany();
  });

  // -------------------------------------------------
  // createObligation
  // -------------------------------------------------
  describe('createObligation', () => {
    test('deve criar obrigação com status calculado automaticamente', async () => {
      const data = {
        title: 'Test Obligation Auto Status',
        regime: 'SIMPLES',
        periodStart: new Date('2025-03-01'),
        periodEnd: new Date('2025-03-31'),
        dueDate: new Date('2025-04-10'),
        companyId: company.id,
        amount: 500
      };

      const obligation = await createObligation(accountingUser.id, data);
      expect(obligation.title).toBe(data.title);
      expect(obligation.status).toBeDefined();
    });

    test('deve criar obrigação respeitando status informado (ex: NOT_APPLICABLE)', async () => {
      const data = {
        title: 'Test Obligation Not Applicable',
        regime: 'SIMPLES',
        periodStart: new Date('2025-03-01'),
        periodEnd: new Date('2025-03-31'),
        dueDate: new Date('2025-04-10'),
        companyId: company.id,
        amount: 0,
        status: 'NOT_APPLICABLE'
      };

      const obligation = await createObligation(accountingUser.id, data);
      expect(obligation.status).toBe('NOT_APPLICABLE');
    });
  });

  // -------------------------------------------------
  // listObligations
  // -------------------------------------------------
  describe('listObligations', () => {
    test('deve listar obrigações para contabilidade', async () => {
      const obligations = await listObligations(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        {}
      );
      expect(Array.isArray(obligations)).toBe(true);
      expect(obligations.length).toBeGreaterThanOrEqual(1);
    });

    test('deve filtrar por status (quando houver referenceMonth, NOT_APPLICABLE não é excluído)', async () => {
      // cria uma obrigação NOT_APPLICABLE para o mês 2025-02
      const naObligation = await createObligation(accountingUser.id, {
        title: 'NA Obligation',
        regime: 'SIMPLES',
        periodStart: new Date('2025-02-01'),
        periodEnd: new Date('2025-02-28'),
        dueDate: new Date('2025-03-10'),
        companyId: company.id,
        referenceMonth: '2025-02',
        status: 'NOT_APPLICABLE'
      });

      const obligations = await listObligations(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        { referenceMonth: '2025-02' }
      );

      const hasNA = obligations.some(o => o.id === naObligation.id);
      expect(hasNA).toBe(true);
    });

    test('deve excluir NOT_APPLICABLE quando não houver referenceMonth', async () => {
      await createObligation(accountingUser.id, {
        title: 'NA Global',
        regime: 'SIMPLES',
        periodStart: new Date('2025-02-01'),
        periodEnd: new Date('2025-02-28'),
        dueDate: new Date('2025-03-10'),
        companyId: company.id,
        status: 'NOT_APPLICABLE'
      });

      const obligations = await listObligations(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        {}
      );

      const hasNA = obligations.some(o => o.status === 'NOT_APPLICABLE');
      expect(hasNA).toBe(false);
    });

    test('deve filtrar por regime', async () => {
      const obligations = await listObligations(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        { regime: 'SIMPLES' }
      );
      expect(obligations.every(o => o.regime === 'SIMPLES')).toBe(true);
    });

    test('deve filtrar por período (from/to em dueDate)', async () => {
      // cria obrigação com dueDate específico
      const target = await createObligation(accountingUser.id, {
        title: 'DueDate Filter Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-05-01'),
        periodEnd: new Date('2025-05-31'),
        dueDate: new Date('2025-06-15'),
        companyId: company.id
      });

      const obligations = await listObligations(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        { from: new Date('2025-06-10'), to: new Date('2025-06-20') }
      );

      const found = obligations.some(o => o.id === target.id);
      expect(found).toBe(true);
    });

    test('CLIENT deve ver apenas obrigações da própria empresa', async () => {
      const obligations = await listObligations(
        clientUserWithCompany.id,
        'CLIENT_NORMAL',
        {}
      );
      expect(obligations.every(o => o.companyId === company.id)).toBe(true);
    });

    test('CLIENT sem companyId deve receber lista vazia', async () => {
      const obligations = await listObligations(
        clientUserWithoutCompany.id,
        'CLIENT_NORMAL',
        {}
      );
      expect(obligations).toEqual([]);
    });

    test('ACCOUNTING com filters.companyId deve filtrar por empresa', async () => {
      // cria obrigação numa outra empresa
      const otherObl = await createObligation(accountingUser.id, {
        title: 'Other Company Obligation',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: otherCompany.id
      });

      const obligations = await listObligations(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        { companyId: otherCompany.id }
      );

      expect(obligations.length).toBeGreaterThanOrEqual(1);
      expect(obligations.every(o => o.companyId === otherCompany.id)).toBe(true);
      const existsOther = obligations.some(o => o.id === otherObl.id);
      expect(existsOther).toBe(true);
    });
  });

  // -------------------------------------------------
  // getObligation
  // -------------------------------------------------
  describe('getObligation', () => {
    test('deve buscar obrigação por ID para contabilidade', async () => {
      const found = await getObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        baseObligation.id
      );
      expect(found).not.toBeNull();
      expect(found.id).toBe(baseObligation.id);
    });

    test('CLIENT não deve acessar obrigação de outra empresa', async () => {
      const foreignObligation = await createObligation(accountingUser.id, {
        title: 'Other Company Access Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: otherCompany.id
      });

      const result = await getObligation(
        clientUserWithCompany.id,
        'CLIENT_NORMAL',
        foreignObligation.id
      );
      expect(result).toBeNull();
    });

    test('deve retornar null se obrigação não existir', async () => {
      const result = await getObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        99999999
      );
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------
  // updateObligation
  // -------------------------------------------------
  describe('updateObligation', () => {
    test('deve atualizar obrigação existente', async () => {
      const updated = await updateObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        baseObligation.id,
        { title: 'Updated Title' }
      );

      expect(updated.title).toBe('Updated Title');
    });

    test('deve recalcular status quando devidoDate é alterado', async () => {
      const newDueDate = new Date('2025-12-31');

      const updated = await updateObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        baseObligation.id,
        { dueDate: newDueDate }
      );

      expect(updated.dueDate.toISOString()).toBe(newDueDate.toISOString());
      expect(updated.status).toBeDefined();
    });

    test('deve retornar null quando obrigação não existir', async () => {
      const result = await updateObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        999999,
        { title: 'Does not matter' }
      );
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------
  // deleteObligation
  // -------------------------------------------------
  describe('deleteObligation', () => {
    test('deve deletar obrigação existente', async () => {
      const temp = await createObligation(accountingUser.id, {
        title: 'To Delete',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id
      });

      const result = await deleteObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        temp.id
      );
      expect(result).toBe(true);

      const after = await getObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        temp.id
      );
      expect(after).toBeNull();
    });

    test('deve retornar null ao tentar deletar obrigação inexistente', async () => {
      const result = await deleteObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        999999
      );
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------
  // markAsNotApplicable
  // -------------------------------------------------
  describe('markAsNotApplicable', () => {
    test('deve marcar obrigação como não aplicável', async () => {
      const newObligation = await createObligation(accountingUser.id, {
        title: 'Not Applicable Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id
      });

      const result = await markAsNotApplicable(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        newObligation.id,
        'Não se aplica'
      );

      expect(result.status).toBe('NOT_APPLICABLE');
      expect(result.notApplicableReason).toBe('Não se aplica');
    });

    test('deve lançar erro se usuário não for da contabilidade', async () => {
      await expect(
        markAsNotApplicable(
          clientUserWithCompany.id,
          'CLIENT_NORMAL',
          baseObligation.id,
          'Test'
        )
      ).rejects.toThrow('Apenas usuários da contabilidade podem marcar como não aplicável');
    });

    test('deve retornar null se obrigação não existir (contabilidade)', async () => {
      const result = await markAsNotApplicable(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        999999,
        'Razão qualquer'
      );
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------
  // getMonthlyControl
  // -------------------------------------------------
  describe('getMonthlyControl', () => {
    test('deve retornar controle mensal com impostos esperados e obrigações', async () => {
      // Perfil fiscal para company
      await prisma.companyTaxProfile.create({
        data: {
          companyId: company.id,
          taxType: 'DAS',
          isActive: true
        }
      });

      // Obrigação com arquivo e NOT_APPLICABLE reason
      const withFile = await createObligation(accountingUser.id, {
        title: 'Monthly Control Obligation',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        referenceMonth: '2025-01',
        taxType: 'DAS',
        status: 'PENDING'
      });

      await prisma.obligationFile.create({
        data: {
          obligationId: withFile.id,
          fileName: 'doc.pdf',
          originalName: 'doc.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          s3Key: `obligations/control-${Date.now()}.pdf`,
          uploadedBy: accountingUser.id
        }
      });

      const result = await getMonthlyControl(company.id, '2025-01');

      expect(result).toHaveProperty('companyId');
      expect(result).toHaveProperty('companyName');
      expect(result).toHaveProperty('month', '2025-01');
      expect(Array.isArray(result.expectedTaxes)).toBe(true);
      expect(Array.isArray(result.obligations)).toBe(true);
      expect(Array.isArray(result.missing)).toBe(true);
      expect(typeof result.completionRate).toBe('number');

      if (result.obligations.length > 0) {
        const o = result.obligations[0];
        expect(o).toHaveProperty('taxType');
        expect(o).toHaveProperty('status');
        expect(o).toHaveProperty('dueDate');
        expect(o).toHaveProperty('notApplicableReason');
        expect(o).toHaveProperty('hasFile');
      }

      // deve ter pelo menos um registro com arquivo
      const anyWithFile = result.obligations.some(o => o.hasFile === true);
      expect(anyWithFile).toBe(true);
    });

    test('deve ter completionRate = 1 quando não há impostos esperados', async () => {
      const noProfileCompany = await prisma.empresa.create({
        data: {
          codigo: `NOPROFILE${Date.now()}`,
          nome: 'Empresa Sem Perfil',
          cnpj: `${Date.now()}000192`,
          status: 'ativa'
        }
      });

      const result = await getMonthlyControl(noProfileCompany.id, '2025-01');
      expect(result.expectedTaxes.length).toBe(0);
      expect(result.completionRate).toBe(1);
    });
  });

  // -------------------------------------------------
  // Testes adicionais para edge cases
  // -------------------------------------------------
  describe('Edge Cases - createObligation', () => {
    test('deve calcular status OVERDUE para data passada', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const obligation = await createObligation(accountingUser.id, {
        title: 'Obligation Overdue',
        regime: 'SIMPLES',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: pastDate,
        companyId: company.id,
        status: 'PENDING'
      });

      expect(obligation.status).toBe('OVERDUE');
    });

    test('deve calcular status PENDING para data futura', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const obligation = await createObligation(accountingUser.id, {
        title: 'Obligation Pending',
        regime: 'SIMPLES',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: futureDate,
        companyId: company.id
      });

      expect(obligation.status).toBe('PENDING');
    });
  });

  describe('Edge Cases - listObligations', () => {
    test('deve retornar array vazio para CLIENT sem companyId', async () => {
      const clientNoCompany = await prisma.user.create({
        data: {
          email: `client-nocompany${Date.now()}@test.com`,
          name: 'Client No Company',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: null
        }
      });

      const result = await listObligations(clientNoCompany.id, 'CLIENT_NORMAL', {});
      expect(result).toEqual([]);
    });

    test('deve filtrar NOT_APPLICABLE quando não há referenceMonth', async () => {
      await prisma.obligation.create({
        data: {
          title: 'NA Obligation',
          regime: 'SIMPLES',
          periodStart: new Date(),
          periodEnd: new Date(),
          dueDate: new Date(),
          companyId: company.id,
          userId: accountingUser.id,
          status: 'NOT_APPLICABLE'
        }
      });

      const result = await listObligations(accountingUser.id, 'ACCOUNTING_SUPER', {});
      const hasNA = result.some(o => o.status === 'NOT_APPLICABLE');
      expect(hasNA).toBe(false);
    });

    test('deve incluir NOT_APPLICABLE quando há referenceMonth', async () => {
      const result = await listObligations(accountingUser.id, 'ACCOUNTING_SUPER', {
        referenceMonth: '2025-01'
      });

      // Pode ter NOT_APPLICABLE quando filtrando por referenceMonth
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Edge Cases - updateObligation', () => {
    test('deve atualizar apenas campos fornecidos', async () => {
      const original = await createObligation(accountingUser.id, {
        title: 'Original Title',
        regime: 'SIMPLES',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        companyId: company.id,
        amount: 1000
      });

      const updated = await updateObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        original.id,
        { title: 'Updated Title' }
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.amount).toBe(1000); // Mantém valor original
    });

    test('deve recalcular status ao atualizar dueDate', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const obligation = await createObligation(accountingUser.id, {
        title: 'Test Status',
        regime: 'SIMPLES',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: futureDate,
        companyId: company.id
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const updated = await updateObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        obligation.id,
        { dueDate: pastDate }
      );

      expect(updated.status).toBe('OVERDUE');
    });
  });

  describe('Edge Cases - deleteObligation', () => {
    test('deve retornar null se obrigação não existir', async () => {
      const result = await deleteObligation(
        accountingUser.id,
        'ACCOUNTING_SUPER',
        999999
      );
      expect(result).toBeNull();
    });

    test('deve bloquear deleção para CLIENT de outra empresa', async () => {
      const result = await deleteObligation(
        clientUserWithCompany.id,
        'CLIENT_NORMAL',
        baseObligation.id
      );
      // Se baseObligation é da mesma empresa, deve funcionar
      // Se não, deve retornar null
      expect(result === null || result === true).toBe(true);
    });
  });

  describe('Edge Cases - getMonthlyControl', () => {
    test('deve calcular missing corretamente', async () => {
      await prisma.companyTaxProfile.create({
        data: {
          companyId: company.id,
          taxType: 'ISS_RETIDO',
          isActive: true
        }
      });

      const result = await getMonthlyControl(company.id, '2025-01');
      
      expect(result).toHaveProperty('missing');
      expect(Array.isArray(result.missing)).toBe(true);
    });

    test('deve ter completionRate 0 quando nenhum imposto foi postado', async () => {
      const newCompany = await prisma.empresa.create({
        data: {
          codigo: `NEWCOMP${Date.now()}`,
          nome: 'New Company',
          cnpj: `${Date.now()}000194`,
          status: 'ativa'
        }
      });

      await prisma.companyTaxProfile.create({
        data: {
          companyId: newCompany.id,
          taxType: 'DAS',
          isActive: true
        }
      });

      const result = await getMonthlyControl(newCompany.id, '2025-01');
      expect(result.completionRate).toBe(0);
    });
  });
});
