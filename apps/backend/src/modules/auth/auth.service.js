const { prisma } = require('../../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');

async function registerUser(name, email, password, role = 'CLIENT', companyId = null) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('EMAIL_IN_USE');
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ 
    data: { 
      name, 
      email, 
      passwordHash, 
      role,
      companyId: companyId ? parseInt(companyId) : null
    } 
  });
  
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
      companyId: user.companyId
    }, 
    token 
  };
}

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');
  
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');
  
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
      companyId: user.companyId
    }, 
    token 
  };
}

module.exports = { registerUser, loginUser };
