const https = require('https');
const fs = require('fs');

const GIST_ID = process.env.GIST_ID || null; // Set after first run
const GIST_TOKEN = process.env.GIST_TOKEN;

function updateGist(gistId, content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      files: {
        'downloads-badge.svg': {
          content: content
        }
      }
    });

    const options = {
      hostname: 'api.github.com',
      path: gistId ? `/gists/${gistId}` : '/gists',
      method: gistId ? 'PATCH' : 'POST',
      headers: {
        'User-Agent': 'Badge-Generator',
        'Authorization': `token ${GIST_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const response = JSON.parse(responseData);
        console.log('Gist URL:', response.html_url);
        console.log('Raw URL:', response.files['downloads-badge.svg'].raw_url);
        resolve(response);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const badgeSvg = fs.readFileSync('downloads-badge.svg', 'utf8');

  if (!GIST_ID) {
    console.log('Creating new gist...');
    const result = await updateGist(null, badgeSvg);
    console.log('\nIMPORTANT: Add this to GitHub repository secrets:');
    console.log(`GIST_ID=${result.id}`);
  } else {
    console.log('Updating existing gist...');
    await updateGist(GIST_ID, badgeSvg);
  }
}

main().catch(console.error);
