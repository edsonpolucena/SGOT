const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { prisma } = require('../prisma');

async function requireAuth(req, res, next) {
  const h = req.header('Authorization');
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
  
  try {
    const t = h.replace('Bearer ', '');
    const p = jwt.verify(t, env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: p.sub },
      select: { id: true, email: true, name: true, role: true, companyId: true }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = { requireAuth };
