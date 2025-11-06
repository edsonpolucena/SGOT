const {
  createObligationFile,
  getObligationFiles,
  getFileViewUrl,
  getFileDownloadUrl,
  deleteObligationFile,
  hasAccessToObligation
} = require('../modules/obligations/obligation-file.service');
const { prisma } = require('../prisma');
const s3Service = require('../services/s3.service');

jest.mock('../prisma', () => ({
  prisma: {
    obligationFile: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn()
    },
    obligation: {
      findFirst: jest.fn()
    }
  }
}));

jest.mock('../services/s3.service', () => ({
  getSignedUrl: jest.fn(),
  deleteFile: jest.fn()
}));

describe('Obligation File Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createObligationFile', () => {
    it('deve criar arquivo de obrigação com sucesso', async () => {
      const mockFile = {
        id: 'file-123',
        obligationId: 'obl-123',
        fileName: 'document.pdf',
        originalName: 'document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        s3Key: 'uploads/document.pdf',
        s3Url: 'https://s3.amazonaws.com/uploads/document.pdf',
        uploadedBy: 'user-123'
      };

      prisma.obligationFile.create.mockResolvedValue(mockFile);

      const fileInfo = {
        key: 'uploads/document.pdf',
        originalname: 'document.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        location: 'https://s3.amazonaws.com/uploads/document.pdf'
      };

      const result = await createObligationFile('obl-123', fileInfo, 'user-123');

      expect(result).toEqual(mockFile);
      expect(prisma.obligationFile.create).toHaveBeenCalledWith({
        data: {
          obligationId: 'obl-123',
          fileName: 'document.pdf',
          originalName: 'document.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          s3Key: 'uploads/document.pdf',
          s3Url: 'https://s3.amazonaws.com/uploads/document.pdf',
          uploadedBy: 'user-123'
        }
      });
    });

    it('deve lançar erro se criar arquivo falhar', async () => {
      prisma.obligationFile.create.mockRejectedValue(new Error('Database error'));

      const fileInfo = {
        key: 'uploads/document.pdf',
        originalname: 'document.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        location: 'https://s3.amazonaws.com/uploads/document.pdf'
      };

      await expect(createObligationFile('obl-123', fileInfo, 'user-123'))
        .rejects.toThrow('Falha ao salvar informações do arquivo');
    });
  });

  describe('getObligationFiles', () => {
    it('deve retornar arquivos de obrigação com sucesso', async () => {
      const mockObligation = {
        id: 'obl-123',
        userId: 'user-123'
      };

      const mockFiles = [
        { id: 'file-1', fileName: 'doc1.pdf' },
        { id: 'file-2', fileName: 'doc2.pdf' }
      ];

      prisma.obligation.findFirst.mockResolvedValue(mockObligation);
      prisma.obligationFile.findMany.mockResolvedValue(mockFiles);

      const result = await getObligationFiles('obl-123', 'user-123');

      expect(result).toEqual(mockFiles);
      expect(prisma.obligation.findFirst).toHaveBeenCalled();
      expect(prisma.obligationFile.findMany).toHaveBeenCalledWith({
        where: { obligationId: 'obl-123' },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('deve lançar erro se obrigação não for encontrada', async () => {
      prisma.obligation.findFirst.mockResolvedValue(null);

      await expect(getObligationFiles('obl-123', 'user-123'))
        .rejects.toThrow('Obrigação não encontrada ou acesso negado');
    });
  });

  describe('getFileViewUrl', () => {
    it('deve gerar URL de visualização com sucesso', async () => {
      const mockFile = {
        id: 'file-123',
        s3Key: 'uploads/document.pdf',
        obligation: {
          userId: 'user-123',
          user: { role: 'CLIENT_NORMAL' }
        }
      };

      const mockSignedUrl = 'https://s3.signed-url.com/view';

      prisma.obligationFile.findUnique.mockResolvedValue(mockFile);
      s3Service.getSignedUrl.mockReturnValue(mockSignedUrl);

      const result = await getFileViewUrl('file-123', 'user-123');

      expect(result).toBe(mockSignedUrl);
      expect(s3Service.getSignedUrl).toHaveBeenCalledWith('uploads/document.pdf', 3600, false);
    });

    it('deve permitir acesso para ACCOUNTING_SUPER', async () => {
      const mockFile = {
        id: 'file-123',
        s3Key: 'uploads/document.pdf',
        obligation: {
          userId: 'other-user',
          user: { role: 'ACCOUNTING_SUPER' }
        }
      };

      const mockSignedUrl = 'https://s3.signed-url.com/view';

      prisma.obligationFile.findUnique.mockResolvedValue(mockFile);
      s3Service.getSignedUrl.mockReturnValue(mockSignedUrl);

      const result = await getFileViewUrl('file-123', 'admin-user');

      expect(result).toBe(mockSignedUrl);
    });

    it('deve lançar erro se arquivo não for encontrado', async () => {
      prisma.obligationFile.findUnique.mockResolvedValue(null);

      await expect(getFileViewUrl('file-123', 'user-123'))
        .rejects.toThrow('Arquivo não encontrado');
    });

    it('deve lançar erro se acesso for negado', async () => {
      const mockFile = {
        id: 'file-123',
        s3Key: 'uploads/document.pdf',
        obligation: {
          userId: 'other-user',
          user: { role: 'CLIENT_NORMAL' }
        }
      };

      prisma.obligationFile.findUnique.mockResolvedValue(mockFile);

      await expect(getFileViewUrl('file-123', 'user-123'))
        .rejects.toThrow('Acesso negado ao arquivo');
    });
  });

  describe('getFileDownloadUrl', () => {
    it('deve gerar URL de download com sucesso', async () => {
      const mockFile = {
        id: 'file-123',
        s3Key: 'uploads/document.pdf',
        obligation: {
          userId: 'user-123',
          user: { role: 'CLIENT_NORMAL' }
        }
      };

      const mockSignedUrl = 'https://s3.signed-url.com/download';

      prisma.obligationFile.findUnique.mockResolvedValue(mockFile);
      s3Service.getSignedUrl.mockReturnValue(mockSignedUrl);

      const result = await getFileDownloadUrl('file-123', 'user-123');

      expect(result).toBe(mockSignedUrl);
      expect(s3Service.getSignedUrl).toHaveBeenCalledWith('uploads/document.pdf', 3600, true);
    });

    it('deve lançar erro se arquivo não for encontrado', async () => {
      prisma.obligationFile.findUnique.mockResolvedValue(null);

      await expect(getFileDownloadUrl('file-123', 'user-123'))
        .rejects.toThrow('Arquivo não encontrado');
    });
  });

  describe('deleteObligationFile', () => {
    it('deve deletar arquivo com sucesso', async () => {
      const mockFile = {
        id: 'file-123',
        s3Key: 'uploads/document.pdf',
        obligation: {
          userId: 'user-123',
          user: { role: 'CLIENT_NORMAL' }
        }
      };

      prisma.obligationFile.findUnique.mockResolvedValue(mockFile);
      s3Service.deleteFile.mockResolvedValue(true);
      prisma.obligationFile.delete.mockResolvedValue(mockFile);

      const result = await deleteObligationFile('file-123', 'user-123');

      expect(result).toBe(true);
      expect(s3Service.deleteFile).toHaveBeenCalledWith('uploads/document.pdf');
      expect(prisma.obligationFile.delete).toHaveBeenCalledWith({
        where: { id: 'file-123' }
      });
    });

    it('deve lançar erro se arquivo não for encontrado', async () => {
      prisma.obligationFile.findUnique.mockResolvedValue(null);

      await expect(deleteObligationFile('file-123', 'user-123'))
        .rejects.toThrow('Arquivo não encontrado');
    });

    it('deve lançar erro se permissão for negada', async () => {
      const mockFile = {
        id: 'file-123',
        s3Key: 'uploads/document.pdf',
        obligation: {
          userId: 'other-user',
          user: { role: 'CLIENT_NORMAL' }
        }
      };

      prisma.obligationFile.findUnique.mockResolvedValue(mockFile);

      await expect(deleteObligationFile('file-123', 'user-123'))
        .rejects.toThrow('Permissão negada para deletar arquivo');
    });
  });

  describe('hasAccessToObligation', () => {
    it('deve retornar true se usuário tiver acesso', async () => {
      const mockObligation = {
        id: 'obl-123',
        userId: 'user-123'
      };

      prisma.obligation.findFirst.mockResolvedValue(mockObligation);

      const result = await hasAccessToObligation('obl-123', 'user-123');

      expect(result).toBe(true);
    });

    it('deve retornar false se usuário não tiver acesso', async () => {
      prisma.obligation.findFirst.mockResolvedValue(null);

      const result = await hasAccessToObligation('obl-123', 'user-123');

      expect(result).toBe(false);
    });

    it('deve retornar false em caso de erro', async () => {
      prisma.obligation.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await hasAccessToObligation('obl-123', 'user-123');

      expect(result).toBe(false);
    });
  });
});
