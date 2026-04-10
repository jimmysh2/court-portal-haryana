const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

// ============================================================
// Court Portal - GitHub Webhook Listener
// 
// Listens for GitHub Push events on a specific port.
// Triggered ONLY by GitHub, uses zero CPU when idle.
// ============================================================

const PORT = process.env.WEBHOOK_PORT || 4000;
const SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

const TARGET_BRANCH = 'master';

let isDeploying = false;

function log(msg) {
    console.log(`[Webhook] ${new Date().toISOString()} - ${msg}`);
}

function verifySignature(req, rawBody) {
    if (!SECRET) return true; // If no secret configured, allow (development only)

    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', SECRET);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

const server = http.createServer((req, res) => {
    // Only accept POST to /webhook
    if (req.method !== 'POST' || req.url !== '/webhook') {
        res.statusCode = 404;
        return res.end('Not found');
    }

    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk.toString(); });

    req.on('end', () => {
        // 1. Verify GitHub Signature
        if (!verifySignature(req, rawBody)) {
            log('⚠️ Invalid webhook signature detected.');
            res.statusCode = 401;
            return res.end('Unauthorized');
        }

        // 2. Parse payload
        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch (e) {
            res.statusCode = 400;
            return res.end('Bad Request: Invalid JSON');
        }

        // 3. Ensure it's a push to the correct branch
        if (req.headers['x-github-event'] === 'push' && payload.ref === `refs/heads/${TARGET_BRANCH}`) {
            log(`✅ Valid GitHub push to ${TARGET_BRANCH} detected. Acknowledging webhook...`);
            res.statusCode = 200;
            res.end('Deployment triggered successfully.');

            triggerDeploy();
        } else {
            // It's a valid webhook, but just a ping or another branch
            log('Ignoring webhook (not a push to master, or just a ping).');
            res.statusCode = 200;
            res.end('Ignored - Not targeting master branch.');
        }
    });
});

function triggerDeploy() {
    if (isDeploying) {
        log('⚠️ Already deploying! Ignoring duplicate trigger.');
        return;
    }

    isDeploying = true;
    log('🚀 Starting CI deployment process via deploy.bat...');

    const deployProcess = exec('deploy.bat');

    deployProcess.stdout.on('data', (data) => console.log(`[Deploy] ${data.trim()}`));
    deployProcess.stderr.on('data', (data) => console.error(`[Deploy Error] ${data.trim()}`));

    deployProcess.on('close', (code) => {
        if (code === 0) {
            log('✅ Webhook Deployment SUCCESSFUL!');
        } else {
            log(`❌ Webhook Deployment FAILED (Rollback triggered inside .bat). Exit code: ${code}`);
        }

        // Cooldown period
        setTimeout(() => { isDeploying = false; }, 10000);
    });
}

server.listen(PORT, () => {
    log(`Webhook listener started tightly on port ${PORT}...`);
    log(`URL config for GitHub: http://<SERVER_IP>:${PORT}/webhook`);
    if (!SECRET) log("⚠️ WARNING: No GITHUB_WEBHOOK_SECRET set in environment!");
});
