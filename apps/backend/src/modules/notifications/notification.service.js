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

  // Buscar todas as obrigações (EXCLUIR NOT_APPLICABLE)
  const obligations = await prisma.obligation.findMany({
    where: {
      ...where,
      status: { not: 'NOT_APPLICABLE' } // 👈 Não mostra NOT_APPLICABLE
    },
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
            id: true,
            name: true,
            email: true
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

    // Email remetente: buscar o email da empresa de contabilidade (EMP001)
    const accountingCompany = await prisma.empresa.findUnique({
      where: { codigo: 'EMP001' },
      select: { email: true }
    });
    const fromEmail = accountingCompany?.email || process.env.EMAIL_FROM;
    
    // Email destinatário: email da EMPRESA cliente (não dos usuários)
    const toEmail = obligation.company.email;

    if (!toEmail) {
      console.warn(`⚠️  Empresa ${obligation.company.nome} sem email cadastrado`);
      return {
        success: false,
        sent: 0,
        total: 1,
        message: 'Empresa sem email cadastrado'
      };
    }

    console.log(`📧 Enviando notificação para empresa ${obligation.company.nome}...`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${toEmail}`);

    // Enviar email para o email da empresa cliente
    const emailResult = await sendNewDocumentNotification({
      from: fromEmail,
      to: toEmail,
      userName: companyName,
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
        sentTo: toEmail,
        sentBy,
        emailStatus: emailResult.success ? 'sent' : 'failed',
        emailError: emailResult.error || null
      }
    });

    if (emailResult.success) {
      console.log(`   ✅ Email enviado com sucesso para ${toEmail}`);
    } else {
      console.log(`   ❌ Falha ao enviar: ${emailResult.error}`);
    }
    
    return {
      success: emailResult.success,
      sent: emailResult.success ? 1 : 0,
      total: 1,
      results: [{
        email: toEmail,
        success: emailResult.success,
        notificationId: notification.id
      }]
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
 * Busca histórico de visualizações/downloads APENAS de usuários CLIENT (não contabilidade)
 * Retorna nome do usuário, data/hora e ação
 */
async function getClientViewsHistory(obligationId) {
  try {
    // Validar parâmetro
    if (!obligationId) {
      console.error('❌ obligationId é obrigatório');
      throw new Error('obligationId é obrigatório');
    }

    console.log(`📋 getClientViewsHistory chamado com obligationId: ${obligationId}`);

    // Buscar a obrigação para pegar o companyId
    const obligation = await prisma.obligation.findUnique({
      where: { id: obligationId },
      select: { companyId: true }
    });

    if (!obligation) {
      console.log(`⚠️ Obrigação ${obligationId} não encontrada`);
      return [];
    }

    // Buscar todas as views da obrigação
    const allViews = await prisma.obligationView.findMany({
      where: { obligationId },
      orderBy: { viewedAt: 'desc' }
    });

    // Se não há visualizações, retornar vazio
    if (allViews.length === 0) {
      console.log(`ℹ️ Nenhuma visualização encontrada para obrigação ${obligationId}`);
      return [];
    }

    // Buscar informações dos usuários que visualizaram
    // FILTRAR APENAS usuários CLIENT DA MESMA EMPRESA
    const userIds = [...new Set(allViews.map(v => v.viewedBy))];
    
    // Se não há userIds, retornar vazio (não deve acontecer, mas previne erro)
    if (userIds.length === 0) {
      console.log(`⚠️ Nenhum userId encontrado nas visualizações da obrigação ${obligationId}`);
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        role: {
          in: ['CLIENT_NORMAL', 'CLIENT_ADMIN']
        },
        companyId: obligation.companyId  // ← FILTRO POR EMPRESA
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true
      }
    });

  console.log(`📊 Histórico de visualizações da obrigação ${obligationId}:`);
  console.log(`   - Empresa: ${obligation.companyId}`);
  console.log(`   - Total de visualizações: ${allViews.length}`);
  console.log(`   - IDs de usuários que visualizaram:`, userIds);
  console.log(`   - Usuários CLIENT da empresa encontrados: ${users.length}`);
  users.forEach(u => {
    console.log(`      → ${u.email} (${u.role}) - companyId: ${u.companyId}`);
  });

  // Criar mapa de usuários
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  // Filtrar apenas views de clientes DA MESMA EMPRESA e formatar
  const clientViews = allViews
    .filter(view => {
      const hasUser = !!userMap[view.viewedBy];
      if (!hasUser) {
        console.log(`   ⚠️ View ${view.id} ignorada: usuário ${view.viewedBy} não é CLIENT da empresa ${obligation.companyId}`);
      }
      return hasUser;
    })
    .map(view => ({
      id: view.id,
      userName: userMap[view.viewedBy].name || userMap[view.viewedBy].email,
      userEmail: userMap[view.viewedBy].email,
      action: view.action, // VIEW ou DOWNLOAD
      viewedAt: view.viewedAt
    }));

    console.log(`   - Visualizações de clientes da empresa: ${clientViews.length}`);
    clientViews.forEach(cv => {
      console.log(`      → ${cv.userName} (${cv.userEmail}) - ${cv.action} em ${cv.viewedAt}`);
    });

    return clientViews;
  } catch (error) {
    console.error(`❌ Erro ao buscar histórico de clientes para obrigação ${obligationId}:`, error);
    throw error;
  }
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
  getClientViewsHistory,
  getNotificationStats
};




