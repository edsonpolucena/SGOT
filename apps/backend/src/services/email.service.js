const nodemailer = require('nodemailer');
const { env } = require('../config/env');

/**
 * Configuração do AWS SES com Nodemailer
 * 
 * Variáveis de ambiente necessárias no .env:
 * AWS_SES_REGION=us-east-1
 * AWS_ACCESS_KEY_ID=sua_access_key
 * AWS_SECRET_ACCESS_KEY=sua_secret_key
 * EMAIL_FROM=noreply@seudominio.com
 */

let transporter = null;

/**
 * Inicializa o transporter do Nodemailer com AWS SES
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // Verificar se as credenciais AWS estão configuradas
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️  AWS SES não configurado. Emails não serão enviados.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      SES: {
        region: process.env.AWS_SES_REGION || 'us-east-1',
        aws: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      }
    });

    console.log('✅ AWS SES configurado com sucesso');
    return transporter;
  } catch (error) {
    console.error('❌ Erro ao configurar AWS SES:', error);
    return null;
  }
}

/**
 * Envia email usando AWS SES
 * @param {Object} options - Opções do email
 * @param {string} options.to - Email do destinatário
 * @param {string} options.subject - Assunto do email
 * @param {string} options.html - Conteúdo HTML do email
 * @param {string} options.text - Conteúdo texto do email (fallback)
 */
async function sendEmail({ to, subject, html, text }) {
  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    console.warn('Email não enviado (AWS SES não configurado):', { to, subject });
    return { success: false, error: 'AWS SES não configurado' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sgot.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Remove tags HTML se não tiver texto
    };

    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso:', {
      to,
      subject,
      messageId: info.messageId
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Envia email de notificação de novo documento
 */
async function sendNewDocumentNotification({ to, userName, companyName, docType, competence, dueDate, uploadedBy }) {
  const dueDateFormatted = new Date(dueDate).toLocaleDateString('pt-BR');

  const subject = `Novo Documento Disponível - ${docType} ${competence}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
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
        <div class="header">
          <h1>📄 Novo Documento Disponível</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Um novo documento foi postado para <strong>${companyName}</strong> e está aguardando sua visualização.</p>
          
          <div class="card">
            <h3 style="margin-top: 0; color: #667eea;">Detalhes do Documento</h3>
            <div class="info-row">
              <span class="info-label">Tipo:</span>
              <span class="info-value">${docType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Competência:</span>
              <span class="info-value">${competence}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Vencimento:</span>
              <span class="info-value">${dueDateFormatted}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">Postado por:</span>
              <span class="info-value">${uploadedBy}</span>
            </div>
          </div>

          <div class="alert">
            <strong>⚠️ Atenção:</strong> Este documento possui data de vencimento. Acesse o sistema para visualizar e tomar as ações necessárias.
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
              Acessar Sistema
            </a>
          </div>

          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>Sistema de Gestão de Obrigações Tributárias - SGOT</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
}

module.exports = {
  sendEmail,
  sendNewDocumentNotification,
  getTransporter
};



