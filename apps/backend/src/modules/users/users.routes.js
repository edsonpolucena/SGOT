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

usersRouter.use(requireAuth);

usersRouter.get(
  '/',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL', 'CLIENT_ADMIN']),
  listUsers
);

usersRouter.get(
  '/:id',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL', 'CLIENT_ADMIN']),
  validateParams(idParamSchema),
  getUser
);

usersRouter.put(
  '/:id',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN']),
  validateParams(idParamSchema),
  validate(updateUserSchema),
  updateUserData
);

usersRouter.patch(
  '/:id/status',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN']),
  validateParams(idParamSchema),
  validate(updateStatusSchema),
  changeUserStatus
);

usersRouter.delete(
  '/:id',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN']),
  validateParams(idParamSchema),
  removeUser
);

module.exports = { usersRouter };














