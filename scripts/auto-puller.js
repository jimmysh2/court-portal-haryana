const { exec, execSync } = require('child_process');

// ============================================================
// Court Portal - GitHub Auto-Puller (Firewall Bypass)
// 
// Polls GitHub to check if origin/master is ahead of the local 
// repository. If so, triggers deploy.bat automatically.
// ============================================================

const POLL_INTERVAL_MS = process.env.POLLING_INTERVAL || (5 * 60 * 1000); // Default 5 minutes

let isDeploying = false;

function log(msg) {
    console.log(`[Auto-Puller] ${new Date().toISOString()} - ${msg}`);
}

function checkForUpdates() {
    if (isDeploying) return;

    try {
        // 1. Fetch latest details from remote without modifying local files yet
        exec('git fetch origin master', (error, stdout, stderr) => {
            if (error) {
                log(`⚠️ Error fetching from remote: ${error.message}`);
                return;
            }

            // 2. Compare local HEAD with remote HEAD
            try {
                const localHash = execSync('git rev-parse HEAD').toString().trim();
                const remoteHash = execSync('git rev-parse origin/master').toString().trim();

                if (localHash !== remoteHash) {
                    log(`✨ New code detected! (Local: ${localHash.substring(0, 7)} -> Remote: ${remoteHash.substring(0, 7)})`);
                    triggerDeploy();
                }
            } catch (err) {
                log(`⚠️ Error comparing hashes: ${err.message}`);
            }
        });
    } catch (err) {
        log(`⚠️ Unexpected error during poll: ${err.message}`);
    }
}

function triggerDeploy() {
    if (isDeploying) return;
    
    isDeploying = true;
    log('🚀 Starting deployment via deploy.bat...');

    const deployProcess = exec('deploy.bat');

    deployProcess.stdout.on('data', (data) => console.log(`[Deploy] ${data.trim()}`));
    deployProcess.stderr.on('data', (data) => console.error(`[Deploy Error] ${data.trim()}`));

    deployProcess.on('close', (code) => {
        if (code === 0) {
            log('✅ Auto-Pull Deployment SUCCESSFUL!');
        } else {
            log(`❌ Auto-Pull Deployment FAILED. Exit code: ${code}`);
        }

        // 30 second cooldown before allowing another poll
        setTimeout(() => { isDeploying = false; }, 30000); 
    });
}

// Start polling loop
log(`Started Auto-Puller! Polling GitHub every ${POLL_INTERVAL_MS / 1000} seconds...`);
checkForUpdates(); // check immediately on startup
setInterval(checkForUpdates, POLL_INTERVAL_MS);
