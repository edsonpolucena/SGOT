const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid(
    'ACCOUNTING_SUPER',
    'ACCOUNTING_ADMIN',
    'ACCOUNTING_NORMAL',
    'CLIENT_ADMIN',
    'CLIENT_NORMAL').default('CLIENT_NORMAL'),
  companyId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const obligationSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  regime: Joi.string().valid('SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI').required(),
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().required(),
  dueDate: Joi.date().iso().required(),
  amount: Joi.number().precision(2).min(0).optional(),
  notes: Joi.string().max(1000).optional(),
  companyId: Joi.number().integer().positive().required()
});

const companySchema = Joi.object({
  codigo: Joi.string().min(2).max(20).required(),
  nome: Joi.string().min(2).max(200).required(),
  cnpj: Joi.string().pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).required(),
  email: Joi.string().email().optional(),
  telefone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).optional(),
  endereco: Joi.string().max(500).optional(),
  status: Joi.string().valid('ativa', 'inativa').optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).max(100).optional(),
  role: Joi.string().valid(
    'ACCOUNTING_SUPER',
    'ACCOUNTING_ADMIN',
    'ACCOUNTING_NORMAL',
    'CLIENT_ADMIN',
    'CLIENT_NORMAL'
  ).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
  companyId: Joi.number().integer().positive().optional().allow(null)
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required()
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        message: 'Validation error',
        errors: errorMessages
      });
    }

    req.body = value;
    next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      return res.status(400).json({
        message: 'Invalid parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.params = value;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.query = value;
    next();
  };
}

const idParamSchema = Joi.object({
  id: Joi.string().required()
});

const fileIdParamSchema = Joi.object({
  fileId: Joi.string().required()
});

const obligationIdParamSchema = Joi.object({
  obligationId: Joi.string().required()
});

const obligationFiltersSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'SUBMITTED', 'LATE', 'PAID', 'CANCELED').optional(),
  regime: Joi.string().valid('SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI').optional(),
  companyId: Joi.number().integer().positive().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional()
});

module.exports = {
  validate,
  validateParams,
  validateQuery,
  registerSchema,
  loginSchema,
  obligationSchema,
  companySchema,
  updateUserSchema,
  updateStatusSchema,
  idParamSchema,
  fileIdParamSchema,
  obligationIdParamSchema,
  obligationFiltersSchema
};