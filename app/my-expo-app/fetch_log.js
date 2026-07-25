const https = require('https');
const zlib = require('zlib');
const fs = require('fs');

const url = "https://storage.googleapis.com/eas-workflows-production/logs/95a5e4b8-3a7f-487b-9504-d5376452bdd3/7f6f4613-3aac-4bde-8187-f97a25dbfc78/2026-07-25T18%3A05%3A19Z-377929e6-b17a-46e4-9036-b822a5bf5b46.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260725%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260725T180745Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=43cd3774bb6606bbf1e899926eb452bd61a11f873f6844318152ff37e3b696aa21c1a131f77fec3199d34ce800c0b1d3e61c8bd0ee8c735e3016d43f2828e46581c73bee532189e775443431899d3d010735e380469ec316c5f5ba8175be439ffa8cbf0ad8607d544ec0a2a87cc9ba14c161902714310871cde489ef8f6c83762bb31bdbbd0f2499bae112799d3b320f24dc632f1709723914e2cd6eb46717b2ab59cb4cacac62683ba0ab957f4d61708219b2e38e5cb020149315876e959c7cfbb826dd1ddd9b69cf00d17570a73381d5d944eb6081bb31aa7ffa751b17ad604d14e2979e119272d5bb9f239b59ba5ea81c6bfbe4eba7f1c9b8f79e724a4492";

https.get(url, (res) => {
  let stream = res;
  if (res.headers['content-encoding'] === 'gzip' || url.endsWith('.gz')) {
    stream = res.pipe(zlib.createGunzip());
  }
  let data = '';
  stream.on('data', chunk => {
    data += chunk.toString('utf8');
  });
  stream.on('end', () => {
    // Look for error or ERR
    const lines = data.split('\n');
    let hasError = false;
    for (const line of lines) {
      if (line.includes('error') || line.includes('ERR')) {
        console.log(line);
        hasError = true;
      }
    }
    if (!hasError) {
      console.log("Last 20 lines:");
      console.log(lines.slice(-20).join('\n'));
    }
  });
}).on('error', err => {
  console.error("Download error:", err);
});
