const {
  getAuditLogs,
  getAuditLogById,
  getAuditStats
} = require('./audit.service');

/**
 * GET /api/audit/logs
 * Lista todos os logs de auditoria com filtros
 * Apenas para ACCOUNTING_SUPER
 */
async function listAuditLogs(req, res) {
  try {
    const filters = {
      userId: req.query.userId,
      action: req.query.action,
      entity: req.query.entity,
      entityId: req.query.entityId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await getAuditLogs(filters);
    return res.json(result);
  } catch (err) {
    console.error('Erro ao listar logs de auditoria:', err);
    return res.status(500).json({ message: 'Erro ao listar logs de auditoria' });
  }
}

/**
 * GET /api/audit/logs/:id
 * Busca um log específico por ID
 * Apenas para ACCOUNTING_SUPER
 */
async function getLog(req, res) {
  try {
    const log = await getAuditLogById(req.params.id);
    return res.json(log);
  } catch (err) {
    if (err.message === 'LOG_NOT_FOUND') {
      return res.status(404).json({ message: 'Log não encontrado' });
    }
    console.error('Erro ao buscar log:', err);
    return res.status(500).json({ message: 'Erro ao buscar log' });
  }
}

/**
 * GET /api/audit/stats
 * Retorna estatísticas de auditoria
 * Apenas para ACCOUNTING_SUPER
 */
async function getStats(req, res) {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const stats = await getAuditStats(filters);
    return res.json(stats);
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
}

module.exports = {
  listAuditLogs,
  getLog,
  getStats
};

