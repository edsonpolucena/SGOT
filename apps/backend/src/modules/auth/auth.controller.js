const { registerUser, loginUser } = require('./auth.service');
const { requestPasswordReset, validateResetToken, resetPassword } = require('./password-reset.service');
const { prisma } = require('../../prisma');
const { logAudit } = require('../../utils/audit.helper');

async function postRegister(req, res) {
  try {
    const { name, email, password, role, companyId, status } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });

    // Se há um usuário autenticado (req.user), é um admin criando usuário, não gera token
    // Se não há usuário autenticado, é auto-registro (público), gera token
    const generateToken = !req.user;

    const result = await registerUser(name, email, password, role, companyId, status, generateToken);
    
    // Log de auditoria (se há usuário autenticado criando outro usuário)
    if (req.user) {
      await logAudit(req, 'CREATE', 'User', result.user.id, { email, role });
    }
    
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
    
    // Log de auditoria (criar um req mock para o logAudit funcionar)
    const mockReq = {
      ...req,
      userId: result.user.id,
      user: { id: result.user.id }
    };
    await logAudit(mockReq, 'LOGIN', 'Auth', result.user.id, { email });
    
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
      },
      consentLog: {
        select: {
          consentAccepted: true,
          consentDate: true
        }
      }
    }
  });
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

  const hasConsent = user.consentLog?.consentAccepted === true;

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    companyId: user.companyId,
    company: user.company,
    hasConsent: hasConsent,
    consentAccepted: user.consentLog?.consentAccepted ?? null
  });
}

/**
 * POST /api/auth/forgot-password
 * Solicita recuperação de senha (envia email)
 */
async function postForgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    const result = await requestPasswordReset(email);
    
    return res.status(200).json(result);
  } catch (err) {
    console.error('Erro em forgot-password:', err);
    if (err.message.includes('inativo')) {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Erro interno' });
  }
}

/**
 * GET /api/auth/validate-reset-token/:token
 * Valida se um token de recuperação é válido
 */
async function getValidateResetToken(req, res) {
  try {
    let { token } = req.params;

    if (!token) {
      return res.status(400).json({ valid: false, reason: 'Token não fornecido' });
    }

    // Decode o token caso venha encodado da URL
    token = decodeURIComponent(token);

    console.log('🔍 Validando token de reset:', token.substring(0, 10) + '...');
    const result = await validateResetToken(token);
    
    if (!result.valid) {
      console.log('❌ Token inválido:', result.reason);
    } else {
      console.log('✅ Token válido');
    }
    
    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ Erro ao validar token:', err);
    console.error('❌ Stack trace:', err.stack);
    return res.status(500).json({ valid: false, reason: 'Erro interno ao validar token' });
  }
}

/**
 * POST /api/auth/reset-password
 * Redefine a senha usando o token
 */
async function postResetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
    }

    const result = await resetPassword(token, newPassword);
    
    return res.status(200).json(result);
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    if (err.message.includes('Token') || err.message.includes('senha')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Erro interno' });
  }
}

module.exports = { 
  postRegister, 
  postLogin, 
  getMe,
  postForgotPassword,
  getValidateResetToken,
  postResetPassword
};
