const { 
  listTaxCalendar, 
  getTaxCalendarByType, 
  upsertTaxCalendar, 
  deleteTaxCalendar 
} = require('../modules/tax-calendar/tax-calendar.service');
const { prisma } = require('../prisma');

describe('Tax Calendar Service', () => {
  afterAll(async () => {
    await prisma.taxCalendar.deleteMany();
  });

  describe('listTaxCalendar', () => {
    test('deve listar calendário fiscal ativo', async () => {
      await prisma.taxCalendar.create({
        data: {
          taxType: 'DAS',
          dueDay: 20,
          description: 'DAS',
          isActive: true
        }
      });

      const calendar = await listTaxCalendar();
      expect(Array.isArray(calendar)).toBe(true);
    });
  });

  describe('getTaxCalendarByType', () => {
    test('deve buscar vencimento por tipo de imposto', async () => {
      await prisma.taxCalendar.upsert({
        where: { taxType: 'ISS_RETIDO' },
        update: {},
        create: {
          taxType: 'ISS_RETIDO',
          dueDay: 15,
          description: 'ISS Retido'
        }
      });

      const item = await getTaxCalendarByType('ISS_RETIDO');
      expect(item).toBeDefined();
      expect(item.taxType).toBe('ISS_RETIDO');
    });

    test('deve retornar null se não existir', async () => {
      const item = await getTaxCalendarByType('INEXISTENTE');
      expect(item).toBeNull();
    });
  });

  describe('upsertTaxCalendar', () => {
    test('deve criar novo vencimento', async () => {
      const item = await upsertTaxCalendar('FGTS', 7, 'FGTS');
      expect(item.taxType).toBe('FGTS');
      expect(item.dueDay).toBe(7);
    });

    test('deve atualizar vencimento existente', async () => {
      await upsertTaxCalendar('FGTS', 10, 'FGTS Atualizado');
      const item = await getTaxCalendarByType('FGTS');
      expect(item.dueDay).toBe(10);
      expect(item.description).toBe('FGTS Atualizado');
    });
  });

  describe('deleteTaxCalendar', () => {
    test('deve deletar vencimento', async () => {
      await upsertTaxCalendar('TEST_DELETE', 5, 'Test');
      await deleteTaxCalendar('TEST_DELETE');
      const item = await getTaxCalendarByType('TEST_DELETE');
      expect(item).toBeNull();
    });
  });
});

