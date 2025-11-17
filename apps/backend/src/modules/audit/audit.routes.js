const { Router } = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const authorize = require('../../middleware/authorize');
const { validateParams, idParamSchema } = require('../../middleware/validation');
const {
  listAuditLogs,
  getLog,
  getStats
} = require('./audit.controller');

const auditRouter = Router();

// Todas as rotas requerem autenticação E ser ACCOUNTING_SUPER
auditRouter.use(requireAuth);
auditRouter.use(authorize(['ACCOUNTING_SUPER']));

/**
 * GET /api/audit/logs
 * Lista logs de auditoria com filtros
 * Query params: userId, action, entity, entityId, startDate, endDate, page, limit
 */
auditRouter.get('/logs', listAuditLogs);

/**
 * GET /api/audit/logs/:id
 * Busca um log específico
 */
auditRouter.get('/logs/:id', validateParams(idParamSchema), getLog);

/**
 * GET /api/audit/stats
 * Retorna estatísticas de auditoria
 * Query params: startDate, endDate
 */
auditRouter.get('/stats', getStats);

module.exports = { auditRouter };

