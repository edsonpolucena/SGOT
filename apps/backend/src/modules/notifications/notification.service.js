const { prisma } = require('../../prisma');
const { sendNewDocumentNotification } = require('../../services/email.service');

/**
 * Busca obrigações não visualizadas pelos clientes
 * Retorna apenas obrigações que não possuem registro em ObligationView
 */
async function getUnviewedObligations(filters = {}) {
  const where = {};

  // Filtros opcionais
  if (filters.companyId) {
    where.companyId = parseInt(filters.companyId);
  }

  if (filters.startDate || filters.endDate) {
    where.dueDate = {};
    if (filters.startDate) where.dueDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.dueDate.lte = new Date(filters.endDate);
  }

  // Buscar todas as obrigações
  const obligations = await prisma.obligation.findMany({
    where,
    include: {
      company: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          cnpj: true,
          email: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      views: true, // Incluir visualizações
      notifications: {
        orderBy: { sentAt: 'desc' },
        take: 1 // Última notificação
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filtrar apenas obrigações não visualizadas
  const unviewed = obligations.filter(obligation => {
    return obligation.views.length === 0; // Sem visualizações
  });

  // Formatar dados
  return unviewed.map(obligation => {
    let notes = {};
    try {
      notes = JSON.parse(obligation.notes || '{}');
    } catch (e) {
      console.error('Erro ao parsear notes:', e);
    }

    return {
      ...obligation,
      companyCode: notes.companyCode || obligation.company.codigo,
      docType: notes.docType || '',
      competence: notes.competence || '',
      cnpj: notes.cnpj || obligation.company.cnpj,
      companyName: notes.companyName || obligation.company.nome,
      lastNotification: obligation.notifications[0] || null,
      viewCount: obligation.views.length
    };
  });
}

/**
 * Registra uma visualização de obrigação
 */
async function recordView(obligationId, userId, action = 'VIEW') {
  try {
    // Verificar se já existe visualização deste usuário
    const existingView = await prisma.obligationView.findFirst({
      where: {
        obligationId,
        viewedBy: userId
      }
    });

    // Se já visualizou, apenas atualizar o timestamp (criar novo registro)
    const view = await prisma.obligationView.create({
      data: {
        obligationId,
        viewedBy: userId,
        action
      }
    });

    console.log(`✅ Visualização registrada: ${action} - Obrigação ${obligationId} por usuário ${userId}`);

    return view;
  } catch (error) {
    console.error('❌ Erro ao registrar visualização:', error);
    throw error;
  }
}

/**
 * Envia notificação para os usuários da empresa sobre uma obrigação
 * e registra no banco
 */
async function sendObligationNotification(obligationId, sentBy) {
  try {
    // Buscar obrigação com dados da empresa
    const obligation = await prisma.obligation.findUnique({
      where: { id: obligationId },
      include: {
        company: {
          include: {
            users: {
              where: {
                status: 'ACTIVE',
                role: {
                  in: ['CLIENT_ADMIN', 'CLIENT_NORMAL']
                }
              },
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!obligation) {
      throw new Error('OBLIGATION_NOT_FOUND');
    }

    // Parsear notes para obter informações
    let notes = {};
    try {
      notes = JSON.parse(obligation.notes || '{}');
    } catch (e) {}

    const docType = notes.docType || 'Documento';
    const competence = notes.competence || '';
    const companyName = notes.companyName || obligation.company.nome;
    const uploadedBy = obligation.user.name || 'Sistema';

    // Lista de emails para enviar
    const usersToNotify = obligation.company.users;

    if (usersToNotify.length === 0) {
      console.warn('⚠️  Nenhum usuário ativo encontrado para notificar');
      return {
        success: true,
        sent: 0,
        message: 'Nenhum usuário para notificar'
      };
    }

    const results = [];

    // Enviar email para cada usuário
    for (const user of usersToNotify) {
      if (!user.email) {
        console.warn(`⚠️  Usuário ${user.name} sem email cadastrado`);
        continue;
      }

      // Tentar enviar email
      const emailResult = await sendNewDocumentNotification({
        to: user.email,
        userName: user.name || 'Usuário',
        companyName,
        docType,
        competence,
        dueDate: obligation.dueDate,
        uploadedBy
      });

      // Registrar notificação no banco
      const notification = await prisma.obligationNotification.create({
        data: {
          obligationId,
          sentTo: user.email,
          sentBy,
          emailStatus: emailResult.success ? 'sent' : 'failed',
          emailError: emailResult.error || null
        }
      });

      results.push({
        userId: user.id,
        email: user.email,
        success: emailResult.success,
        notificationId: notification.id
      });
    }

    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Notificações enviadas: ${successCount}/${results.length}`);

    return {
      success: true,
      sent: successCount,
      total: results.length,
      results
    };
  } catch (error) {
    console.error('❌ Erro ao enviar notificações:', error);
    throw error;
  }
}

/**
 * Busca histórico de notificações de uma obrigação
 */
async function getObligationNotifications(obligationId) {
  return await prisma.obligationNotification.findMany({
    where: { obligationId },
    orderBy: { sentAt: 'desc' }
  });
}

/**
 * Busca histórico de visualizações de uma obrigação
 */
async function getObligationViews(obligationId) {
  return await prisma.obligationView.findMany({
    where: { obligationId },
    orderBy: { viewedAt: 'desc' }
  });
}

/**
 * Estatísticas de notificações e visualizações
 */
async function getNotificationStats(filters = {}) {
  const where = {};
  
  if (filters.startDate || filters.endDate) {
    where.sentAt = {};
    if (filters.startDate) where.sentAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.sentAt.lte = new Date(filters.endDate);
  }

  const [
    totalNotifications,
    sentNotifications,
    failedNotifications,
    totalViews,
    unviewedCount
  ] = await Promise.all([
    prisma.obligationNotification.count({ where }),
    prisma.obligationNotification.count({ 
      where: { ...where, emailStatus: 'sent' } 
    }),
    prisma.obligationNotification.count({ 
      where: { ...where, emailStatus: 'failed' } 
    }),
    prisma.obligationView.count(),
    // Contar obrigações sem visualizações
    prisma.obligation.count({
      where: {
        views: {
          none: {}
        }
      }
    })
  ]);

  return {
    notifications: {
      total: totalNotifications,
      sent: sentNotifications,
      failed: failedNotifications,
      pending: totalNotifications - sentNotifications - failedNotifications
    },
    views: {
      total: totalViews
    },
    unviewed: unviewedCount
  };
}

module.exports = {
  getUnviewedObligations,
  recordView,
  sendObligationNotification,
  getObligationNotifications,
  getObligationViews,
  getNotificationStats
};




