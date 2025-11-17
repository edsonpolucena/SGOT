const { 
  getCompanyTaxProfile, 
  addTaxToCompany, 
  removeTaxFromCompany, 
  setCompanyTaxProfile,
  getAvailableTaxTypes 
} = require('../modules/company/company-tax-profile.service');
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

  describe('getCompanyTaxProfile', () => {
    test('deve listar perfil fiscal da empresa', async () => {
      const profiles = await getCompanyTaxProfile(company.id);
      expect(Array.isArray(profiles)).toBe(true);
    });
  });

  describe('addTaxToCompany', () => {
    test('deve adicionar tipo de imposto ao perfil', async () => {
      const profile = await addTaxToCompany(company.id, 'DAS');
      expect(profile).toHaveProperty('taxType', 'DAS');
      expect(profile).toHaveProperty('isActive', true);
    });

    test('deve lançar erro se empresa não existir', async () => {
      await expect(addTaxToCompany(99999, 'DAS')).rejects.toThrow('Empresa não encontrada');
    });

    test('deve lançar erro se imposto já estiver configurado', async () => {
      await addTaxToCompany(company.id, 'ISS_RETIDO');
      await expect(addTaxToCompany(company.id, 'ISS_RETIDO')).rejects.toThrow('já está configurado');
    });

    test('deve reativar imposto se estiver inativo', async () => {
      await prisma.companyTaxProfile.create({
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
      await expect(removeTaxFromCompany(company.id, 'INEXISTENTE')).rejects.toThrow('Configuração não encontrada');
    });
  });

  describe('setCompanyTaxProfile', () => {
    test('deve configurar todos os impostos de uma vez', async () => {
      const taxTypes = ['DAS', 'ISS_RETIDO', 'FGTS'];
      const results = await setCompanyTaxProfile(company.id, taxTypes);

      expect(results.length).toBe(3);
      results.forEach(profile => {
        expect(profile.isActive).toBe(true);
        expect(taxTypes).toContain(profile.taxType);
      });
    });

    test('deve desativar impostos não incluídos na lista', async () => {
      await setCompanyTaxProfile(company.id, ['DAS']);
      const profiles = await getCompanyTaxProfile(company.id);
      const activeProfiles = profiles.filter(p => p.isActive);
      expect(activeProfiles.length).toBe(1);
      expect(activeProfiles[0].taxType).toBe('DAS');
    });
  });

  describe('getAvailableTaxTypes', () => {
    test('deve retornar lista de tipos de impostos disponíveis', () => {
      const taxTypes = getAvailableTaxTypes();
      expect(Array.isArray(taxTypes)).toBe(true);
      expect(taxTypes.length).toBeGreaterThan(0);
      expect(taxTypes[0]).toHaveProperty('code');
      expect(taxTypes[0]).toHaveProperty('name');
    });
  });
});

