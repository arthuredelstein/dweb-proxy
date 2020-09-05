console.log("hello");

// On the request to open a webpage
const handleProxyRequest = (requestInfo) => {
  const url = new URL(requestInfo.url);
  if (url.hostname.endsWith(".ipfs")) {
    let proxyInfo = [{type: "http", host: "dweb.arthuredelstein.net", port: 8500 }];
    return proxyInfo;
  } else {
    return [{type: "direct"}];
  }
}

browser.proxy.onRequest.addListener(handleProxyRequest, {urls: ["<all_urls>"]});

browser.webRequest.onBeforeRequest.addListener(
  (request) => {
    if (request.originUrl === undefined && request.parentFrameId === -1) {
      let originalUrl = request.url;
      let originalUrlObject = new URL(originalUrl);
      let queryEntries = Object.fromEntries(originalUrlObject.searchParams.entries());
      if (originalUrlObject.host === "www.google.com" &&
          queryEntries["client"].startsWith("firefox") &&
          queryEntries["q"].endsWith(".ipfs")) {
        return { redirectUrl: `http://${queryEntries.q}` };
      }
    }
  }, {"urls":["https://*.google.com/*"]}, ["blocking"]);
