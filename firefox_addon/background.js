console.log("Loading dweb-proxy");

// Proxy all dweb (.ipfs) requests via
// https://arthuredelstein.net:8500
browser.proxy.onRequest.addListener((requestInfo) => {
  const url = new URL(requestInfo.url);
  if (url.hostname.endsWith(".ipfs")) {
    let proxyInfo = [{type: "https", host: "arthuredelstein.net", port: 8500 }];
    return proxyInfo;
  } else {
    return [{type: "direct"}];
  }
}, {urls: ["<all_urls>"]});

// If user enters example.ipfs domain in the address bar, stop the browser
// from searching via Google or other search engine, but instead
// redirect it to http://example.ipfs .
browser.webRequest.onBeforeRequest.addListener((request) => {
  if (request.originUrl === undefined && request.parentFrameId === -1) {
    let originalUrl = request.url;
    let originalUrlObject = new URL(originalUrl);
    let queryEntries = Object.fromEntries(originalUrlObject.searchParams.entries());
    if (originalUrlObject.host === "www.google.com" &&
        queryEntries["client"].startsWith("firefox") &&
        queryEntries["q"].indexOf(".ipfs") > -1) {
      return { redirectUrl: `http://${queryEntries.q}` };
    }
  }
}, {"urls":["https://*.google.com/*"]}, ["blocking"]);

browser.runtime.onInstalled.addListener(async () => {
  // Connecting to https://arthuredelstein.net ahead of time
  // to make sure we don't see certificate errors in Firefox.
  await fetch("https://arthuredelstein.net");
});
