const { prisma } = require('../../prisma');
const bcrypt = require('bcryptjs');

/**
 * Lista usuários com filtros opcionais
 * @param {Object} filters - Filtros (companyId, status, role)
 * @param {Object} requestUser - Usuário que fez a requisição
 */
async function getUsers(filters = {}, requestUser) {
  const where = {};

  // Se for CLIENT_ADMIN, só pode ver usuários da própria empresa
  if (requestUser.role === 'CLIENT_ADMIN') {
    where.companyId = requestUser.companyId;
  }

  // Se for contabilidade, pode filtrar por empresa
  if (filters.companyId && requestUser.role.startsWith('ACCOUNTING_')) {
    where.companyId = parseInt(filters.companyId);
  }

  // Filtro por status
  if (filters.status) {
    where.status = filters.status;
  }

  // Filtro por role
  if (filters.role) {
    where.role = filters.role;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          cnpj: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return users;
}

/**
 * Busca um usuário por ID
 * @param {string} userId - ID do usuário
 * @param {Object} requestUser - Usuário que fez a requisição
 */
async function getUserById(userId, requestUser) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          cnpj: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // CLIENT_ADMIN só pode ver usuários da própria empresa
  if (requestUser.role === 'CLIENT_ADMIN' && user.companyId !== requestUser.companyId) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

/**
 * Atualiza um usuário
 * @param {string} userId - ID do usuário
 * @param {Object} data - Dados para atualizar
 * @param {Object} requestUser - Usuário que fez a requisição
 */
async function updateUser(userId, data, requestUser) {
  // Buscar usuário primeiro
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true, role: true, email: true }
  });

  if (!existingUser) {
    throw new Error('USER_NOT_FOUND');
  }

  // CLIENT_ADMIN só pode editar usuários da própria empresa
  if (requestUser.role === 'CLIENT_ADMIN' && existingUser.companyId !== requestUser.companyId) {
    throw new Error('FORBIDDEN');
  }

  // Validar se email já existe (se estiver sendo alterado)
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (emailExists) {
      throw new Error('EMAIL_IN_USE');
    }
  }

  // Preparar dados para atualização
  const updateData = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) {
    // CLIENT_ADMIN não pode alterar role para roles de contabilidade
    if (requestUser.role === 'CLIENT_ADMIN' && data.role.startsWith('ACCOUNTING_')) {
      throw new Error('FORBIDDEN_ROLE_CHANGE');
    }
    updateData.role = data.role;
  }
  if (data.status !== undefined) updateData.status = data.status;
  if (data.companyId !== undefined) updateData.companyId = data.companyId;

  // Se houver nova senha, fazer hash
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      companyId: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          cnpj: true
        }
      }
    }
  });

  return updatedUser;
}

/**
 * Altera apenas o status de um usuário (ACTIVE/INACTIVE)
 * @param {string} userId - ID do usuário
 * @param {string} newStatus - Novo status (ACTIVE ou INACTIVE)
 * @param {Object} requestUser - Usuário que fez a requisição
 */
async function updateUserStatus(userId, newStatus, requestUser) {
  // Buscar usuário primeiro
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true, status: true }
  });

  if (!existingUser) {
    throw new Error('USER_NOT_FOUND');
  }

  // CLIENT_ADMIN só pode alterar status de usuários da própria empresa
  if (requestUser.role === 'CLIENT_ADMIN' && existingUser.companyId !== requestUser.companyId) {
    throw new Error('FORBIDDEN');
  }

  // Não permitir que usuário desative a si mesmo
  if (userId === requestUser.id) {
    throw new Error('CANNOT_DEACTIVATE_SELF');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      companyId: true,
      updatedAt: true
    }
  });

  return updatedUser;
}

/**
 * Deleta um usuário (soft delete - apenas inativa)
 * @param {string} userId - ID do usuário
 * @param {Object} requestUser - Usuário que fez a requisição
 */
async function deleteUser(userId, requestUser) {
  // Buscar usuário primeiro
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true }
  });

  if (!existingUser) {
    throw new Error('USER_NOT_FOUND');
  }

  // CLIENT_ADMIN só pode deletar usuários da própria empresa
  if (requestUser.role === 'CLIENT_ADMIN' && existingUser.companyId !== requestUser.companyId) {
    throw new Error('FORBIDDEN');
  }

  // Não permitir que usuário delete a si mesmo
  if (userId === requestUser.id) {
    throw new Error('CANNOT_DELETE_SELF');
  }

  // Soft delete: apenas inativa o usuário
  await prisma.user.update({
    where: { id: userId },
    data: { status: 'INACTIVE' }
  });

  return { message: 'Usuário desativado com sucesso' };
}

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser
};












