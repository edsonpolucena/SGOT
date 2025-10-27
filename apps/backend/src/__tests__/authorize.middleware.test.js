const authorize = require('../middleware/authorize');

describe('Authorize Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('deve permitir acesso para role permitida', () => {
    req.user = { role: 'ACCOUNTING_SUPER' };
    const middleware = authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN']);
    
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('deve negar acesso para role não permitida', () => {
    req.user = { role: 'CLIENT_NORMAL' };
    const middleware = authorize(['ACCOUNTING_SUPER']);
    
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Acesso negado')
      })
    );
  });

  test('deve negar acesso quando user não existe', () => {
    req.user = null;
    const middleware = authorize(['ACCOUNTING_SUPER']);
    
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deve permitir múltiplas roles', () => {
    req.user = { role: 'ACCOUNTING_ADMIN' };
    const middleware = authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL']);
    
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
