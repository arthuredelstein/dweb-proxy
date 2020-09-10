(async () => {
  let ipfs_source = document.getElementById("ipfs_source");
  let newValue = (await browser.storage.local.get("ipfs_source"))["ipfs_source"];
  if (newValue) {
    ipfs_source.value = newValue;
  }
  ipfs_source.addEventListener("change", async () => {
    await browser.storage.local.set({"ipfs_source": ipfs_source.value});
  });
})();
