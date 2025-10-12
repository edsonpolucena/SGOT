const { prisma } = require('../../prisma');

/**
 * Cria um registro de log de auditoria
 * @param {Object} data - Dados do log
 * @param {string} data.userId - ID do usuário que executou a ação
 * @param {string} data.action - Tipo de ação (CREATE, UPDATE, DELETE, VIEW, DOWNLOAD, etc.)
 * @param {string} data.entity - Entidade afetada (Obligation, User, ObligationFile, Company, Auth)
 * @param {string} data.entityId - ID da entidade afetada
 * @param {Object} data.metadata - Metadados adicionais
 * @param {string} data.ipAddress - Endereço IP
 * @param {string} data.userAgent - User Agent do navegador
 */
async function createAuditLog(data) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null
      }
    });
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
    // Não falhar a operação principal se o log falhar
    return null;
  }
}

/**
 * Lista logs de auditoria com filtros
 * @param {Object} filters - Filtros de busca
 * @param {string} filters.userId - Filtrar por usuário
 * @param {string} filters.action - Filtrar por ação
 * @param {string} filters.entity - Filtrar por entidade
 * @param {string} filters.entityId - Filtrar por ID da entidade
 * @param {Date} filters.startDate - Data inicial
 * @param {Date} filters.endDate - Data final
 * @param {number} filters.page - Página (padrão: 1)
 * @param {number} filters.limit - Itens por página (padrão: 50)
 */
async function getAuditLogs(filters = {}) {
  const where = {};
  
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 50;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        // Não incluir a relação direta pois não criamos FK
        // Vamos buscar o nome do usuário depois
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  // Buscar nomes dos usuários
  const userIds = [...new Set(logs.map(log => log.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  // Adicionar informações do usuário aos logs
  const logsWithUsers = logs.map(log => {
    const user = userMap[log.userId];
    return {
      ...log,
      userName: user?.name || 'Usuário Desconhecido',
      userEmail: user?.email || 'N/A',
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    };
  });

  return {
    logs: logsWithUsers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Busca um log específico por ID
 */
async function getAuditLogById(id) {
  const log = await prisma.auditLog.findUnique({
    where: { id }
  });

  if (!log) {
    throw new Error('LOG_NOT_FOUND');
  }

  // Buscar informações do usuário
  const user = await prisma.user.findUnique({
    where: { id: log.userId },
    select: { id: true, name: true, email: true }
  });

  return {
    ...log,
    userName: user?.name || 'Usuário Desconhecido',
    userEmail: user?.email || 'N/A',
    metadata: log.metadata ? JSON.parse(log.metadata) : null
  };
}

/**
 * Estatísticas de auditoria
 */
async function getAuditStats(filters = {}) {
  const where = {};
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const [
    totalLogs,
    byAction,
    byEntity,
    byUser
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true
    }),
    prisma.auditLog.groupBy({
      by: ['entity'],
      where,
      _count: true
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10
    })
  ]);

  // Buscar nomes dos usuários mais ativos
  const topUserIds = byUser.map(u => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, email: true }
  });

  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  return {
    total: totalLogs,
    byAction: byAction.map(item => ({
      action: item.action,
      count: item._count
    })),
    byEntity: byEntity.map(item => ({
      entity: item.entity,
      count: item._count
    })),
    topUsers: byUser.map(item => ({
      userId: item.userId,
      userName: userMap[item.userId]?.name || 'Desconhecido',
      userEmail: userMap[item.userId]?.email || 'N/A',
      count: item._count
    }))
  };
}

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  getAuditStats
};

