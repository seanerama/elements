module.exports = {
  apps: [
    {
      name: 'elements',
      script: 'dist/server/entry.mjs',
      cwd: '/home/ubuntu/apps/elements',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env_file: '.env',
      env: {
        HOST: '127.0.0.1',
        PORT: 8011,
        NODE_ENV: 'production',
      },
      // PM2 default log location: ~/.pm2/logs/<name>-{out,error}.log
      time: true,
    },
  ],
};
