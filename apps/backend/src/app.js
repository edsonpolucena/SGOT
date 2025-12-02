const express = require('express');
const cors = require('cors');

const { authRouter } = require('./modules/auth/auth.routes');
const { obligationRouter } = require('./modules/obligations/obligation.routes');
const { usersRouter } = require('./modules/users/users.routes');
const { auditRouter } = require('./modules/audit/audit.routes');
const { notificationRouter } = require('./modules/notifications/notification.routes');
const { consentRouter } = require('./modules/consent/consent.routes');
const companyRoutes = require("./modules/company/company.routes.js");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const taxCalendarRoutes = require("./modules/tax-calendar/tax-calendar.routes");
const { setupSwagger } = require('./swagger');
const { startAllCronJobs } = require('./jobs/notification.cron');

const app = express();


const allowedOrigins = [
  'http://localhost:5173',
    'https://sgot.com.br',
  'https://www.sgot.com.br',
  'https://api.sgot.com.br',
  
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log('❌ CORS BLOQUEADO:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
  })
);


app.use(express.json());


app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/test-sentry', async (req, res) => {
  const Sentry = require('./instrument');
  const SENTRY_DSN = process.env.SENTRY_DSN;

  if (!Sentry) {
    return res.status(200).json({ 
      success: false,
      message: 'Sentry não configurado',
      hint: 'Configure SENTRY_DSN no arquivo .env para ativar o Sentry',
      check: {
        hasDsn: !!SENTRY_DSN,
        dsnNotEmpty: SENTRY_DSN && SENTRY_DSN.trim() !== '',
        dsnValue: SENTRY_DSN ? (SENTRY_DSN.length > 0 ? `${SENTRY_DSN.substring(0, 20)}...` : 'vazio') : 'não definido',
        nodeEnv: process.env.NODE_ENV,
        isTest: process.env.NODE_ENV === 'test'
      },
      solution: !SENTRY_DSN || SENTRY_DSN.trim() === '' 
        ? 'Adicione SENTRY_DSN="seu-dsn-aqui" no arquivo .env'
        : 'Verifique se o DSN está correto e reinicie o servidor'
    });
  }

  if (!process.env.SENTRY_DSN) {
    return res.status(200).json({ 
      success: false,
      message: 'SENTRY_DSN não configurado',
      hint: 'Adicione SENTRY_DSN no arquivo .env'
    });
  }

  try {
    foo();
  } catch (e) {
    const eventId = Sentry.captureException(e, {
      tags: {
        source: 'test-endpoint',
        environment: process.env.NODE_ENV || 'development'
      },
      extra: {
        test: true,
        endpoint: '/test-sentry',
        timestamp: new Date().toISOString()
      }
    });
    
    await Sentry.flush(2000);
    
    return res.status(200).json({ 
      success: true,
      message: 'Erro de teste capturado pelo Sentry!',
      hint: 'Verifique o dashboard do Sentry para ver o erro',
      eventId: eventId,
      error: {
        message: e.message,
        name: e.name
      }
    });
  }
});


app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/obligations', obligationRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/consent', consentRouter);
app.use("/api/empresas", companyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tax-calendar", taxCalendarRoutes);

setupSwagger(app);


const { errorMiddleware } = require('./middleware/error');
app.use(errorMiddleware);


if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON_JOBS === 'true') {
  startAllCronJobs();
  console.log('✅ Cron jobs iniciados');
} else {
  console.log('⏸️ Cron jobs desabilitados');
}

module.exports = { app };
