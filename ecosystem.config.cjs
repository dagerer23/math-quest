/**
 * PM2 集群模式配置
 * 启动: pm2 start ecosystem.config.cjs
 * 重载: pm2 reload ecosystem.config.cjs
 * 日志: pm2 logs math-quest
 */
module.exports = {
  apps: [
    {
      name: 'math-quest',
      script: 'server/index.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cwd: __dirname,

      // 集群模式：使用所有 CPU 核心
      instances: 'max',
      exec_mode: 'cluster',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },

      // 优雅重启
      kill_timeout: 5000,
      listen_timeout: 10000,

      // 日志
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 自动重启策略
      max_memory_restart: '500M',
      max_restarts: 10,
      restart_delay: 5000,

      // 监听文件变化（开发环境可开，生产环境关）
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', 'dist'],
    },
  ],
}