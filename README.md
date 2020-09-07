Seamless browser add-on for using IPFS.

URLs are in the format http://{cid}.ipfs/path . For example, after
installing the add-on, trying browsing to:
http://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq.ipfs/wiki/

This add-on works by connecting to an HTTPS Proxy served by `ipfs daemon`
using a patched version of the `ipfs` gateway (patch at https://github.com/arthuredelstein/go-ipfs/tree/https-proxy),
living at https://arthuredelstein.net:8500