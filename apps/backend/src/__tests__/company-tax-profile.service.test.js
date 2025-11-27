const {
  getCompanyTaxProfile,
  addTaxToCompany,
  removeTaxFromCompany,
  setCompanyTaxProfile,
  getAvailableTaxTypes
} = require('../modules/company-tax-profile/company-tax-profile.service'); // ❗ CAMINHO CORRIGIDO

const { prisma } = require('../prisma');

describe('Company Tax Profile Service', () => {
  let company;

  beforeAll(async () => {
    company = await prisma.empresa.create({
      data: {
        codigo: `TAXSERV${Date.now()}`,
        nome: 'Tax Service Company',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });
  });

  afterAll(async () => {
    await prisma.companyTaxProfile.deleteMany();
    await prisma.empresa.deleteMany();
  });

  // =============================
  // GET PROFILE
  // =============================
  describe('getCompanyTaxProfile', () => {
    test('deve listar perfil fiscal da empresa', async () => {
      const profiles = await getCompanyTaxProfile(company.id);
      expect(Array.isArray(profiles)).toBe(true);
    });
  });

  // =============================
  // ADD TAX
  // =============================
  describe('addTaxToCompany', () => {
    test('deve adicionar tipo de imposto ao perfil', async () => {
      const profile = await addTaxToCompany(company.id, 'DAS');
      expect(profile).toHaveProperty('taxType', 'DAS');
      expect(profile.isActive).toBe(true);
    });

    test('deve lançar erro se empresa não existir', async () => {
      await expect(addTaxToCompany(99999, 'DAS'))
        .rejects
        .toThrow('Empresa não encontrada');
    });

    test('deve lançar erro se imposto já estiver ativo', async () => {
      await addTaxToCompany(company.id, 'ISS_RETIDO');

      await expect(addTaxToCompany(company.id, 'ISS_RETIDO'))
        .rejects
        .toThrow('já está configurado');
    });

    test('deve reativar imposto se estiver inativo', async () => {
      const inactive = await prisma.companyTaxProfile.create({
        data: {
          companyId: company.id,
          taxType: 'FGTS',
          isActive: false
        }
      });

      const profile = await addTaxToCompany(company.id, 'FGTS');
      expect(profile.isActive).toBe(true);
    });
  });

  // =============================
  // REMOVE TAX
  // =============================
  describe('removeTaxFromCompany', () => {
    test('deve remover (desativar) tipo de imposto', async () => {
      await prisma.companyTaxProfile.create({
        data: {
          companyId: company.id,
          taxType: 'PIS_COFINS',
          isActive: true
        }
      });

      const profile = await removeTaxFromCompany(company.id, 'PIS_COFINS');
      expect(profile.isActive).toBe(false);
    });

    test('deve lançar erro se configuração não existir', async () => {
      await expect(removeTaxFromCompany(company.id, 'INEXISTENTE'))
        .rejects
        .toThrow('Configuração não encontrada');
    });
  });

  // =============================
  // SET PROFILE
  // =============================
  describe('setCompanyTaxProfile', () => {
    test('deve configurar lista completa de impostos', async () => {
      const list = ['DAS', 'ISS', 'INSS'];

      const results = await setCompanyTaxProfile(company.id, list);

      expect(results.length).toBe(3);

      results.forEach(item => {
        expect(list).toContain(item.taxType);
        expect(item.isActive).toBe(true);
      });
    });

    test('deve desativar impostos fora da lista', async () => {
      await setCompanyTaxProfile(company.id, ['DAS']);

      const profiles = await getCompanyTaxProfile(company.id);
      const active = profiles.filter(p => p.isActive);

      expect(active.length).toBe(1);
      expect(active[0].taxType).toBe('DAS');
    });
  });

  // =============================
  // AVAILABLE TAX TYPES
  // =============================
  describe('getAvailableTaxTypes', () => {
    test('deve retornar lista de tipos de impostos disponíveis', () => {
      const list = getAvailableTaxTypes();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]).toHaveProperty('code');
      expect(list[0]).toHaveProperty('name');
    });
  });
});
