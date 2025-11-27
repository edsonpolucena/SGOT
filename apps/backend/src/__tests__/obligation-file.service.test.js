// apps/backend/src/__tests__/obligation-file.service.test.js

jest.mock('../services/s3.service', () => ({
  getSignedUrl: jest.fn(() => 'https://signed-url'),
  deleteFile: jest.fn(() => Promise.resolve(true))
}));

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
const s3Service = require('../services/s3.service');

describe('Obligation File Service', () => {
  let user;            // ACCOUNTING_SUPER (criador da obrigação principal)
  let accountingUser;  // ACCOUNTING_ADMIN
  let clientUser;      // CLIENT_NORMAL mesma empresa
  let company;
  let obligation;      // obrigação principal (user = ACCOUNTING_SUPER)
  let file;           // arquivo principal criado em createObligationFile

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

  // ---------------------------------------------------------------------------
  // createObligationFile
  // ---------------------------------------------------------------------------
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

    test('deve lançar erro amigável se falhar ao salvar o arquivo', async () => {
      const fileInfo = {
        key: 'obligations/error-file.pdf',
        originalname: 'error-file.pdf',
        size: 2048,
        mimetype: 'application/pdf',
        location: 'https://s3.amazonaws.com/bucket/obligations/error-file.pdf'
      };

      const spy = jest
        .spyOn(prisma.obligationFile, 'create')
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(
        createObligationFile(obligation.id, fileInfo, user.id)
      ).rejects.toThrow('Falha ao salvar informações do arquivo');

      spy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // getObligationFiles
  // ---------------------------------------------------------------------------
  describe('getObligationFiles', () => {
    test('deve retornar arquivos para criador da obrigação', async () => {
      const files = await getObligationFiles(obligation.id, user.id);
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    test('deve retornar arquivos para usuário de contabilidade', async () => {
      const files = await getObligationFiles(obligation.id, accountingUser.id);
      expect(Array.isArray(files)).toBe(true);
    });

    test('deve retornar arquivos para cliente da mesma empresa', async () => {
      const files = await getObligationFiles(obligation.id, clientUser.id);
      expect(Array.isArray(files)).toBe(true);
    });

    test('deve lançar erro se usuário não existir', async () => {
      await expect(
        getObligationFiles(obligation.id, 99999999)
      ).rejects.toThrow('Usuário não encontrado');
    });

    test('deve lançar erro se obrigação não existir', async () => {
      const someUser = await prisma.user.create({
        data: {
          email: 'someuser@test.com',
          name: 'Some User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'ACCOUNTING_SUPER',
          status: 'ACTIVE'
        }
      });

      await expect(
        getObligationFiles(99999999, someUser.id)
      ).rejects.toThrow('Obrigação não encontrada');

      await prisma.user.delete({ where: { id: someUser.id } });
    });

    test('deve lançar erro se usuário não tiver acesso à obrigação', async () => {
      const otherCompany = await prisma.empresa.create({
        data: {
          codigo: `OTHER${Date.now()}`,
          nome: 'Other Company',
          cnpj: `${Date.now()}999191`,
          status: 'ativa'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: otherCompany.id
        }
      });

      await expect(
        getObligationFiles(obligation.id, otherUser.id)
      ).rejects.toThrow('Acesso negado à obrigação');

      await prisma.user.delete({ where: { id: otherUser.id } });
      await prisma.empresa.delete({ where: { id: otherCompany.id } });
    });
  });

  // ---------------------------------------------------------------------------
  // getFileViewUrl
  // ---------------------------------------------------------------------------
  describe('getFileViewUrl', () => {
    test('deve gerar URL de visualização para criador', async () => {
      const url = await getFileViewUrl(file.id, user.id);
      expect(typeof url).toBe('string');
      expect(s3Service.getSignedUrl).toHaveBeenCalledWith(file.s3Key, 3600, false);
    });

    test('deve gerar URL de visualização para usuário de contabilidade', async () => {
      const url = await getFileViewUrl(file.id, accountingUser.id);
      expect(typeof url).toBe('string');
    });

    test('deve gerar URL de visualização para cliente da mesma empresa', async () => {
      const url = await getFileViewUrl(file.id, clientUser.id);
      expect(typeof url).toBe('string');
    });

    test('deve lançar erro se arquivo não existir', async () => {
      await expect(
        getFileViewUrl(99999999, user.id)
      ).rejects.toThrow('Arquivo não encontrado');
    });

    test('deve lançar erro se usuário não existir', async () => {
      await expect(
        getFileViewUrl(file.id, 99999999)
      ).rejects.toThrow('Usuário não encontrado');
    });

    test('deve lançar erro se usuário não tiver acesso ao arquivo', async () => {
      const otherCompany = await prisma.empresa.create({
        data: {
          codigo: `NOACC${Date.now()}`,
          nome: 'No Access Company',
          cnpj: `${Date.now()}888191`,
          status: 'ativa'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'noaccess-fileview@test.com',
          name: 'No Access View User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: otherCompany.id
        }
      });

      await expect(
        getFileViewUrl(file.id, otherUser.id)
      ).rejects.toThrow('Acesso negado ao arquivo');

      await prisma.user.delete({ where: { id: otherUser.id } });
      await prisma.empresa.delete({ where: { id: otherCompany.id } });
    });
  });

  // ---------------------------------------------------------------------------
  // getFileDownloadUrl
  // ---------------------------------------------------------------------------
  describe('getFileDownloadUrl', () => {
    test('deve gerar URL de download para criador', async () => {
      const url = await getFileDownloadUrl(file.id, user.id);
      expect(typeof url).toBe('string');
      expect(s3Service.getSignedUrl).toHaveBeenCalledWith(file.s3Key, 3600, true);
    });

    test('deve gerar URL de download para usuário de contabilidade', async () => {
      const url = await getFileDownloadUrl(file.id, accountingUser.id);
      expect(typeof url).toBe('string');
    });

    test('deve gerar URL de download para cliente da mesma empresa', async () => {
      const url = await getFileDownloadUrl(file.id, clientUser.id);
      expect(typeof url).toBe('string');
    });

    test('deve lançar erro se arquivo não existir', async () => {
      await expect(
        getFileDownloadUrl(99999999, user.id)
      ).rejects.toThrow('Arquivo não encontrado');
    });

    test('deve lançar erro se usuário não existir', async () => {
      await expect(
        getFileDownloadUrl(file.id, 99999999)
      ).rejects.toThrow('Usuário não encontrado');
    });

    test('deve lançar erro se usuário não tiver acesso ao arquivo', async () => {
      const otherCompany = await prisma.empresa.create({
        data: {
          codigo: `NOACC2${Date.now()}`,
          nome: 'No Access 2 Company',
          cnpj: `${Date.now()}777191`,
          status: 'ativa'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'noaccess-filedownload@test.com',
          name: 'No Access Download User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: otherCompany.id
        }
      });

      await expect(
        getFileDownloadUrl(file.id, otherUser.id)
      ).rejects.toThrow('Acesso negado ao arquivo');

      await prisma.user.delete({ where: { id: otherUser.id } });
      await prisma.empresa.delete({ where: { id: otherCompany.id } });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteObligationFile
  // ---------------------------------------------------------------------------
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

      const result = await deleteObligationFile(testFile.id, user.id);
      expect(result).toBe(true);
      expect(s3Service.deleteFile).toHaveBeenCalledWith('obligations/test-delete.pdf');
    });

    test('deve permitir deletar se obrigação pertencer a ACCOUNTING_SUPER (segundo ramo do canDelete)', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-deleter@test.com',
          name: 'Other Deleter',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE'
        }
      });

      const testFile = await prisma.obligationFile.create({
        data: {
          obligationId: obligation.id, // obrigação do user ACCOUNTING_SUPER
          fileName: 'test-delete-any.pdf',
          originalName: 'test-delete-any.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          s3Key: 'obligations/test-delete-any.pdf',
          uploadedBy: user.id
        }
      });

      const result = await deleteObligationFile(testFile.id, otherUser.id);
      expect(result).toBe(true);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    test('deve lançar erro se usuário não tiver permissão', async () => {
      // Criar obrigação de um usuário NÃO ACCOUNTING_SUPER
      const anotherUser = await prisma.user.create({
        data: {
          email: 'no-perm-owner@test.com',
          name: 'No Perm Owner',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE'
        }
      });

      const anotherObligation = await prisma.obligation.create({
        data: {
          title: 'No Perm Obligation',
          regime: 'SIMPLES',
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate: new Date('2025-02-10'),
          companyId: company.id,
          userId: anotherUser.id,
          status: 'PENDING'
        }
      });

      const testFile = await prisma.obligationFile.create({
        data: {
          obligationId: anotherObligation.id,
          fileName: 'test-no-permission.pdf',
          originalName: 'test-no-permission.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          s3Key: 'obligations/test-no-permission.pdf',
          uploadedBy: anotherUser.id
        }
      });

      const stranger = await prisma.user.create({
        data: {
          email: 'stranger@test.com',
          name: 'Stranger User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE'
        }
      });

      await expect(
        deleteObligationFile(testFile.id, stranger.id)
      ).rejects.toThrow('Permissão negada para deletar arquivo');

      await prisma.user.delete({ where: { id: stranger.id } });
      await prisma.obligationFile.delete({ where: { id: testFile.id } });
      await prisma.obligation.delete({ where: { id: anotherObligation.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });

    test('deve lançar erro se arquivo não for encontrado', async () => {
      await expect(
        deleteObligationFile(99999999, user.id)
      ).rejects.toThrow('Arquivo não encontrado');
    });
  });

  // ---------------------------------------------------------------------------
  // hasAccessToObligation
  // ---------------------------------------------------------------------------
  describe('hasAccessToObligation', () => {
    test('deve retornar true se for criador', async () => {
      const hasAccess = await hasAccessToObligation(obligation.id, user.id);
      expect(hasAccess).toBe(true);
    });

    test('deve retornar true se obrigação pertencer a ACCOUNTING_SUPER (segundo ramo do OR)', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'hasaccess-other@test.com',
          name: 'Has Access Other',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE'
        }
      });

      const hasAccess = await hasAccessToObligation(obligation.id, otherUser.id);
      expect(hasAccess).toBe(true);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    test('deve retornar false se obrigação não existir', async () => {
      const hasAccess = await hasAccessToObligation(99999999, user.id);
      expect(hasAccess).toBe(false);
    });

    test('deve retornar false em caso de erro no banco', async () => {
      const spy = jest
        .spyOn(prisma.obligation, 'findFirst')
        .mockRejectedValueOnce(new Error('DB error'));

      const hasAccess = await hasAccessToObligation(obligation.id, user.id);
      expect(hasAccess).toBe(false);

      spy.mockRestore();
    });
  });
});
