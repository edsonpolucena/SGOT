const { errorMiddleware } = require('../middleware/error');

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('deve retornar status 500 para erro genérico', () => {
    const err = new Error('Erro genérico');

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro genérico' });
  });

  test('deve usar statusCode do erro se existir', () => {
    const err = new Error('Not Found');
    err.statusCode = 404;

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not Found' });
  });

  test('deve usar status do erro se existir', () => {
    const err = new Error('Unauthorized');
    err.status = 401;

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  test('deve retornar mensagem padrão se não houver mensagem', () => {
    const err = {};

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});






