module.exports = {
  apps: [
    {
      name: 'backend-api',
      script: 'apps/backend/src/server.js',
      cwd: '/var/www/api-backend/current',
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

  deploy: {
    production: {
      user: 'ubuntu',
      host: '54.207.3.124',
      ref: 'origin/main',
      repo: 'git@github.com:edsonpolucena/SGOT.git',
      path: '/var/www/api-backend',
      'post-deploy': 'cp -n /var/www/api-backend/shared/.env apps/backend/.env || true && cd apps/backend && npm ci && npx prisma generate && npm prune --omit=dev && cd ../.. && pm2 startOrReload ecosystem.config.js --env production',
      ssh_options: ['StrictHostKeyChecking=accept-new'],
      'pre-setup': '',
      'post-setup': 'echo "Post-setup concluído"'
    }
  }
};

