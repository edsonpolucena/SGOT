const { validate } = require('../middleware/validation');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('deve passar com dados válidos', () => {
    const Joi = require('joi');
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required()
    });

    req.body = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('deve rejeitar dados inválidos', () => {
    const Joi = require('joi');
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required()
    });

    req.body = {
      name: 'Test User',
      email: 'invalid-email'
    };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  test('deve remover campos desconhecidos', () => {
    const Joi = require('joi');
    const schema = Joi.object({
      name: Joi.string().required()
    }).unknown(false);

    req.body = {
      name: 'Test User',
      unknownField: 'should be removed'
    };

    const middleware = validate(schema);
    middleware(req, res, next);

    // Deve falhar se unknown não permitido
    expect(res.status).toHaveBeenCalledWith(400);
  });
});














