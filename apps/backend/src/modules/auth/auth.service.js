const { prisma } = require('../../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');

async function registerUser(name, email, password, role = 'CLIENT_NORMAL', companyId = null, status = 'ACTIVE', generateToken = true) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('EMAIL_IN_USE');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      status,
      companyId: companyId ? parseInt(companyId) : null
    }
  });

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    companyId: user.companyId
  };

  // Se generateToken for false, retorna apenas o usuário (usado quando admin cria usuário)
  if (!generateToken) {
    return { user: userData };
  }

  // Gera token apenas para auto-registro
  const token = jwt.sign(
    { role: user.role, companyId: user.companyId },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: '7d' }
  );

  return {
    user: userData,
    token
  };
}

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');

  // Bloqueia login de usuário inativo
  if (user.status !== 'ACTIVE') throw new Error('USER_INACTIVE');

  const token = jwt.sign(
    { role: user.role, companyId: user.companyId },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      companyId: user.companyId
    },
    token
  };
}

module.exports = { registerUser, loginUser };
