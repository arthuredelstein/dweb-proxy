var browser = require("webextension-polyfill");

(async () => {
  let ipfs_source = document.getElementById("ipfs_source");
  let newValue = (await browser.storage.local.get("ipfs_source"))["ipfs_source"];
  if (newValue) {
    ipfs_source.value = newValue;
  }
  ipfs_source.addEventListener("change", async () => {
    await browser.storage.local.set({"ipfs_source": ipfs_source.value});
  });
  let example_links = document.getElementById("example_links");
  example_links.addEventListener("click", (event) => {
    console.log("example_links clicked");
    browser.runtime.sendMessage("show_example_links");
    event.preventDefault();
    window.close();
  });
})();
