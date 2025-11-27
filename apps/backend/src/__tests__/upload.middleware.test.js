/**
 * Testes do middleware de upload
 */

const {
  uploadMultiple,
  uploadSingle,
  handleUploadError
} = require('../middleware/upload');

const multer = require('multer');

jest.mock('multer'); // evita comportamento real

describe('Upload Middleware', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** ---------------------------------------------------------
   *  Testes básicos de existência
   * --------------------------------------------------------- */
  test('uploadMultiple deve ser uma função', () => {
    expect(typeof uploadMultiple).toBe('function');
  });

  test('uploadSingle deve ser uma função', () => {
    expect(typeof uploadSingle).toBe('function');
  });

  test('handleUploadError deve ser uma função', () => {
    expect(typeof handleUploadError).toBe('function');
  });

  /** ---------------------------------------------------------
   *  LIMIT_FILE_SIZE
   * --------------------------------------------------------- */
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

  /** ---------------------------------------------------------
   *  LIMIT_FILE_COUNT
   * --------------------------------------------------------- */
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
        message: expect.stringContaining('5')
      })
    );
  });

  /** ---------------------------------------------------------
   *  LIMIT_UNEXPECTED_FILE
   * --------------------------------------------------------- */
  test('handleUploadError deve tratar erro LIMIT_UNEXPECTED_FILE', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    error.code = 'LIMIT_UNEXPECTED_FILE';

    handleUploadError(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Campo de arquivo inesperado')
      })
    );
  });

  /** ---------------------------------------------------------
   *  Tipo de arquivo não permitido
   * --------------------------------------------------------- */
  test('handleUploadError deve tratar erro de tipo MIME inválido', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    const error = new Error(
      'Tipo de arquivo não permitido. Apenas PDF, XML e Excel são aceitos.'
    );

    handleUploadError(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Tipo de arquivo não permitido')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  /** ---------------------------------------------------------
   *  Erro genérico → deve chamar next(error)
   * --------------------------------------------------------- */
  test('handleUploadError deve chamar next(error) para erros não tratados', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const error = new Error('Erro desconhecido');

    handleUploadError(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
