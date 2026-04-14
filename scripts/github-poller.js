const { execSync } = require('child_process');

// The polling interval in milliseconds (1 minute)
const POLL_INTERVAL = 60000;
const REPO_URL = 'https://github.com/jimmysh2/court-portal-haryana.git';

console.log(`[GitHub Poller] Starting. Checking for new commits every 60 seconds.`);

let lastHash = null;

function checkForUpdates() {
    try {
        // Fetch the latest commit hash from the remote master branch
        const result = execSync(`git ls-remote ${REPO_URL} refs/heads/master`).toString().trim();
        if (!result) return;

        // Extract just the commit hash (ls-remote returns "hash\trefs/heads/master")
        const currentHash = result.split(/[\t ]+/)[0];

        // On first run, just record the hash without deploying
        if (lastHash === null) {
            console.log(`[${new Date().toLocaleString()}] Initializing. Current remote hash: ${currentHash}`);
            lastHash = currentHash;
            return;
        }

        // If the hash changed, trigger our build process
        if (currentHash !== lastHash) {
            console.log(`\n[${new Date().toLocaleString()}] 🚨 NEW COMMIT DETECTED! (${currentHash})`);
            console.log('Starting automated deployment...\n');

            try {
                // 1. Pull changes
                console.log('=> Pulling latest code...');
                execSync('git pull origin master', { stdio: 'inherit' });

                // 2. Install dependencies (in case package.json changed)
                console.log('=> Installing dependencies...');
                execSync('npm install', { stdio: 'inherit' });

                // 3. Build frontend
                console.log('=> Building React application...');
                execSync('npm run build', { stdio: 'inherit' });

                // 4. Restart ONLY the main app process in pm2
                console.log('=> Restarting the main application (court-portal)...');
                execSync('npx pm2 restart court-portal', { stdio: 'inherit' });

                console.log('\n✅ Deployment completed successfully! 🎉');
                
                // Update the hash to the deployed version
                lastHash = currentHash;
            } catch (deployError) {
                console.error(`\n❌ Deployment Failed! The script will retry on the next cycle. Details:`, deployError.message);
                // Keep the old hash so it tries to pull again on the next check
            }
        }
    } catch (error) {
        // Suppress noisy network error logs incase of temporary internet drop
        if (!error.message.includes('Could not resolve host')) {
            console.error(`[${new Date().toLocaleString()}] Failed to check repository:`, error.message);
        }
    }
}

// Run immediately, then repeat every interval
checkForUpdates();
setInterval(checkForUpdates, POLL_INTERVAL);
