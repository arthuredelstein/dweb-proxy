console.log("hi there --");

var config = {
  mode: "pac_script",
  pacScript: {
    data: `
function FindProxyForURL(url, host) {
  if (host.endsWith('.ipfs'))
    return "HTTPS arthuredelstein.net:8500";
  return 'DIRECT';
}
    `,
    mandatory: true
  }
};

async function init() {
  console.log("init");
  await new Promise(resolve => setTimeout(resolve, 0));
  chrome.proxy.onProxyError.addListener(details => console.log(details));
  chrome.proxy.settings.set(
    {value: config, scope: 'regular'},
    function() { console.log("done"); });
}

init();
