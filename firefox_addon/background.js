console.log("Loading dweb-proxy");

let currentProxyInfo;

let proxyInfoFromURL = (url) => {
  let { protocol, hostname, port } = theURLObject = new URL(url);
  return {
    type: protocol.split(":")[0],
    host: hostname,
    port
  };
};

let updateCurrentProxyInfo = async () => {
  let { ipfs_source } = await browser.storage.local.get("ipfs_source");
  currentProxyInfo = proxyInfoFromURL(ipfs_source);
};

// Proxy all dweb (.ipfs) requests via
// https://arthuredelstein.net:8500
browser.proxy.onRequest.addListener((requestInfo) => {
  const url = new URL(requestInfo.url);
  if (url.hostname.endsWith(".ipfs") || url.hostname.startsWith("ipns.")) {
    console.log(currentProxyInfo);
    return currentProxyInfo;
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
        (queryEntries["q"].indexOf(".ipfs") > -1) ||
        (queryEntries["q"].indexOf("ipns.") === 0)) {
      return { redirectUrl: `http://${queryEntries.q}` };
    }
  }
}, {"urls":["https://*.google.com/*"]}, ["blocking"]);

browser.runtime.onInstalled.addListener(async () => {
  // Connecting to https://arthuredelstein.net ahead of time
  // to make sure we don't see certificate errors in Firefox.
  await fetch("https://arthuredelstein.net");
  await browser.storage.local.set({ ipfs_source: "https://arthuredelstein.net:8500" });
  await updateCurrentProxyInfo();
  browser.storage.onChanged.addListener(updateCurrentProxyInfo);
});
