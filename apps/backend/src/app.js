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

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
  })
);


app.use(express.json());


app.get('/health', (_req, res) => res.json({ ok: true }));

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
