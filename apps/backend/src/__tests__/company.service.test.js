const { create, getAll, getById, update, remove } = require('../modules/company/company.service');
const { prisma } = require('../prisma');

describe('Company Service', () => {
  let company;

  afterAll(async () => {
    await prisma.empresa.deleteMany();
  });

  describe('create', () => {
    test('deve criar empresa', async () => {
      company = await create({
        codigo: `COMP${Date.now()}`,
        nome: 'Test Company',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      });

      expect(company).toHaveProperty('id');
      expect(company.nome).toBe('Test Company');
    });
  });

  describe('getAll', () => {
    test('deve listar todas as empresas', async () => {
      const companies = await getAll();
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    test('deve buscar empresa por ID', async () => {
      const found = await getById(company.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(company.id);
    });

    test('deve retornar null se empresa não existir', async () => {
      const found = await getById(99999);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('deve atualizar empresa', async () => {
      const updated = await update(company.id, { nome: 'Updated Company' });
      expect(updated.nome).toBe('Updated Company');
    });

    test('deve ignorar campos undefined', async () => {
      const updated = await update(company.id, { nome: 'Test', cnpj: undefined });
      expect(updated).toHaveProperty('nome', 'Test');
    });
  });

  describe('remove', () => {
    test('deve remover empresa', async () => {
      await remove(company.id);
      const found = await getById(company.id);
      expect(found).toBeNull();
    });
  });
});
