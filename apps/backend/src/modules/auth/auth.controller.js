const { registerUser, loginUser } = require('./auth.service');
const { prisma } = require('../../prisma');

async function postRegister(req, res) {
  try {
    const { name, email, password, role, companyId, status } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });

    // Se há um usuário autenticado (req.user), é um admin criando usuário, não gera token
    // Se não há usuário autenticado, é auto-registro (público), gera token
    const generateToken = !req.user;

    const result = await registerUser(name, email, password, role, companyId, status, generateToken);
    return res.status(201).json(result);
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    if (err.message === 'EMAIL_IN_USE')
      return res.status(409).json({ message: 'Email já em uso' });
    return res.status(500).json({ message: 'Erro interno', error: err.message });
  }
}

async function postLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    const result = await loginUser(email, password);
    return res.status(200).json(result);
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS')
      return res.status(401).json({ message: 'Credenciais inválidas' });
    if (err.message === 'USER_INACTIVE')
      return res.status(403).json({ message: 'Usuário inativo' });
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
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
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    companyId: user.companyId,
    company: user.company
  });
}

module.exports = { postRegister, postLogin, getMe };
