const {
  getUnviewedObligations,
  sendObligationNotification,
  getObligationNotifications,
  getObligationViews,
  getClientViewsHistory,
  getNotificationStats
} = require('./notification.service');

/**
 * GET /api/notifications/unviewed
 * Lista obrigações não visualizadas pelos clientes
 */
async function listUnviewedObligations(req, res) {
  try {
    const filters = {
      companyId: req.query.companyId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const obligations = await getUnviewedObligations(filters);
    return res.json(obligations);
  } catch (err) {
    console.error('Erro ao listar obrigações não visualizadas:', err);
    return res.status(500).json({ message: 'Erro ao listar obrigações não visualizadas' });
  }
}

/**
 * POST /api/notifications/send/:obligationId
 * Reenvia notificação para os usuários da empresa
 */
async function resendNotification(req, res) {
  try {
    const { obligationId } = req.params;
    const sentBy = req.userId;

    const result = await sendObligationNotification(obligationId, sentBy);
    
    return res.json({
      message: 'Notificação enviada com sucesso',
      ...result
    });
  } catch (err) {
    if (err.message === 'OBLIGATION_NOT_FOUND') {
      return res.status(404).json({ message: 'Obrigação não encontrada' });
    }
    console.error('Erro ao reenviar notificação:', err);
    return res.status(500).json({ message: 'Erro ao reenviar notificação' });
  }
}

/**
 * GET /api/notifications/:obligationId/history
 * Busca histórico de notificações de uma obrigação
 */
async function getNotificationHistory(req, res) {
  try {
    const { obligationId } = req.params;
    const notifications = await getObligationNotifications(obligationId);
    return res.json(notifications);
  } catch (err) {
    console.error('Erro ao buscar histórico de notificações:', err);
    return res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
}

/**
 * GET /api/notifications/:obligationId/views
 * Busca histórico de visualizações de uma obrigação
 */
async function getViewHistory(req, res) {
  try {
    const { obligationId } = req.params;
    const views = await getObligationViews(obligationId);
    return res.json(views);
  } catch (err) {
    console.error('Erro ao buscar histórico de visualizações:', err);
    return res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
}

/**
 * GET /api/obligations/:obligationId/client-views
 * Busca histórico de visualizações/downloads APENAS de usuários CLIENT (não contabilidade)
 */
async function getClientViewsHistoryController(req, res) {
  try {
    // A rota usa :id, então o parâmetro vem como 'id', não 'obligationId'
    const obligationId = req.params.id || req.params.obligationId;
    
    if (!obligationId) {
      console.error('❌ obligationId não encontrado em req.params:', req.params);
      return res.status(400).json({ message: 'obligationId é obrigatório' });
    }

    console.log(`🔍 Buscando histórico de clientes para obrigação: ${obligationId}`);
    const history = await getClientViewsHistory(obligationId);
    console.log(`✅ Histórico retornado: ${history.length} registros`);
    return res.json(history);
  } catch (err) {
    console.error('❌ Erro ao buscar histórico de clientes:', err);
    console.error('Stack trace:', err.stack);
    return res.status(500).json({ 
      message: 'Erro ao buscar histórico',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * GET /api/notifications/stats
 * Retorna estatísticas de notificações e visualizações
 */
async function getStats(req, res) {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const stats = await getNotificationStats(filters);
    return res.json(stats);
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
}

// Aliases para compatibilidade com routes
const sendNotification = resendNotification;
const getNotificationViews = getViewHistory;

module.exports = {
  listUnviewedObligations,
  resendNotification,
  sendNotification, // Alias
  getNotificationHistory,
  getViewHistory,
  getNotificationViews, // Alias
  getClientViewsHistory: getClientViewsHistoryController,
  getStats
};




