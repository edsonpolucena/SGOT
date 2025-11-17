// apps/backend/src/services/email.service.js
const nodemailer = require('nodemailer');
const { prisma } = require('../prisma');

let transporter = null;

// cache do remetente padrão vindo do BD (Empresa "contabilidade")
let cachedDefaultFrom = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function getDefaultFromEmail() {
  const now = Date.now();
  if (cachedDefaultFrom && (now - cachedAt) < CACHE_TTL_MS) {
    return cachedDefaultFrom;
  }

  const defaultCompanyId = Number(process.env.COMPANY_DEFAULT_ID || 0);
  if (!defaultCompanyId) return null;

  const company = await prisma.empresa.findUnique({
    where: { id: defaultCompanyId },
    select: { email: true }
  });

  const email = company?.email?.trim() || null;
  if (email) {
    cachedDefaultFrom = email;
    cachedAt = now;
  }
  return email;
}

/**
 * Inicializa o transporter do Nodemailer com AWS SES via SMTP
 * Requer no .env:
 *  - SES_HOST, SES_PORT, SES_SECURE
 *  - SES_SMTP_USER, SES_SMTP_PASS
 *  - AWS_SES_REGION (opcional; usado só se SES_HOST não for definido)
 */
function getTransporter() {
  if (transporter) return transporter;

  // Se EMAIL_ENABLED=false no .env, não envia emails (útil em desenvolvimento)
  if (process.env.EMAIL_ENABLED === 'false') {
    console.warn('⚠️  Envio de emails DESABILITADO (EMAIL_ENABLED=false)');
    return null;
  }

  const smtpUser = process.env.SES_SMTP_USER;
  const smtpPass = process.env.SES_SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn('⚠️  SES SMTP não configurado. Defina SES_SMTP_USER e SES_SMTP_PASS no .env');
    return null;
  }

  const host =
    process.env.SES_HOST ||
    `email-smtp.${process.env.AWS_SES_REGION || 'sa-east-1'}.amazonaws.com`;

  const port = Number(process.env.SES_PORT || 587);
  const secure = String(process.env.SES_SECURE || 'false') === 'true';

  transporter = nodemailer.createTransport({
    host,
    port,
    secure, // false para 587 (STARTTLS), true para 465 (TLS direto)
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
    // opcional: tls: { minVersion: 'TLSv1.2' }
  });

  console.log('✅ AWS SES (SMTP) configurado com sucesso');
  return transporter;
}

/**
 * Envia email usando AWS SES (SMTP)
 * @param {Object} options
 * @param {string} [options.from] - Remetente (se não informar, busca no BD; fallback em EMAIL_FROM)
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 * @param {string} [options.replyTo]
 */
