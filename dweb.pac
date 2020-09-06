function FindProxyForURL(url, host) {
  if (host.endsWith('.ipfs')) {
    return "HTTPS arthuredelstein.net:8500";
  }
  return 'DIRECT';
}
