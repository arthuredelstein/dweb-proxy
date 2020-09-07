package main

import (
  "io"
  "log"
  "regexp"
  "strings"
  "fmt"
  "net/http"
)

func copyHeaders(incomingHeader http.Header, outgoingHeader http.Header, headersToCopy []string) {
  for _, key := range headersToCopy {
    if values := incomingHeader.Values(key); len(values) > 0 {
      outgoingHeader.Del(key)
      for _, value := range values {
        //fmt.Println(key, ":", value)
        outgoingHeader.Add(key, value)
      }
    }
  }
}

func main() {
  requestHeadersToCopy := []string {
    "accept",
    "accept-encoding",
    "cache-control",
    "DNT",
    "If-Modified-Since"}

  responseHeadersToCopy := []string {
    "access-control-allow-headers",
    "access-control-allow-origin",
    "access-control-expose-headers",
    "age",
    "cache-control",
    "content-encoding",
    "content-type",
    "date",
    "last-modified",
    "x-content-type-options",
    "x-ipfs-path",
    "x-xss-protection"}

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
      outgoingRequest, _ := http.NewRequest("GET", gatewayUrl, nil)
      copyHeaders(r.Header, outgoingRequest.Header, requestHeadersToCopy)
      resp, _ := http.DefaultClient.Do(outgoingRequest)
      defer resp.Body.Close()
      writerHeader := w.Header()
      copyHeaders(resp.Header, writerHeader, responseHeadersToCopy)
      w.WriteHeader(resp.StatusCode)
      io.Copy(w, resp.Body)
    }
  })

  log.Fatal(http.ListenAndServe(":8501", nil))
}
