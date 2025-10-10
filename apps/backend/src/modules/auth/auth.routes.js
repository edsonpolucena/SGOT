const { Router } = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const authorize = require('../../middleware/authorize');
const { validate } = require('../../middleware/validation');
const { registerSchema, loginSchema } = require('../../middleware/validation');
const { postLogin, postRegister, getMe } = require('./auth.controller');

const authRouter = Router();

authRouter.get('/health', (_req, res) => res.json({ ok: true }));

authRouter.post('/login', validate(loginSchema), postLogin);

// Somente contabilidade (super/admin) e cliente admin podem criar usuários
authRouter.post(
  '/register',
  requireAuth,
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN']),
  validate(registerSchema),
  postRegister
);

authRouter.get('/me', requireAuth, getMe);

module.exports = { authRouter };
