var browser = require("webextension-polyfill");
const CID = require('cids');
const IPFS = require('ipfs');
const memoize = require('fast-memoize');

let ipfs = null;

console.log("Loading dweb-proxy");

// Generates a proxyInfo object from a URL.
// For example, https://arthuredelstein.net:8500 ->
// { type: "https", host: "arthuredelstein.net", port: 8500 }
let proxyInfoFromURL = memoize((url) => {
  let { protocol, hostname, port } = theURLObject = new URL(url);
  let type = protocol.split(":")[0];
  if (port === "") {
    port = {"https": "443", "http": "80"}[type];
  }
  return {
    type,
    host: hostname,
    port
  };
});

// Generate PAC file text.
var pacFromProxyInfo = ({ type, host, port }) => ({
  mode: "pac_script",
  pacScript: {
    data: `
function FindProxyForURL(url, host) {
  if (host.endsWith('.ipfs') ||
      host.endsWith('.ipns') ||
      host.endsWith('.eth')) {
    return "${type.toUpperCase()} ${host}:${port}";
  }
  return 'DIRECT';
}
    `,
    mandatory: true
  }
});

// Generate a pac file from an ipfs source URL.
var pacFromURL = memoize(url => pacFromProxyInfo(proxyInfoFromURL(url)));

// Read the ipfs source proxy address.
let getProxyAddress = async () => {
  let { ipfs_source } = await browser.storage.local.get("ipfs_source");
  return ipfs_source;
};

let analyzeIpfsUrl = url => {
  const [cidv1, path] = url.match("([a-z0-9]+)\.ipfs(\/?.+)").slice(1);
  return { cidv1, path };
};

const stems = [
  "https://ipfs.io/ipfs/",
];

let fetchIPFS = async url => {
  let { cidv1, path } = analyzeIpfsUrl(url);
  for (let stem of stems) {
    let response = await fetch(stem + cidv1 + path);
    if (response.status === 200) {
      return response;
    }
  }
  return null;
//  return `https://gw.ipfspin.com/ipfs/${cidv1}${path}`;
};

let fetchP2P = async url => {
  let { cidv1, path } = analyzeIpfsUrl(url);
  console.log(cidv1 + path);
  let result = ipfs.cat(cidV0fromString(cidv1) + path);
  console.log(result);
  for await (let chunk of result) {
    console.log("chunk!!!", result);
  }
  result = ipfs.cat(cidv1 + path);
  return result;
}

let responsePromiseMap = new Map();

// Set up proxying
let setupProxying = async () => {
  if (browser.proxy.onRequest) {
    // We have a Gecko-like browser
    browser.proxy.onRequest.addListener(async (requestInfo) => {
      const url = new URL(requestInfo.url);
      const proxyInfo = proxyInfoFromURL("https://arthuredelstein.net:8500"); //await getProxyAddress());
      if (url.hostname.endsWith(".ipfs") ||
          url.hostname.endsWith(".ipns") ||
          url.hostname.endsWith(".eth")) {
        console.log(url.hostname, ":", proxyInfo);
        return proxyInfo;
      } else {
        return [{type: "direct"}];
      }
      return proxyInfo;
    }, {urls: ["http://*/*"]});
    browser.webRequest.onBeforeSendHeaders.addListener(
      async details => {
        console.log("about to filter", details.url);
        console.log("request headers", details.requestHeaders);
//        let responsePromise = fetchIPFS(details.url);
        let fileGenerator = await fetchP2P(details.url);
//        let response = await responsePromise;
//        console.log([...response.headers.entries()]);
//        console.log("fetch received content type:", response.headers.get("content-type"));
        responsePromiseMap.set(details.requestId, /*responsePromise*/ fileGenerator);
        let filter = browser.webRequest.filterResponseData(details.requestId);
        filter.onstart = async () => {
          for await (let chunk of fileGenerator) {
            filter.write(chunk);
          }
  //        let response = await responsePromise;
  //        let reader = response.body.getReader();
  //        while (true) {
  //          let { value, done } = await reader.read();
  //          if (done) {
  //            break;
  //          }
  //          //console.log("read value", value);
  //          filter.write(value);
  //        }
          filter.close();
        }
      },
      {"urls": ["http://*.ipfs/*", "http://*.ipns/*", "http://*.eth/*"]},
      ["blocking", "requestHeaders"]);
    browser.webRequest.onHeadersReceived.addListener(
      async (details) => {
        console.log("onHeadersReceived", details);
      //  let response = await responsePromiseMap.get(details.requestId);
      //  let contentType = response.headers.get("content-type");
    //    console.log("attempting to push", contentType);
        details.responseHeaders.push(
          {name: "content-type", value: "text/html" }, //contentType},
        );
        details.responseHeaders.push(
          {name: "Cache-Control", value: "public, max-age=31536000, immutable"}
        );
        return details;
      },
      {"urls": ["http://*.ipfs/*", "http://*.ipns/*", "http://*.eth/*"]},
      ["blocking", "responseHeaders"]
    );
    browser.webRequest.onErrorOccurred.addListener(
      (details) => console.log("error:", details.error),
      {"urls": ["http://*.ipfs/*", "http://*.ipns/*", "http://*.eth/*"]},
    );
  } else {
    // We have a Chrome-like browser
    let setChromeProxySettings = async () => chrome.proxy.settings.set(
      {value: pacFromURL(await getProxyAddress()), scope: 'regular'},
      function() { console.log("done"); });
    await setChromeProxySettings();
    browser.storage.onChanged.addListener(setChromeProxySettings);
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
          (q && q.indexOf(".ipns") > -1) ||
          (q && q.indexOf(".eth") > -1)) {
        return { redirectUrl: `http://${q}` };
      }
    }
  }, {"urls": ["https://*.google.com/*"]}, ["blocking"]);
};

