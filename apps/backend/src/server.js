const { app } = require("./app");
const { env } = require("./config/env");

app.listen(env.PORT, () => {
  console.log(`API on http://localhost:${env.PORT}`);
});

