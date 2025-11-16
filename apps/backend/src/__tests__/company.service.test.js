const {
  create,
  getAll,
  getById,
  update,
  remove
} = require('../modules/company/company.service');
const { prisma } = require('../prisma');

describe('Company Service', () => {
  afterAll(async () => {
    await prisma.empresa.deleteMany();
  });

  describe('create', () => {
    test('deve criar empresa', async () => {
      const timestamp = Date.now();
      const data = {
        codigo: `COMP${timestamp}`,
        nome: 'Empresa Test',
        cnpj: `${timestamp}000190`,
        email: `test${timestamp}@empresa.com`,
        status: 'ativa'
      };

      const empresa = await create(data);
      expect(empresa.nome).toBe(data.nome);
    });
  });

  describe('getAll', () => {
    test('deve listar empresas', async () => {
      const empresas = await getAll();
      expect(Array.isArray(empresas)).toBe(true);
    });
  });

  describe('getById', () => {
    test('deve buscar empresa por ID', async () => {
      const timestamp = Date.now();
      const empresa = await prisma.empresa.create({
        data: {
          codigo: `GET${timestamp}`,
          nome: 'Empresa Get Test',
          cnpj: `${timestamp}111111`,
          status: 'ativa'
        }
      });

      const found = await getById(empresa.id);
      expect(found.id).toBe(empresa.id);
    });
  });

  describe('update', () => {
    test('deve atualizar empresa', async () => {
      const timestamp = Date.now();
      const empresa = await prisma.empresa.create({
        data: {
          codigo: `UPD${timestamp}`,
          nome: 'Original Name',
          cnpj: `${timestamp}222222`,
          status: 'ativa'
        }
      });

      const updated = await update(empresa.id, { nome: 'Updated Name' });
      expect(updated.nome).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    test('deve deletar empresa', async () => {
      const timestamp = Date.now();
      const empresa = await prisma.empresa.create({
        data: {
          codigo: `DEL${timestamp}`,
          nome: 'To Delete',
          cnpj: `${timestamp}333333`,
          status: 'ativa'
        }
      });

      await remove(empresa.id);
      const found = await prisma.empresa.findUnique({ where: { id: empresa.id } });
      expect(found).toBeNull();
    });
  });
});












