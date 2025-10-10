const { Router } = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const authorize = require('../../middleware/authorize');
const { validate, validateParams } = require('../../middleware/validation');
const { updateUserSchema, updateStatusSchema, idParamSchema } = require('../../middleware/validation');
const {
  listUsers,
  getUser,
  updateUserData,
  changeUserStatus,
  removeUser
} = require('./users.controller');

const usersRouter = Router();

// Todas as rotas requerem autenticação
usersRouter.use(requireAuth);

/**
 * GET /api/users
 * Lista todos os usuários (com filtros)
 * Permissões: ACCOUNTING_*, CLIENT_ADMIN
 */
usersRouter.get(
  '/',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL', 'CLIENT_ADMIN']),
  listUsers
);

/**
 * GET /api/users/:id
 * Busca um usuário por ID
 * Permissões: ACCOUNTING_*, CLIENT_ADMIN
 */
usersRouter.get(
  '/:id',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL', 'CLIENT_ADMIN']),
  validateParams(idParamSchema),
  getUser
);

/**
 * PUT /api/users/:id
 * Atualiza um usuário
 * Permissões: ACCOUNTING_SUPER, ACCOUNTING_ADMIN, CLIENT_ADMIN
 */
usersRouter.put(
  '/:id',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN']),
  validateParams(idParamSchema),
  validate(updateUserSchema),
  updateUserData
);

/**
 * PATCH /api/users/:id/status
 * Altera apenas o status do usuário (ACTIVE/INACTIVE)
 * Permissões: ACCOUNTING_SUPER, ACCOUNTING_ADMIN, CLIENT_ADMIN
 */
usersRouter.patch(
  '/:id/status',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN']),
  validateParams(idParamSchema),
  validate(updateStatusSchema),
  changeUserStatus
);

/**
 * DELETE /api/users/:id
 * Deleta (inativa) um usuário
 * Permissões: ACCOUNTING_SUPER, ACCOUNTING_ADMIN, CLIENT_ADMIN
 */
usersRouter.delete(
  '/:id',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN']),
  validateParams(idParamSchema),
  removeUser
);

module.exports = { usersRouter };


