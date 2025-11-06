const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('../services/email.service');
const { cleanExpiredTokens } = require('../modules/auth/password-reset.service');

/**
 * Cron Job: Envia lembretes de documentos não visualizados (3 dias antes do vencimento)
 * Roda todos os dias às 9h da manhã
 */
function startDocumentReminderJob() {
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('🔔 [CRON] Verificando documentos não visualizados...');
      
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      // Busca obrigações que:
      // 1. Vencem em até 3 dias
      // 2. Têm arquivo anexado (status SUBMITTED/PAID)
      // 3. Ainda não foram visualizadas
      const obligations = await prisma.obligation.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: threeDaysFromNow
          },
          status: {
            in: ['SUBMITTED', 'PAID']
          },
          views: {
            none: {} // Nenhuma visualização
          },
          files: {
            some: {} // Tem pelo menos um arquivo
          }
        },
        include: {
          company: {
            include: {
              users: {
                where: {
                  role: { in: ['CLIENT_ADMIN', 'CLIENT_NORMAL'] },
                  status: 'ACTIVE'
                }
              }
            }
          },
          files: true
        }
      });

      if (obligations.length === 0) {
        console.log('✅ [CRON] Nenhum documento pendente de visualização.');
        return;
      }

      // Agrupa obrigações por usuário
      const obligationsByUser = {};
      
      obligations.forEach(obligation => {
        if (obligation.company && obligation.company.users) {
          obligation.company.users.forEach(user => {
            if (!obligationsByUser[user.email]) {
              obligationsByUser[user.email] = {
                userName: user.name || user.email,
                obligations: []
              };
            }
            
            obligationsByUser[user.email].obligations.push({
              taxType: obligation.taxType || obligation.title,
              title: obligation.title,
              dueDate: obligation.dueDate,
              companyName: obligation.company.nome,
              createdAt: obligation.createdAt
            });
          });
        }
      });

      // Envia email para cada usuário
      let emailsSent = 0;
      for (const [email, data] of Object.entries(obligationsByUser)) {
        try {
          await emailService.sendDocumentReminderEmail({
            to: email,
            userName: data.userName,
            obligations: data.obligations
          });
          emailsSent++;
        } catch (error) {
          console.error(`❌ [CRON] Erro ao enviar email para ${email}:`, error.message);
        }
      }

      console.log(`✅ [CRON] ${emailsSent} lembretes enviados para ${obligations.length} documento(s).`);
    } catch (error) {
      console.error('❌ [CRON] Erro no job de lembretes:', error);
    }
  });

  console.log('✅ Cron job de lembretes de documentos iniciado (diariamente às 9h)');
}

/**
 * Cron Job: Envia alertas de documentos não visualizados por mais de 2 dias
 * Roda todos os dias às 17h
 */
function startUnviewedDocumentAlertJob() {
  cron.schedule('0 17 * * *', async () => {
    try {
      console.log('🚨 [CRON] Verificando documentos não visualizados há mais de 2 dias...');
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // Busca obrigações que:
      // 1. Foram criadas há mais de 2 dias
      // 2. Têm arquivo anexado
      // 3. Ainda não foram visualizadas
      // 4. Ainda não venceram
      const obligations = await prisma.obligation.findMany({
        where: {
          createdAt: {
            lte: twoDaysAgo
          },
          dueDate: {
            gte: new Date() // Não vencidas
          },
          status: {
            in: ['SUBMITTED', 'PAID']
          },
          views: {
            none: {} // Nenhuma visualização
          },
          files: {
            some: {} // Tem pelo menos um arquivo
          }
        },
        include: {
          company: {
            include: {
              users: {
                where: {
                  role: { in: ['CLIENT_ADMIN', 'CLIENT_NORMAL'] },
                  status: 'ACTIVE'
                }
              }
            }
          },
          files: true
        }
      });

      if (obligations.length === 0) {
        console.log('✅ [CRON] Nenhum documento com alerta necessário.');
        return;
      }

      // Agrupa obrigações por usuário
      const obligationsByUser = {};
      
      obligations.forEach(obligation => {
        if (obligation.company && obligation.company.users) {
          obligation.company.users.forEach(user => {
            if (!obligationsByUser[user.email]) {
              obligationsByUser[user.email] = {
                userName: user.name || user.email,
                obligations: []
              };
            }
            
            obligationsByUser[user.email].obligations.push({
              taxType: obligation.taxType || obligation.title,
              title: obligation.title,
              dueDate: obligation.dueDate,
              companyName: obligation.company.nome,
              createdAt: obligation.createdAt
            });
          });
        }
      });

      // Envia email para cada usuário
      let emailsSent = 0;
      for (const [email, data] of Object.entries(obligationsByUser)) {
        try {
          await emailService.sendUnviewedDocumentAlert({
            to: email,
            userName: data.userName,
            obligations: data.obligations
          });
          emailsSent++;
        } catch (error) {
          console.error(`❌ [CRON] Erro ao enviar alerta para ${email}:`, error.message);
        }
      }

      console.log(`✅ [CRON] ${emailsSent} alertas enviados para ${obligations.length} documento(s).`);
    } catch (error) {
      console.error('❌ [CRON] Erro no job de alertas:', error);
    }
  });

  console.log('✅ Cron job de alertas de documentos iniciado (diariamente às 17h)');
}

/**
 * Cron Job: Limpa tokens de recuperação de senha expirados
 * Roda todos os dias às 3h da madrugada
 */
function startTokenCleanupJob() {
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('🗑️ [CRON] Limpando tokens expirados...');
      const count = await cleanExpiredTokens();
      console.log(`✅ [CRON] ${count} token(s) removido(s).`);
    } catch (error) {
      console.error('❌ [CRON] Erro no job de limpeza de tokens:', error);
    }
  });

  console.log('✅ Cron job de limpeza de tokens iniciado (diariamente às 3h)');
}

/**
 * Inicializa todos os cron jobs
 */
function startAllCronJobs() {
  startDocumentReminderJob();
  startUnviewedDocumentAlertJob();
  startTokenCleanupJob();
  console.log('🚀 Todos os cron jobs foram iniciados com sucesso!');
}

module.exports = {
  startAllCronJobs,
  startDocumentReminderJob,
  startUnviewedDocumentAlertJob,
  startTokenCleanupJob
};

