const { prisma } = require('../../prisma');
const bcrypt = require('bcryptjs');
const { sanitizeString } = require('../../utils/obligation.utils');

async function getUsers(filters = {}, requestUser) {
  const where = {};

  if (requestUser.role === 'CLIENT_ADMIN') {
    where.companyId = requestUser.companyId;
  }

  if (filters.companyId && requestUser.role.startsWith('ACCOUNTING_')) {
    where.companyId = parseInt(filters.companyId);
  }

  if (filters.status) {
    where.status = filters.status;
  }

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

  if (requestUser.role === 'CLIENT_ADMIN' && user.companyId !== requestUser.companyId) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

async function updateUser(userId, data, requestUser) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true, role: true, email: true }
  });

  if (!existingUser) {
    throw new Error('USER_NOT_FOUND');
  }

  if (requestUser.role === 'CLIENT_ADMIN' && existingUser.companyId !== requestUser.companyId) {
    throw new Error('FORBIDDEN');
  }

  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (emailExists) {
      throw new Error('EMAIL_IN_USE');
    }
  }

  const updateData = {};

  if (data.name !== undefined) updateData.name = data.name ? sanitizeString(data.name, 100) : data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) {
    if (requestUser.role === 'CLIENT_ADMIN' && data.role.startsWith('ACCOUNTING_')) {
      throw new Error('FORBIDDEN_ROLE_CHANGE');
    }
    updateData.role = data.role;
  }
  if (data.status !== undefined) updateData.status = data.status;
  if (data.companyId !== undefined) updateData.companyId = data.companyId;

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

async function updateUserStatus(userId, newStatus, requestUser) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true, status: true }
  });

  if (!existingUser) {
    throw new Error('USER_NOT_FOUND');
  }

  if (requestUser.role === 'CLIENT_ADMIN' && existingUser.companyId !== requestUser.companyId) {
    throw new Error('FORBIDDEN');
  }

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

async function deleteUser(userId, requestUser) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true }
  });

  if (!existingUser) {
    throw new Error('USER_NOT_FOUND');
  }

  if (requestUser.role === 'CLIENT_ADMIN' && existingUser.companyId !== requestUser.companyId) {
    throw new Error('FORBIDDEN');
  }

  if (userId === requestUser.id) {
    throw new Error('CANNOT_DELETE_SELF');
  }

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














