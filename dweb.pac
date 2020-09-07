function FindProxyForURL(url, host) {
  if (host.endsWith('.ipfs')) {
    return "HTTPS arthuredelstein.net:8500";
//    return "PROXY localhost:8080";
  }
  return 'DIRECT';
}
