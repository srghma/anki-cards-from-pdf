fetch = require('node-fetch')
jsdom = require('jsdom')

exports.rtega_get = async function rtega_get(str) {
  const r = await fetch(`http://rtega.be/chmn/?c=${encodeURIComponent(str)}`, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "upgrade-insecure-requests": "1",
      "cookie": "allcharacters=1; chmnimages=0"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });

  const t = await r.text()

  const dom = new jsdom.JSDOM(t)

  const node = dom.window.document.querySelector('table.chmn')
  // removeAllNodes(node.querySelectorAll(".tools"))
  // removeAllNodes(node.querySelectorAll(".fa-spinner"))
  // removeAllNodes(node.querySelectorAll('*[style*="display: none;"]'))
  return node.innerHTML.trim()
}
