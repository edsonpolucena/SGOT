const express = require('express');
const cors = require('cors');
const { authRouter } = require('./modules/auth/auth.routes');
const { obligationRouter } = require('./modules/obligations/obligation.routes');
const { usersRouter } = require('./modules/users/users.routes');
const { auditRouter } = require('./modules/audit/audit.routes');
const { notificationRouter } = require('./modules/notifications/notification.routes');
const { setupSwagger } = require('./swagger');
const companyRoutes = require("./modules/company/company.routes.js");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const taxCalendarRoutes = require("./modules/tax-calendar/tax-calendar.routes");
const { startAllCronJobs } = require('./jobs/notification.cron');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/obligations', obligationRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationRouter);
app.use("/api/empresas", companyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tax-calendar", taxCalendarRoutes);

setupSwagger(app);

const { errorMiddleware } = require('./middleware/error');
app.use(errorMiddleware);

// Inicializa cron jobs em produção
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON_JOBS === 'true') {
  startAllCronJobs();
  console.log('✅ Cron jobs iniciados');
} else {
  console.log('⏸️ Cron jobs desabilitados (defina ENABLE_CRON_JOBS=true para habilitar)');
}

module.exports = { app };
