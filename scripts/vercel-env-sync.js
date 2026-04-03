const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n').filter(line => line && !line.startsWith('#') && line.includes('='));

for (const line of lines) {
    const firstEq = line.indexOf('=');
    const key = line.substring(0, firstEq);
    let val = line.substring(firstEq + 1);
    
    // remove surrounding quotes if present
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
    }

    console.log(`Pushing ${key} to Vercel...`);
    try {
        // Vercel CLI reads from stdin if piped
        execSync(`vercel env rm ${key} production -y`, { stdio: 'ignore' });
    } catch(e) {} // ignore if didn't exist

    try {
        // We use a small script to pipe safely without dealing with shell escaping issues
        const childProvider = require('child_process').spawnSync('npx', ['vercel', 'env', 'add', key, 'production'], {
            input: val,
            encoding: 'utf-8',
            shell: true
        });
        if (childProvider.status === 0) {
            console.log(`✅ ${key} uploaded.`);
        } else {
            console.log(`❌ Failed to upload ${key}:`, childProvider.stderr);
        }
    } catch(e) {
        console.error(e);
    }
}
console.log('All environment variables synced.');
