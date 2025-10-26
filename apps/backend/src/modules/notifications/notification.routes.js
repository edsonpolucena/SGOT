const { Router } = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const authorize = require('../../middleware/authorize');
const { validateParams, idParamSchema } = require('../../middleware/validation');
const {
  listUnviewedObligations,
  resendNotification,
  getNotificationHistory,
  getViewHistory,
  getStats
} = require('./notification.controller');

const notificationRouter = Router();

// Todas as rotas requerem autenticação
notificationRouter.use(requireAuth);

/**
 * GET /api/notifications/unviewed
 * Lista obrigações não visualizadas
 * Apenas contabilidade pode acessar
 */
notificationRouter.get(
  '/unviewed',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL']),
  listUnviewedObligations
);

/**
 * POST /api/notifications/send/:obligationId
 * Reenvia notificação por email
 * Apenas contabilidade pode enviar
 */
notificationRouter.post(
  '/send/:obligationId',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL']),
  validateParams(idParamSchema),
  resendNotification
);

/**
 * GET /api/notifications/:obligationId/history
 * Histórico de notificações de uma obrigação
 */
notificationRouter.get(
  '/:obligationId/history',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL']),
  validateParams(idParamSchema),
  getNotificationHistory
);

/**
 * GET /api/notifications/:obligationId/views
 * Histórico de visualizações de uma obrigação
 */
notificationRouter.get(
  '/:obligationId/views',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL']),
  validateParams(idParamSchema),
  getViewHistory
);

/**
 * GET /api/notifications/stats
 * Estatísticas de notificações
 */
notificationRouter.get(
  '/stats',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN']),
  getStats
);

module.exports = { notificationRouter };



