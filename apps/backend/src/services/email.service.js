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
  if (!emailTransporter) return { success: false, error: 'SES SMTP não configurado' };

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

module.exports = {
  getTransporter,
  getDefaultFromEmail,
  sendEmail,
  sendNewDocumentNotification
};
