const { Router } = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { validate } = require('../../middleware/validation');
const { registerSchema, loginSchema } = require('../../middleware/validation');
const { postLogin, postRegister, getMe } = require('./auth.controller');

const authRouter = Router();

authRouter.get('/health', (_req, res) => res.json({ ok: true }));

authRouter.post('/login', validate(loginSchema), postLogin);
authRouter.post('/register', validate(registerSchema), postRegister);
authRouter.get('/me', requireAuth, getMe);

module.exports = { authRouter };

