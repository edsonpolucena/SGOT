const express = require('express');
const cors = require('cors');
const { authRouter } = require('./modules/auth/auth.routes');
const { obligationRouter } = require('./modules/obligations/obligation.routes');
const { usersRouter } = require('./modules/users/users.routes');
const { setupSwagger } = require('./swagger');
const companyRoutes = require("./modules/company/company.routes.js");
const analyticsRoutes = require("./modules/analytics/analytics.routes");



const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/obligations', obligationRouter);
app.use("/api/empresas", companyRoutes);

app.use("/api/analytics", analyticsRoutes);



setupSwagger(app);

const { errorMiddleware } = require('./middleware/error');
app.use(errorMiddleware);


module.exports = { app };
