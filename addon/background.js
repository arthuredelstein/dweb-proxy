console.log("Loading dweb-proxy");

var config = ({ type, host, port }) => ({
  mode: "pac_script",
  pacScript: {
    data: `
function FindProxyForURL(url, host) {
  if (host.endsWith('.ipfs') || host.startsWith('ipns.')) {
    return "${type.toUpperCase()} ${host}:${port}";
  }
  return 'DIRECT';
}
    `,
    mandatory: true
  }
});


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
  if (!browser.proxy.onRequest) {
    chrome.proxy.settings.set(
      {value: config(currentProxyInfo), scope: 'regular'},
      function() { console.log("done"); });
  }
};

let setupProxying = () => {
  if (browser.proxy.onRequest) {
    // Proxy all dweb (.ipfs) requests via `currentProxyInfo`
    browser.proxy.onRequest.addListener((requestInfo) => {
      const url = new URL(requestInfo.url);
      if (url.hostname.endsWith(".ipfs") || url.hostname.startsWith("ipns.")) {
        console.log(url.hostname, ":", currentProxyInfo);
        return currentProxyInfo;
      } else {
        return [{type: "direct"}];
      }
      return currentProxyInfo;
    }, {urls: ["http://*/*"]});
  }
};

// If user enters example.ipfs domain in the address bar, stop the browser
// from searching via Google or other search engine, but instead
// redirect it to http://example.ipfs .
let setupSearchRedirects = () => {
  browser.webRequest.onBeforeRequest.addListener((request) => {
    if (request.originUrl === undefined && request.parentFrameId === -1) {
      let originalUrl = request.url;
      let originalUrlObject = new URL(originalUrl);
      let { client, sourceid, q } = Object.fromEntries(
        originalUrlObject.searchParams.entries());
      if (originalUrlObject.host === "www.google.com" &&
          ((client && client.startsWith("firefox")) ||
           (sourceid && sourceid.startsWith("chrome"))) &&
          (q && q.indexOf(".ipfs") > -1) ||
          (q && q.indexOf("ipns.") === 0)) {
        return { redirectUrl: `http://${q}` };
      }
    }
  }, {"urls":["https://*.google.com/*"]}, ["blocking"]);
};

let init = async () => {
  // Connecting to https://arthuredelstein.net ahead of time
  // to make sure we don't see certificate errors in Firefox.
  setupProxying();
  setupSearchRedirects();
  browser.storage.onChanged.addListener(updateCurrentProxyInfo);
  await updateCurrentProxyInfo();
  await fetch("https://arthuredelstein.net");
  console.log("init complete");
};

browser.runtime.onStartup.addListener(async () => {
  console.log("onStartup");
  await init();
});

browser.runtime.onInstalled.addListener(async () => {
  console.log("onInstalled");
  await browser.storage.local.set({ ipfs_source: "https://arthuredelstein.net:8500" });
  await init();
  let tab = await browser.tabs.create(
    {url: "http://bafybeiduon5uf5f7snvlpdgacn2qrb3pw6ff54wdjckaryztnr4cdyg2p4.ipfs/"});
});
