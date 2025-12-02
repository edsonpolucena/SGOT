require('./instrument');

if (process.env.NEW_RELIC_ENABLED === 'true' && process.env.NODE_ENV !== 'test') {
  require('newrelic');
  console.log('🔍 New Relic APM ativado');
}

const { app } = require("./app");
const { env } = require("./config/env");

app.listen(env.PORT, () => {
  console.log(`API on http://localhost:${env.PORT}`);
});

