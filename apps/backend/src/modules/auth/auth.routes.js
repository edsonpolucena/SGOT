const { Router } = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const authorize = require('../../middleware/authorize');
const { validate } = require('../../middleware/validation');
const { registerSchema, loginSchema } = require('../../middleware/validation');
const { 
  postLogin, 
  postRegister, 
  getMe,
  postForgotPassword,
  getValidateResetToken,
  postResetPassword
} = require('./auth.controller');

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

// Rotas de recuperação de senha (públicas, sem autenticação)
authRouter.post('/forgot-password', postForgotPassword);
authRouter.get('/validate-reset-token/:token', getValidateResetToken);
authRouter.post('/reset-password', postResetPassword);

module.exports = { authRouter };
