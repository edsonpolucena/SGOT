const { registerUser, loginUser } = require('./auth.service');
const { prisma } = require('../../prisma');

async function postRegister(req, res) {
  try {
    const { name, email, password, role, companyId } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });
    
    if (role && !['ACCOUNTING', 'CLIENT'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be ACCOUNTING or CLIENT' });
    }
    
    const result = await registerUser(name, email, password, role, companyId);
    return res.status(201).json(result);
  } catch (err) {
    if (err.message === 'EMAIL_IN_USE') return res.status(409).json({ message: 'Email already in use' });
    return res.status(500).json({ message: 'Internal error' });
  }
}

async function postLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });
    const result = await loginUser(email, password);
    return res.status(200).json(result);
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') return res.status(401).json({ message: 'Invalid credentials' });
    return res.status(500).json({ message: 'Internal error' });
  }
}

async function getMe(req, res) {
  const user = await prisma.user.findUnique({ 
    where: { id: req.userId },
    include: {
      company: {
        select: { id: true, codigo: true, nome: true, cnpj: true }
      }
    }
  });
  if (!user) return res.status(404).json({ message: 'Not found' });
  
  return res.json({ 
    id: user.id, 
    name: user.name, 
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    company: user.company
  });
}

module.exports = { postRegister, postLogin, getMe };
