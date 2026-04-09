const { exec } = require('child_process');

// ============================================================
// Court Portal - Auto Updater Background Service
// 
// This script runs silently in the background via PM2.
// It checks GitHub every 60 seconds. If new code is merged
// into 'master', it automatically triggers deploy.bat.
// ============================================================

const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds
let isDeploying = false;

function log(msg) {
    console.log(`[Auto-Updater] ${new Date().toISOString()} - ${msg}`);
}

function checkForUpdates() {
    if (isDeploying) return;

    // 1. Fetch latest details from GitHub
    exec('git fetch origin master', (error) => {
        if (error) {
            log('Failed to fetch from GitHub. Network issue? Retrying next cycle.');
            return;
        }

        // 2. Check if origin/master is ahead of our local master
        exec('git rev-list HEAD...origin/master --count', (err, stdout) => {
            if (err) {
                log('Error checking commit count.');
                return;
            }

            const commitsBehind = parseInt(stdout.trim(), 10);

            if (commitsBehind > 0) {
                log(`🚨 DETECTED ${commitsBehind} NEW COMMITS ON MASTER! Triggering deploy.bat...`);
                triggerDeploy();
            } else {
                // Do nothing, we are up to date
                process.stdout.write('.'); // Keep alive indicator in logs
            }
        });
    });
}

function triggerDeploy() {
    isDeploying = true;
    log('Starting automated deployment process...');

    // Spawn deploy.bat
    const deployProcess = exec('deploy.bat');

    deployProcess.stdout.on('data', (data) => console.log(`[Deploy] ${data.trim()}`));
    deployProcess.stderr.on('data', (data) => console.error(`[Deploy Error] ${data.trim()}`));

    deployProcess.on('close', (code) => {
        if (code === 0) {
            log('✅ Auto-deployment SUCCESSFUL!');
        } else {
            log(`❌ Auto-deployment FAILED with code ${code}. Check logs/deploy-error.log`);
        }

        // Wait an extra minute before resuming checks, just to let things settle
        setTimeout(() => {
            isDeploying = false;
        }, 60000);
    });
}

// Start watching loop
log('Service started. Watching for automatic GitHub updates...');
setInterval(checkForUpdates, CHECK_INTERVAL_MS);

// Run first check immediately on start
checkForUpdates();
