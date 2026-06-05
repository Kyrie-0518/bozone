const NODE_BASE = 'C:\\Users\\Ky\\.workbuddy\\binaries\\node\\versions\\22.12.0'

module.exports = {
  apps: [
    {
      name: 'bozone-server',
      cwd: 'f:/bozone/server',
      script: `${NODE_BASE}/node.exe`,
      args: '--import ./node_modules/tsx/dist/esm/index.mjs src/index.ts',
      exec_mode: 'fork',
      windowsHide: true,
      env: {
        NODE_ENV: 'development',
        PATH: `${NODE_BASE};${process.env.PATH || ''}`,
      },
      wait_ready: true,
      listen_timeout: 15000,
      log_date_format: 'MM-DD HH:mm:ss',
      error_file: 'f:/bozone/logs/server-error.log',
      out_file: 'f:/bozone/logs/server-out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 5,
      kill_timeout: 5000,
      restart_delay: 2000,
    },
    {
      name: 'bozone-client',
      cwd: 'f:/bozone/client',
      script: `${NODE_BASE}/node.exe`,
      args: './node_modules/vite/dist/node/cli.js --host --port 5174',
      exec_mode: 'fork',
      windowsHide: true,
      env: {
        NODE_ENV: 'development',
        PATH: `${NODE_BASE};${process.env.PATH || ''}`,
      },
      wait_ready: false,
      log_date_format: 'MM-DD HH:mm:ss',
      error_file: 'f:/bozone/logs/client-error.log',
      out_file: 'f:/bozone/logs/client-out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 5,
      kill_timeout: 5000,
      restart_delay: 2000,
    },
  ],
}
