const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = new PrismaClient();
const emailService = require('../../services/email.service');

/**
 * Gera um token de recuperação de senha e envia email
 */
async function requestPasswordReset(email) {
  // Verifica se usuário existe
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Por segurança, não revelamos se o email existe ou não
    return { 
      success: true, 
      message: 'Se o email existir, você receberá instruções para redefinir sua senha.' 
    };
  }

  // Verifica se usuário está ativo
  if (user.status !== 'ACTIVE') {
    throw new Error('Usuário inativo. Contate o administrador.');
  }

  // Gera token seguro (hex não tem caracteres especiais, ideal para URLs)
  const token = crypto.randomBytes(32).toString('hex');
  
  // Token expira em 1 hora
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Salva token no banco
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
      used: false
    }
  });

  // Monta link de redefinição
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  // Log para debug (remover em produção se necessário)
  console.log('🔗 Link de reset gerado:', resetLink);
  console.log('📧 Enviando email para:', user.email);

  // Envia email
  try {
    await emailService.sendPasswordResetEmail({
      to: user.email,
      userName: user.name || user.email,
      resetLink,
      expiresInMinutes: 60
    });
  } catch (emailError) {
    console.error('Erro ao enviar email de recuperação:', emailError);
    // Mesmo com erro no email, não falhamos a requisição por segurança
  }

  return { 
    success: true, 
    message: 'Se o email existir, você receberá instruções para redefinir sua senha.' 
  };
}

/**
 * Valida se um token é válido
 */
async function validateResetToken(token) {
  try {
    console.log('[validateResetToken] Iniciando validação do token:', token?.substring(0, 10) + '...');
    
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            email: true,
            status: true
          }
        }
      }
    });

    console.log('[validateResetToken] Token encontrado:', !!resetToken);

    if (!resetToken) {
      console.log('[validateResetToken] Token não existe no banco');
      return { valid: false, reason: 'Token inválido' };
    }

    console.log('[validateResetToken] Token usado:', resetToken.used);
    console.log('[validateResetToken] Token expira em:', resetToken.expiresAt);
    console.log('[validateResetToken] Data atual:', new Date());

    if (resetToken.used) {
      console.log('[validateResetToken] Token já foi utilizado');
      return { valid: false, reason: 'Token já foi utilizado' };
    }

    if (new Date() > resetToken.expiresAt) {
      console.log('[validateResetToken] Token expirado');
      return { valid: false, reason: 'Token expirado' };
    }

    if (resetToken.user.status !== 'ACTIVE') {
      console.log('[validateResetToken] Usuário inativo');
      return { valid: false, reason: 'Usuário inativo' };
    }

    // Mascara o email (ex: u***@example.com)
    const email = resetToken.user.email;
    const [localPart, domain] = email.split('@');
    const maskedEmail = localPart[0] + '***@' + domain;

    console.log('[validateResetToken] Token válido, email mascarado:', maskedEmail);

    return { 
      valid: true, 
      email: maskedEmail 
    };
  } catch (error) {
    console.error('[validateResetToken] ERRO ao validar token:', error);
    throw error; // Propaga o erro para o controller tratar
  }
}

/**
 * Redefine a senha do usuário
 */
async function resetPassword(token, newPassword) {
  // Valida token
  const validation = await validateResetToken(token);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  // Busca token com userId
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  // Valida senha
  if (!newPassword || newPassword.length < 6) {
    throw new Error('A senha deve ter no mínimo 6 caracteres');
  }

  // Hash da nova senha
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Atualiza senha do usuário e marca token como usado
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    })
  ]);

  // Busca informações do usuário para enviar email de confirmação
  const user = await prisma.user.findUnique({
    where: { id: resetToken.userId },
    select: { email: true, name: true }
  });

  // Envia email de confirmação
  try {
    await emailService.sendPasswordChangedConfirmation({
      to: user.email,
      userName: user.name || user.email
    });
  } catch (emailError) {
    console.error('Erro ao enviar email de confirmação:', emailError);
    // Não falha a operação se o email não for enviado
  }

  return { 
    success: true, 
    message: 'Senha redefinida com sucesso!' 
  };
}

/**
 * Limpa tokens expirados (para executar periodicamente)
 */
async function cleanExpiredTokens() {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true }
      ]
    }
  });

  console.log(`🗑️ ${result.count} tokens de recuperação removidos`);
  return result.count;
}

module.exports = {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  cleanExpiredTokens
};

