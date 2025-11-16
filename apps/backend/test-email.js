/**
 * Script de Teste - Email AWS SES
 * 
 * Execute: node test-email.js
 */

require('dotenv').config();

const { sendEmail, sendNewDocumentNotification } = require('./src/services/email.service');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEmailConfiguration() {
  log('cyan', '\n========================================');
  log('cyan', '🧪 TESTE DE CONFIGURAÇÃO DE EMAIL');
  log('cyan', '========================================\n');

  // Verificar variáveis de ambiente
  log('blue', '📋 Verificando variáveis de ambiente...\n');
  
  const envVars = {
    'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY,
    'AWS_SES_REGION': process.env.AWS_SES_REGION,
    'EMAIL_FROM': process.env.EMAIL_FROM,
    'FRONTEND_URL': process.env.FRONTEND_URL
  };

  let allConfigured = true;
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      log('green', `✅ ${key}: ${key.includes('SECRET') ? '***' : value}`);
    } else {
      log('red', `❌ ${key}: NÃO CONFIGURADA`);
      allConfigured = false;
    }
  }

  console.log('');

  if (!allConfigured) {
    log('yellow', '⚠️  ATENÇÃO: AWS SES não está totalmente configurado.');
    log('yellow', '   O sistema funcionará, mas emails NÃO serão enviados.');
    log('yellow', '   Consulte AWS_SES_SETUP.md para instruções.\n');
    return false;
  }

  log('green', '✅ Todas as variáveis estão configuradas!\n');
  return true;
}

async function testSimpleEmail() {
  log('cyan', '========================================');
  log('cyan', '📧 TESTE 1: Email Simples');
  log('cyan', '========================================\n');

  const testEmail = process.argv[2] || 'seu-email@teste.com';
  
  log('blue', `Enviando email de teste para: ${testEmail}`);
  log('yellow', 'Aguarde...\n');

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'Teste AWS SES - SGOT',
      html: '<h1>✅ Funcionou!</h1><p>Se você recebeu este email, o AWS SES está configurado corretamente!</p>',
      text: 'Funcionou! Se você recebeu este email, o AWS SES está configurado corretamente!'
    });

    if (result.success) {
      log('green', '✅ Email enviado com sucesso!');
      log('green', `   Message ID: ${result.messageId}\n`);
      log('blue', '📬 Verifique sua caixa de entrada (e spam/lixeira)');
    } else {
      log('red', '❌ Falha ao enviar email');
      log('red', `   Erro: ${result.error}\n`);
    }

    return result.success;
  } catch (error) {
    log('red', `❌ Erro ao enviar email: ${error.message}\n`);
    return false;
  }
}

async function testNotificationEmail() {
  log('cyan', '\n========================================');
  log('cyan', '📧 TESTE 2: Email de Notificação');
  log('cyan', '========================================\n');

  const testEmail = process.argv[2] || 'seu-email@teste.com';
  
  log('blue', `Enviando email de notificação para: ${testEmail}`);
  log('yellow', 'Aguarde...\n');

  try {
    const result = await sendNewDocumentNotification({
      to: testEmail,
      userName: 'Usuário Teste',
      companyName: 'Empresa Teste Ltda',
      docType: 'DARF',
      competence: '12/2024',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      uploadedBy: 'João da Contabilidade'
    });

    if (result.success) {
      log('green', '✅ Email de notificação enviado com sucesso!');
      log('green', `   Message ID: ${result.messageId}\n`);
      log('blue', '📬 Verifique sua caixa de entrada (e spam/lixeira)');
      log('blue', '   O email deve ter um visual profissional com:');
      log('blue', '   - Gradiente no cabeçalho');
      log('blue', '   - Detalhes do documento');
      log('blue', '   - Alerta de vencimento');
      log('blue', '   - Botão para acessar o sistema');
    } else {
      log('red', '❌ Falha ao enviar email de notificação');
      log('red', `   Erro: ${result.error}\n`);
    }

    return result.success;
  } catch (error) {
    log('red', `❌ Erro ao enviar email: ${error.message}\n`);
    return false;
  }
}

async function main() {
  log('cyan', '\n╔════════════════════════════════════════╗');
  log('cyan', '║  TESTE DE EMAIL - SGOT                ║');
  log('cyan', '╚════════════════════════════════════════╝\n');

  // Verificar argumentos
  const email = process.argv[2];
  if (!email) {
    log('yellow', '⚠️  ATENÇÃO: Nenhum email fornecido!');
    log('yellow', '   Uso: node test-email.js seu-email@exemplo.com\n');
    log('blue', 'Continuando com email de teste padrão...\n');
  }

  // Executar testes
  const isConfigured = await testEmailConfiguration();
  
  if (!isConfigured) {
    log('red', '\n❌ Testes de envio cancelados (AWS SES não configurado)');
    log('yellow', '   Configure o AWS SES primeiro seguindo AWS_SES_SETUP.md\n');
    process.exit(1);
  }

  const test1 = await testSimpleEmail();
  const test2 = await testNotificationEmail();

  // Resumo
  log('cyan', '\n========================================');
  log('cyan', '📊 RESUMO DOS TESTES');
  log('cyan', '========================================\n');

  log(test1 ? 'green' : 'red', `${test1 ? '✅' : '❌'} Email Simples: ${test1 ? 'PASSOU' : 'FALHOU'}`);
  log(test2 ? 'green' : 'red', `${test2 ? '✅' : '❌'} Email Notificação: ${test2 ? 'PASSOU' : 'FALHOU'}`);

  if (test1 && test2) {
    log('green', '\n🎉 Todos os testes passaram!');
    log('green', '   Seu AWS SES está configurado corretamente.\n');
    process.exit(0);
  } else {
    log('red', '\n❌ Alguns testes falharam.');
    log('yellow', '   Verifique os erros acima e consulte AWS_SES_SETUP.md\n');
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  log('red', `\n❌ Erro fatal: ${error.message}\n`);
  console.error(error);
  process.exit(1);
});


















