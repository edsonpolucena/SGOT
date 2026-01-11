module.exports = {
  apps: [
    {
      name: 'backend-api',
      script: 'apps/backend/src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3333
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3333
      },
      error_file: './logs/backend-api-error.log',
      out_file: './logs/backend-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M'
    }
  ],

  // Configuração de deploy - configure as variáveis de ambiente ou use arquivo separado
  // Para produção, configure: PM2_DEPLOY_USER, PM2_DEPLOY_HOST, PM2_DEPLOY_PATH
  deploy: {
    production: {
      // user: process.env.PM2_DEPLOY_USER || 'deploy-user',
      // host: process.env.PM2_DEPLOY_HOST || 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:edsonpolucena/SGOT.git',
      // path: process.env.PM2_DEPLOY_PATH || '/path/to/deploy',
      // 'post-deploy': 'cp -n ${PM2_DEPLOY_PATH}/shared/.env apps/backend/.env || true && cd apps/backend && npm ci && npx prisma generate && npm prune --omit=dev && cd ../.. && pm2 startOrReload ecosystem.config.js --env production',
      ssh_options: ['StrictHostKeyChecking=accept-new', 'ConnectTimeout=30', 'ServerAliveInterval=60'],
      'pre-setup': '',
      'post-setup': 'echo "Post-setup concluído"'
    }
  }
};

