// Mock AWS SDK v3 antes de importar o serviço
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn(() => ({
      send: mockSend
    })),
    PutObjectCommand: jest.fn((params) => params),
    GetObjectCommand: jest.fn((params) => params),
    DeleteObjectCommand: jest.fn((params) => params),
    HeadObjectCommand: jest.fn((params) => params),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn()
}));

jest.mock('../config/env', () => ({
  env: {
    AWS_ACCESS_KEY_ID: 'test-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret',
    AWS_REGION: 'us-east-1',
    S3_BUCKET_NAME: 'test-bucket'
  }
}));

const s3Service = require('../services/s3.service');
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

describe('S3 Service Tests', () => {
  let mockSend;
  let mockGetSignedUrl;

  beforeEach(() => {
    // Obter a instância mockada do S3Client
    const s3ClientInstance = S3Client();
    mockSend = s3ClientInstance.send;
    mockGetSignedUrl = getSignedUrl;
    
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('deve fazer upload de arquivo com sucesso', async () => {
      mockSend.mockResolvedValueOnce({});

      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.txt';
      const mimeType = 'text/plain';
      const folder = 'documents';

      const result = await s3Service.uploadFile(fileBuffer, fileName, mimeType, folder);

      expect(mockSend).toHaveBeenCalled();
      expect(result).toHaveProperty('s3Key');
      expect(result).toHaveProperty('s3Url');
      expect(result.s3Key).toMatch(/^documents\/\d+-test\.txt$/);
    });

    it('deve usar pasta padrão se não especificada', async () => {
      mockSend.mockResolvedValueOnce({});

      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.txt';
      const mimeType = 'text/plain';

      const result = await s3Service.uploadFile(fileBuffer, fileName, mimeType);

      expect(result.s3Key).toMatch(/^documents\/\d+-test\.txt$/);
    });

    it('deve lançar erro em caso de falha no upload', async () => {
      const error = new Error('Upload failed');
      mockSend.mockRejectedValueOnce(error);

      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.txt';
      const mimeType = 'text/plain';

      await expect(s3Service.uploadFile(fileBuffer, fileName, mimeType))
        .rejects.toThrow('Falha no upload do arquivo');
    });
  });

  describe('getSignedUrl', () => {
    it('deve gerar URL assinada com sucesso', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-file.txt?signature=abc123';
      mockGetSignedUrl.mockResolvedValueOnce(mockUrl);

      const s3Key = 'documents/test-file.txt';
      const expiresIn = 3600;

      const result = await s3Service.getSignedUrl(s3Key, expiresIn);

      expect(mockGetSignedUrl).toHaveBeenCalled();
      expect(result).toBe(mockUrl);
    });

    it('deve usar tempo de expiração padrão', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-file.txt?signature=abc123';
      mockGetSignedUrl.mockResolvedValueOnce(mockUrl);

      const s3Key = 'documents/test-file.txt';

      await s3Service.getSignedUrl(s3Key);

      expect(mockGetSignedUrl).toHaveBeenCalled();
    });

    it('deve lançar erro em caso de falha', async () => {
      const error = new Error('Failed to generate URL');
      mockGetSignedUrl.mockRejectedValueOnce(error);

      const s3Key = 'documents/test-file.txt';

      await expect(s3Service.getSignedUrl(s3Key))
        .rejects.toThrow('Falha ao gerar URL de download');
    });
  });

  describe('deleteFile', () => {
    it('deve deletar arquivo com sucesso', async () => {
      mockSend.mockResolvedValueOnce({});

      const s3Key = 'documents/test-file.txt';

      const result = await s3Service.deleteFile(s3Key);

      expect(mockSend).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('deve retornar false em caso de erro', async () => {
      const error = new Error('Delete failed');
      mockSend.mockRejectedValueOnce(error);

      const s3Key = 'documents/test-file.txt';

      const result = await s3Service.deleteFile(s3Key);

      expect(result).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('deve retornar true se arquivo existe', async () => {
      mockSend.mockResolvedValueOnce({});

      const s3Key = 'documents/test-file.txt';

      const result = await s3Service.fileExists(s3Key);

      expect(mockSend).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('deve retornar false se arquivo não existe', async () => {
      const error = new Error('Not Found');
      mockSend.mockRejectedValueOnce(error);

      const s3Key = 'documents/non-existent-file.txt';

      const result = await s3Service.fileExists(s3Key);

      expect(result).toBe(false);
    });

    it('deve retornar false para outros erros', async () => {
      const error = new Error('Access Denied');
      mockSend.mockRejectedValueOnce(error);

      const s3Key = 'documents/restricted-file.txt';

      const result = await s3Service.fileExists(s3Key);

      expect(result).toBe(false);
    });
  });
});
