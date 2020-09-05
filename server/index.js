const http = require('http');
const fetch = require('node-fetch');

const proxyServer = http.createServer(null, async (req, res) => {
  console.log("GET", req.url);
  const { host, pathname } = new URL(req.url);
  //console.log(host, pathname);
  let cid32 = host.split(".ipfs")[0];
  res.writeHead(200, {'Content-Type': 'text/plain'});
  let result = await fetch(`https://cloudflare-ipfs.com/ipfs/${cid32}${pathname}`);
  result.body.pipe(res.socket);
});

proxyServer.listen(8500);

