// ============================================================
// PM2 Ecosystem Config - Court Portal
// Process manager configuration for Windows server deployment
// Usage: pm2 start ecosystem.config.js
// ============================================================

module.exports = {
    apps: [
        {
            name: 'court-portal',
            script: 'server/index.js',
            cwd: './',

            // Environment
            env: {
                NODE_ENV: 'production'
            },

            // Auto-restart settings
            watch: false,              // Don't watch files (deploy.bat handles restarts)
            restart_delay: 3000,       // Wait 3s before restarting on crash
            max_restarts: 10,          // Max crash restarts before giving up
            min_uptime: '10s',         // Must stay up 10s to count as successful start

            // Logging
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            out_file: './logs/app-out.log',
            error_file: './logs/app-error.log',
            merge_logs: true,
            log_type: 'json',

            // Keep process alive
            autorestart: true,
            exp_backoff_restart_delay: 100,

            // Windows compatibility
            interpreter: 'node',
        },
        {
            name: 'github-webhook',
            script: 'scripts/webhook-listener.js',
            cwd: './',

            // Environment
            env: {
            },

            // Auto-restart settings
            watch: false,
            restart_delay: 5000,

            // Logging
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            out_file: './logs/webhook-out.log',
            error_file: './logs/webhook-error.log',
            merge_logs: true,

            interpreter: 'node',
        }
    ]
};