// Convert a CID string to a CID V1 string.
let cidV1fromString = (cidString) => new CID(cidString).toV1().toString();

let cidV0fromString = (cidString) => new CID(cidString).toV0().toString();

// Ensure the URLs in other formats that point to IPFS content are redirected
// to http://{cid}.ipfs/..., such as:
// http[s]://gateway.domain/ipfs/{cidv[0|1}/subpath
let setupIPFSRedirects = () => {
  console.log("setupIPFSRedirects()");
  browser.webRequest.onBeforeRequest.addListener((request) => {
    console.log("---", request.tabId);
    if (request.tabId < 0) {
      return { cancel: false };
    }
    console.log("onBeforeRequeust: ", request);
    let url = new URL(request.url);
    console.log(request.url);
    let cid = url.pathname.match(/\/ipfs\/(Qm[a-zA-Z0-9]{44}|[a-z0-9]+)/)[1];
    console.log("cid:", cid);
    let cidV1 = cidV1fromString(cid);
    console.log("cidV1:", cidV1);
    let subpath = url.pathname.split(cid)[1];
    return { redirectUrl: `http://${cidV1}.ipfs${subpath}` };
  }, {"urls": [
    //"https://*/ipfs/*",
    "http://*/ipfs/*"
  ]}, ["blocking"]);
};

const example_links_page_url = "http://bafybeienxobqj6qjqf4ga77qeohxzjhfotbjefdognpx4ah5iysnnlhega.ipfs/";
let showExampleLinks = async () => {
  await browser.tabs.create({url: example_links_page_url});
}

// Trying out p2p loading using the IPFS library.
let setup_p2p = async () => {
  ipfs = await IPFS.create();
  console.log("ipfs ready: ", ipfs);
/*
  const file = ipfs.cat("QmcvyefkqQX3PpjpY5L8B2yMd47XrVwAipr6cxUt2zvYU8/The.Big.Lebowski.mp4");
console.log(typeof file);
  console.log(file);
  let i = 0;
  for await (let chunk of file) {
    console.log(chunk);
  };
*/
  console.log("ipfs node ready!");
};

// Things we must do on startup or first installation
let init = async () => {
  await setupProxying();
  setupSearchRedirects();
  setupIPFSRedirects();
  setup_p2p();
  browser.runtime.onMessage.addListener(async (data) => {
    if (data === "show_example_links") {
      await showExampleLinks();
    }
  });
  // Connecting to https://arthuredelstein.net ahead of time
  // to make sure we don't see certificate errors in Firefox.
  await fetch("https://arthuredelstein.net");
  // test wss
  let ws = new WebSocket("ws://electrumx1.nmc.bitclc.net:50003");
  ws.onmessage = (msg) => console.log("msg:", msg.data);
  // console.log(ws);
  ws.onopen = () => {
    console.log("socket open");
    try {
      ws.send("hi ");
    } catch (e) {
      console.log(e);
    }
  }
  console.log("init complete");
};

// Initialize on startup
browser.runtime.onStartup.addListener(async () => {
  console.log("onStartup");
  await init();
});

// Initialize on installation and set defaults
browser.runtime.onInstalled.addListener(async () => {
  console.log("onInstalled");
  await browser.storage.local.set({ ipfs_source: "https://arthuredelstein.net:8500" });
  await init();
  showExampleLinks();
});
