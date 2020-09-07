package main

import (
	"io"
	"log"
	"regexp"
	"strings"
  "fmt"
  "net/http"
)




func main() {
	fmt.Println("starting\n");
  re, _ := regexp.Compile("^([a-z0-9]+)\\.ipfs$")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		//spew.Dump(r)
		//fmt.Println("Host", r.Host)
		//fmt.Println("RequestURI", r.RequestURI)
		//fmt.Println("URL", r.URL)
		//fmt.Println("Header", r.Header)
		//fmt.Println("Method", r.Method)
		if strings.HasSuffix(r.Host, ".ipfs") {
			cidv1 := re.FindStringSubmatch(r.Host)[1]
			fmt.Println("cidv1", cidv1);
			gatewayUrl := fmt.Sprintf("https://cloudflare-ipfs.com/ipfs/%s%s", cidv1, r.URL.Path);
			fmt.Println("gatewayUrl", gatewayUrl);
      resp, _ := http.Get(gatewayUrl)
      defer resp.Body.Close()
			io.Copy(w, resp.Body)
		}
	})

	log.Fatal(http.ListenAndServeTLS(":8500", "/home/arthur/certs/arthuredelstein.net/cert.pem", "/home/arthur/certs/arthuredelstein.net/privkey.pem", nil))
}
