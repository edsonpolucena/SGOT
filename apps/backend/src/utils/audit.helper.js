const { createAuditLog } = require('../modules/audit/audit.service');

/**
 * Helper para registrar logs de auditoria de forma simples
 * Extrai IP e User Agent da requisição automaticamente
 * 
 * @param {Object} req - Request do Express
 * @param {string} action - Ação executada (CREATE, UPDATE, DELETE, VIEW, DOWNLOAD, etc.)
 * @param {string} entity - Entidade afetada (Obligation, User, ObligationFile, Company, Auth)
 * @param {string} entityId - ID da entidade
 * @param {Object} metadata - Dados adicionais (opcional)
 */
async function logAudit(req, action, entity, entityId, metadata = null) {
  try {
    // Obter IP do cliente
    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress ||
                     'unknown';

    // Obter User Agent
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Obter userId (pode vir de req.userId ou req.user.id)
    const userId = req.userId || req.user?.id;

    if (!userId) {
      console.warn('logAudit: userId não encontrado na requisição');
      return null;
    }

    return await createAuditLog({
      userId,
      action,
      entity,
      entityId,
      metadata,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
    return null;
  }
}

module.exports = { logAudit };

