const fetch = require('node-fetch');
const fs = require('fs');
const https = require('https');

// TLS certificates
const options = {
  key: fs.readFileSync('/home/arthur/certs/arthuredelstein.net/privkey.pem'),
  cert: fs.readFileSync('/home/arthur/certs/arthuredelstein.net/cert.pem')
};

// Run proxy server
const proxyServer = https.createServer(options, async (req, res) => {
  console.log("GET", req.url);
  if (req.url === "/") {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("dweb proxy server");
  } else {
    const { host, pathname } = new URL(req.url);
    let cid32 = host.split(".ipfs")[0];
    let result = await fetch(`https://cloudflare-ipfs.com/ipfs/${cid32}${pathname}`);
    //  let result = await fetch(`https://ipfs.io/ipfs/${cid32}${pathname}`);
    result.body.pipe(res.socket);
  }
});

proxyServer.listen(8500);

