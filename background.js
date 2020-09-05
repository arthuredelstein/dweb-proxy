console.log("hello");




// On the request to open a webpage
const handleProxyRequest = (requestInfo) => {
  console.log(requestInfo);
/*// Read the web address of the page to be visited 
  const url = new URL(requestInfo.url);
// Determine whether the domain in the web address is on the blocked hosts list
  if (blockedHosts.indexOf(url.hostname) != -1) {
// Write details of the proxied host to the console and return the proxy address
    console.log(`Proxying: ${url.hostname}`);
    return {type: "http", host: "127.0.0.1", port: 65535};
  }
*/
// Return instructions to open the requested webpage
  return {type: "direct"};
}


//browser.proxy.onRequest.addListener(handleProxyRequest, {urls: ["<all_urls>"]});

browser.webRequest.onBeforeRequest.addListener(
  (request) => {
    if (request.originUrl === undefined && request.parentFrameId === -1) {
      console.log(request)
      let originalUrl = request.url;
      console.log(originalUrl);
      let originalUrlObject = new URL(originalUrl);
      let queryEntries = Object.fromEntries(originalUrlObject.searchParams.entries());
      console.log(originalUrlObject, queryEntries);
      if (originalUrlObject.host === "www.google.com" &&
          queryEntries["client"].startsWith("firefox") &&
          queryEntries["q"].endsWith(".ipfs")) {
        return { redirectUrl: `http://${queryEntries.q}` };
      }
    }
  }, {"urls":["<all_urls>"]}, ["blocking"]);

//browser.webNavigation.onBeforeNavigate.addListener(x => console.log(x));
//browser.
