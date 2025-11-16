const { 
  createObligationFile, 
  getObligationFiles, 
  getFileViewUrl, 
  getFileDownloadUrl,
  deleteObligationFile,
  hasAccessToObligation
} = require('../modules/obligations/obligation-file.service');
const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Obligation File Service', () => {
  let user;
  let accountingUser;
  let clientUser;
  let company;
  let obligation;
  let file;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: 'fileuser@test.com',
        name: 'File User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    company = await prisma.empresa.create({
      data: {
        codigo: `FILE${Date.now()}`,
        nome: 'File Company',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });

    clientUser = await prisma.user.create({
      data: {
        email: 'fileclient@test.com',
        name: 'File Client',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        companyId: company.id
      }
    });

    accountingUser = await prisma.user.create({
      data: {
        email: 'fileaccounting@test.com',
        name: 'File Accounting',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_ADMIN',
        status: 'ACTIVE'
      }
    });

    obligation = await prisma.obligation.create({
      data: {
        title: 'Test Obligation',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: user.id,
        status: 'PENDING'
      }
    });
  });

  afterAll(async () => {
    await prisma.obligationFile.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createObligationFile', () => {
    test('deve criar registro de arquivo', async () => {
      const fileInfo = {
        key: 'obligations/test-file.pdf',
        originalname: 'test-file.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        location: 'https://s3.amazonaws.com/bucket/obligations/test-file.pdf'
      };

      file = await createObligationFile(obligation.id, fileInfo, user.id);
      expect(file).toHaveProperty('id');
      expect(file.fileName).toBe('test-file.pdf');
    });
  });

  describe('getObligationFiles', () => {
    test('deve retornar arquivos para criador da obrigação', async () => {
      const files = await getObligationFiles(obligation.id, user.id);
      expect(Array.isArray(files)).toBe(true);
    });

    test('deve retornar arquivos para usuário de contabilidade', async () => {
      const files = await getObligationFiles(obligation.id, accountingUser.id);
      expect(Array.isArray(files)).toBe(true);
    });

    test('deve retornar arquivos para cliente da mesma empresa', async () => {
      const files = await getObligationFiles(obligation.id, clientUser.id);
      expect(Array.isArray(files)).toBe(true);
    });

    test('deve lançar erro se usuário não tiver acesso', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: 99999
        }
      });

      await expect(getObligationFiles(obligation.id, otherUser.id)).rejects.toThrow('Acesso negado');

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('getFileViewUrl', () => {
    test('deve gerar URL de visualização para criador', async () => {
      const url = await getFileViewUrl(file.id, user.id);
      expect(typeof url).toBe('string');
    });

    test('deve gerar URL de visualização para contabilidade', async () => {
      const url = await getFileViewUrl(file.id, accountingUser.id);
      expect(typeof url).toBe('string');
    });

    test('deve gerar URL de visualização para cliente da mesma empresa', async () => {
      const url = await getFileViewUrl(file.id, clientUser.id);
      expect(typeof url).toBe('string');
    });
  });

  describe('getFileDownloadUrl', () => {
    test('deve gerar URL de download para criador', async () => {
      const url = await getFileDownloadUrl(file.id, user.id);
      expect(typeof url).toBe('string');
    });

    test('deve gerar URL de download para contabilidade', async () => {
      const url = await getFileDownloadUrl(file.id, accountingUser.id);
      expect(typeof url).toBe('string');
    });

    test('deve gerar URL de download para cliente da mesma empresa', async () => {
      const url = await getFileDownloadUrl(file.id, clientUser.id);
      expect(typeof url).toBe('string');
    });
  });

  describe('deleteObligationFile', () => {
    test('deve deletar arquivo se for o criador', async () => {
      const testFile = await prisma.obligationFile.create({
        data: {
          obligationId: obligation.id,
          fileName: 'test-delete.pdf',
          originalName: 'test-delete.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          s3Key: 'obligations/test-delete.pdf',
          uploadedBy: user.id
        }
      });

      // Mock do s3Service.deleteFile
      jest.spyOn(require('../services/s3.service'), 'deleteFile').mockResolvedValue(true);

      const result = await deleteObligationFile(testFile.id, user.id);
      expect(result).toBe(true);
    });

    test('deve lançar erro se usuário não tiver permissão', async () => {
      const testFile = await prisma.obligationFile.create({
        data: {
          obligationId: obligation.id,
          fileName: 'test-no-permission.pdf',
          originalName: 'test-no-permission.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          s3Key: 'obligations/test-no-permission.pdf',
          uploadedBy: user.id
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'otherfile@test.com',
          name: 'Other File User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: 99999
        }
      });

      await expect(deleteObligationFile(testFile.id, otherUser.id)).rejects.toThrow('Permissão negada');

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('hasAccessToObligation', () => {
    test('deve retornar true se for criador', async () => {
      const hasAccess = await hasAccessToObligation(obligation.id, user.id);
      expect(hasAccess).toBe(true);
    });

    test('deve retornar false se não tiver acesso', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'noaccess@test.com',
          name: 'No Access User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: 99999
        }
      });

      const hasAccess = await hasAccessToObligation(obligation.id, otherUser.id);
      expect(hasAccess).toBe(false);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});
