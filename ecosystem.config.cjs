module.exports = {
  apps: [
    {
      name: 'elements',
      script: 'dist/server/entry.mjs',
      cwd: '/var/www/elements',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env_file: '.env',
      env: {
        HOST: '127.0.0.1',
        PORT: 8011,
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/elements.error.log',
      out_file: '/var/log/pm2/elements.out.log',
      time: true,
    },
  ],
};
