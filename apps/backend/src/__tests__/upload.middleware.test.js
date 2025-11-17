const { uploadMultiple, uploadSingle, handleUploadError } = require('../middleware/upload');
const multer = require('multer');

describe('Upload Middleware', () => {
  test('uploadMultiple deve ser uma função', () => {
    expect(typeof uploadMultiple).toBe('function');
  });

  test('uploadSingle deve ser uma função', () => {
    expect(typeof uploadSingle).toBe('function');
  });

  test('handleUploadError deve tratar erro LIMIT_FILE_SIZE', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const error = new multer.MulterError('LIMIT_FILE_SIZE');
    error.code = 'LIMIT_FILE_SIZE';

    handleUploadError(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('10MB')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('handleUploadError deve tratar erro LIMIT_FILE_COUNT', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const error = new multer.MulterError('LIMIT_FILE_COUNT');
    error.code = 'LIMIT_FILE_COUNT';

    handleUploadError(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('5 arquivos')
      })
    );
  });

  test('handleUploadError deve tratar erro de tipo de arquivo não permitido', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const error = new Error('Tipo de arquivo não permitido. Apenas PDF, XML e Excel são aceitos.');

    handleUploadError(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Tipo de arquivo não permitido')
      })
    );
  });

  test('handleUploadError deve chamar next para outros erros', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const error = new Error('Outro erro');

    handleUploadError(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

