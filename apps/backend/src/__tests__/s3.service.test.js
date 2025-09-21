const AWS = require('aws-sdk');
const s3Service = require('../services/s3.service');

jest.mock('aws-sdk', () => {
  const mockS3 = {
    upload: jest.fn().mockReturnThis(),
    getSignedUrl: jest.fn(),
    deleteObject: jest.fn().mockReturnThis(),
    headObject: jest.fn().mockReturnThis(),
    promise: jest.fn()
  };

  return {
    S3: jest.fn(() => mockS3)
  };
});

jest.mock('../config/env', () => ({
  env: {
    AWS_ACCESS_KEY_ID: 'test-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret',
    AWS_REGION: 'us-east-1',
    S3_BUCKET_NAME: 'test-bucket'
  }
}));

describe('S3 Service Tests', () => {
  let mockS3Instance;

  beforeEach(() => {

    jest.clearAllMocks();
    
    mockS3Instance = new AWS.S3();
  });

  describe('uploadFile', () => {
    it('deve fazer upload de arquivo com sucesso', async () => {
      const mockResult = {
        Location: 'https://test-bucket.s3.amazonaws.com/documents/1234567890-test.txt'
      };

      mockS3Instance.upload().promise.mockResolvedValue(mockResult);

      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.txt';
      const mimeType = 'text/plain';
      const folder = 'documents';

      const result = await s3Service.uploadFile(fileBuffer, fileName, mimeType, folder);

      expect(mockS3Instance.upload).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: expect.stringMatching(/^documents\/\d+-test\.txt$/),
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'private'
      });

      expect(result).toEqual({
        s3Key: expect.stringMatching(/^documents\/\d+-test\.txt$/),
        s3Url: mockResult.Location
      });
    });

    it('deve usar pasta padrão se não especificada', async () => {
      const mockResult = {
        Location: 'https://test-bucket.s3.amazonaws.com/documents/1234567890-test.txt'
      };

      mockS3Instance.upload().promise.mockResolvedValue(mockResult);

      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.txt';
      const mimeType = 'text/plain';

      await s3Service.uploadFile(fileBuffer, fileName, mimeType);

      expect(mockS3Instance.upload).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: expect.stringMatching(/^documents\/\d+-test\.txt$/),
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'private'
      });
    });

    it('deve lançar erro em caso de falha no upload', async () => {
      const error = new Error('Upload failed');
      mockS3Instance.upload().promise.mockRejectedValue(error);

      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.txt';
      const mimeType = 'text/plain';

      await expect(s3Service.uploadFile(fileBuffer, fileName, mimeType))
        .rejects.toThrow('Falha no upload do arquivo');
    });
  });

  describe('getSignedUrl', () => {
    it('deve gerar URL assinada com sucesso', () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-file.txt?signature=abc123';
      mockS3Instance.getSignedUrl.mockReturnValue(mockUrl);

      const s3Key = 'documents/test-file.txt';
      const expiresIn = 3600;

      const result = s3Service.getSignedUrl(s3Key, expiresIn);

      expect(mockS3Instance.getSignedUrl).toHaveBeenCalledWith('getObject', {
        Bucket: 'test-bucket',
        Key: s3Key,
        Expires: expiresIn
      });

      expect(result).toBe(mockUrl);
    });

    it('deve usar tempo de expiração padrão', () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-file.txt?signature=abc123';
      mockS3Instance.getSignedUrl.mockReturnValue(mockUrl);

      const s3Key = 'documents/test-file.txt';

      s3Service.getSignedUrl(s3Key);

      expect(mockS3Instance.getSignedUrl).toHaveBeenCalledWith('getObject', {
        Bucket: 'test-bucket',
        Key: s3Key,
        Expires: 3600
      });
    });

    it('deve lançar erro em caso de falha', () => {
      const error = new Error('Failed to generate URL');
      mockS3Instance.getSignedUrl.mockImplementation(() => {
        throw error;
      });

      const s3Key = 'documents/test-file.txt';

      expect(() => s3Service.getSignedUrl(s3Key))
        .toThrow('Falha ao gerar URL de download');
    });
  });

  describe('deleteFile', () => {
    it('deve deletar arquivo com sucesso', async () => {
      mockS3Instance.deleteObject().promise.mockResolvedValue({});

      const s3Key = 'documents/test-file.txt';

      const result = await s3Service.deleteFile(s3Key);

      expect(mockS3Instance.deleteObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: s3Key
      });

      expect(result).toBe(true);
    });

    it('deve retornar false em caso de erro', async () => {
      const error = new Error('Delete failed');
      mockS3Instance.deleteObject().promise.mockRejectedValue(error);

      const s3Key = 'documents/test-file.txt';

      const result = await s3Service.deleteFile(s3Key);

      expect(result).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('deve retornar true se arquivo existe', async () => {
      mockS3Instance.headObject().promise.mockResolvedValue({});

      const s3Key = 'documents/test-file.txt';

      const result = await s3Service.fileExists(s3Key);

      expect(mockS3Instance.headObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: s3Key
      });

      expect(result).toBe(true);
    });

    it('deve retornar false se arquivo não existe', async () => {
      const error = new Error('Not Found');
      error.statusCode = 404;
      mockS3Instance.headObject().promise.mockRejectedValue(error);

      const s3Key = 'documents/non-existent-file.txt';

      const result = await s3Service.fileExists(s3Key);

      expect(result).toBe(false);
    });

    it('deve retornar false para outros erros', async () => {
      const error = new Error('Access Denied');
      error.statusCode = 403;
      mockS3Instance.headObject().promise.mockRejectedValue(error);

      const s3Key = 'documents/restricted-file.txt';

      const result = await s3Service.fileExists(s3Key);

      expect(result).toBe(false);
    });
  });
});