async function sendEmail({ from, to, subject, html, text, replyTo }) {
  const emailTransporter = getTransporter();
  if (!emailTransporter) {
    console.log('⚠️  Email não enviado: transporter não configurado');
    return { success: false, error: 'SES SMTP não configurado' };
  }

  // prioridade: parâmetro > banco (empresa padrão) > .env
  const dbFrom = await getDefaultFromEmail();
  const finalFrom = (from && from.trim()) || dbFrom || process.env.EMAIL_FROM;


  // Remove HTML tags de forma segura (sem ReDoS)
  // Implementação O(n) sem regex complexas para evitar backtracking
  const stripHtmlTags = (str) => {
    if (!str) return '';
    
    let result = '';
    let insideTag = false;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (char === '<') {
        insideTag = true;
      } else if (char === '>') {
        insideTag = false;
        result += ' '; // Adiciona espaço no lugar da tag
      } else if (!insideTag) {
        result += char;
      }
    }
    
    // Remove espaços múltiplos e trim
    return result.split(/\s+/).filter(Boolean).join(' ');
  };

  const mailOptions = {
    from: finalFrom,
    to,
    subject,
    html,
    text: text || stripHtmlTags(html),
    ...(replyTo ? { replyTo } : {})
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', { from: finalFrom, to, subject, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia email de notificação de novo documento
 */
async function sendNewDocumentNotification({ from, to, userName, companyName, docType, competence, dueDate, uploadedBy, replyTo }) {
  const dueDateFormatted = new Date(dueDate).toLocaleDateString('pt-BR');

  const subject = `Novo Documento Disponível - ${docType} ${competence}`;
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .info-label { font-weight: bold; color: #6c757d; }
        .info-value { color: #333; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>📄 Novo Documento Disponível</h1></div>
        <div class="content">
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Um novo documento foi postado para <strong>${companyName}</strong> e está aguardando sua visualização.</p>
          <div class="card">
            <h3 style="margin-top: 0; color: #667eea;">Detalhes do Documento</h3>
            <div class="info-row"><span class="info-label">Tipo:</span><span class="info-value">${docType}</span></div>
            <div class="info-row"><span class="info-label">Competência:</span><span class="info-value">${competence}</span></div>
            <div class="info-row"><span class="info-label">Vencimento:</span><span class="info-value">${dueDateFormatted}</span></div>
            <div class="info-row" style="border-bottom: none;"><span class="info-label">Postado por:</span><span class="info-value">${uploadedBy}</span></div>
          </div>
          <div class="alert"><strong>⚠️ Atenção:</strong> Este documento possui data de vencimento. Acesse o sistema para visualizar e tomar as ações necessárias.</div>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Acessar Sistema</a>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>Sistema de Gestão de Obrigações Tributárias - SGOT</p>
          </div>
        </div>
      </div>
    </body></html>
  `;

  return await sendEmail({ from, to, subject, html, replyTo });
}

/**
 * Envia email com link para redefinição de senha
 */
async function sendPasswordResetEmail({ to, userName, resetLink, expiresInMinutes = 60 }) {
  const from = getDefaultFromEmail();
  const subject = '🔐 Recuperação de Senha - SGOT';
  
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.85em; }
        .info { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Recuperação de Senha</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>SGOT</strong>.</p>
          
          <div class="card">
            <p style="margin-bottom: 20px;">Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetLink}" class="button">Redefinir Senha</a>
          </div>

          <div class="info">
            <strong>ℹ️ Informações Importantes:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Este link expira em <strong>${expiresInMinutes} minutos</strong></li>
              <li>Após utilizado, o link não poderá ser usado novamente</li>
              <li>Se você não solicitou esta alteração, ignore este email</li>
            </ul>
          </div>

          <div class="warning">
            <strong>⚠️ Segurança:</strong> Se você não solicitou a recuperação de senha, sua conta pode estar sendo alvo de tentativa de acesso não autorizado. Neste caso, recomendamos alterar sua senha imediatamente após fazer login.
          </div>

          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p style="margin-top: 10px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
            <p style="font-size: 0.8em; word-break: break-all; color: #667eea;">${resetLink}</p>
            <p style="margin-top: 20px;">Sistema de Gestão de Obrigações Tributárias - SGOT</p>
          </div>
        </div>
      </div>
    </body></html>
  `;

  return await sendEmail({ from, to, subject, html });
}

/**
 * Envia email de confirmação após senha alterada
 */
async function sendPasswordChangedConfirmation({ to, userName }) {
  const from = getDefaultFromEmail();
  const subject = '✅ Senha Alterada com Sucesso - SGOT';
  
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
        .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.85em; }
        .success-icon { font-size: 48px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Senha Alterada</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${userName}</strong>,</p>
          
          <div class="card">
            <div class="success-icon">🎉</div>
            <h2 style="color: #10b981; margin: 10px 0;">Sucesso!</h2>
            <p>Sua senha foi alterada com sucesso.</p>
            <p style="color: #6c757d; font-size: 0.9em;">Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Fazer Login</a>
          </div>

          <div class="warning">
            <strong>⚠️ Você não fez esta alteração?</strong>
            <p style="margin: 10px 0;">Se você não solicitou a mudança de senha, sua conta pode ter sido comprometida. Entre em contato com o suporte imediatamente.</p>
          </div>

          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p style="margin-top: 20px;">Sistema de Gestão de Obrigações Tributárias - SGOT</p>
          </div>
        </div>
      </div>
    </body></html>
  `;

  return await sendEmail({ from, to, subject, html });
}

/**
 * Envia lembrete de documento não visualizado (3 dias antes do vencimento)
 */
async function sendDocumentReminderEmail({ to, companyName, obligations }) {
  const from = getDefaultFromEmail();
  const subject = `⏰ Lembrete: ${obligations.length} documento(s) próximos do vencimento`;
  
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b; }
        .doc-title { font-weight: bold; color: #1f2937; font-size: 16px; margin-bottom: 8px; }
        .doc-info { color: #6b7280; font-size: 14px; margin: 4px 0; }
        .urgent { border-left-color: #dc2626 !important; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.85em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Documentos Pendentes de Visualização</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${companyName}</strong>!</p>
          <p>Os seguintes documentos foram postados pela contabilidade e ainda não foram visualizados. <strong>Alguns vencem em até 3 dias:</strong></p>
          
          ${obligations.map(obl => {
            const daysRemaining = Math.ceil((new Date(obl.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysRemaining <= 2;
            
            return `
              <div class="card ${isUrgent ? 'urgent' : ''}">
                <div class="doc-title">${isUrgent ? '🚨 ' : '📄 '}${obl.taxType || obl.title}</div>
                <div class="doc-info">📅 Vencimento: ${new Date(obl.dueDate).toLocaleDateString('pt-BR')} (em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''})</div>
                <div class="doc-info">📤 Postado há: ${Math.ceil((new Date() - new Date(obl.createdAt)) / (1000 * 60 * 60 * 24))} dia(s)</div>
              </div>
            `;
          }).join('')}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Visualizar Documentos</a>
          </div>

          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p style="margin-top: 20px;">Sistema de Gestão de Obrigações Tributárias - SGOT</p>
          </div>
        </div>
      </div>
    </body></html>
  `;

  return await sendEmail({ from, to, subject, html });
}

/**
 * Envia alerta de documentos não visualizados por mais de 2 dias
 */
async function sendUnviewedDocumentAlert({ to, userName, obligations }) {
  const from = getDefaultFromEmail();
  const subject = `🚨 Alerta: ${obligations.length} documento(s) não visualizado(s)`;
  
  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .card { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #dc2626; }
        .doc-title { font-weight: bold; color: #1f2937; font-size: 15px; margin-bottom: 6px; }
        .doc-info { color: #6b7280; font-size: 13px; margin: 3px 0; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.85em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Documentos Não Visualizados</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${userName}</strong>,</p>
          
          <div class="alert-box">
            <strong style="color: #991b1b;">⚠️ AÇÃO NECESSÁRIA</strong>
            <p style="margin: 10px 0; color: #991b1b;">Os documentos abaixo foram postados há mais de 2 dias e ainda não foram visualizados. Por favor, acesse o sistema urgentemente.</p>
          </div>

          ${obligations.map(obl => {
            const daysPosted = Math.ceil((new Date() - new Date(obl.createdAt)) / (1000 * 60 * 60 * 24));
            const daysUntilDue = Math.ceil((new Date(obl.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
              <div class="card">
                <div class="doc-title">${obl.taxType || obl.title}</div>
                <div class="doc-info">🏢 Empresa: ${obl.companyName}</div>
                <div class="doc-info">📤 Postado há: <strong>${daysPosted} dia(s)</strong></div>
                <div class="doc-info">📅 Vencimento: ${new Date(obl.dueDate).toLocaleDateString('pt-BR')} ${daysUntilDue > 0 ? `(em ${daysUntilDue} dia(s))` : '(VENCIDO)'}</div>
              </div>
            `;
          }).join('')}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Visualizar Agora</a>
          </div>

          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p style="margin-top: 20px;">Sistema de Gestão de Obrigações Tributárias - SGOT</p>
          </div>
        </div>
      </div>
    </body></html>
  `;

  return await sendEmail({ from, to, subject, html });
}

module.exports = {
  getTransporter,
  getDefaultFromEmail,
  sendEmail,
  sendNewDocumentNotification,
  sendPasswordResetEmail,
  sendPasswordChangedConfirmation,
  sendDocumentReminderEmail,
  sendUnviewedDocumentAlert
};
