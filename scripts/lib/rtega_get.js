const fetch = require('node-fetch')
const jsdom = require('jsdom')

async function rtega_get(dom, str) {
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

  const node = dom.window.document.querySelector('table.chmn')

  if (!node) { return null }

  // removeAllNodes(node.querySelectorAll(".tools"))
  // removeAllNodes(node.querySelectorAll(".fa-spinner"))
  // removeAllNodes(node.querySelectorAll('*[style*="display: none;"]'))
  return node.innerHTML.trim()
}

exports.rtega_get = rtega_get

const cache_path = '/home/srghma/projects/anki-cards-from-pdf/rtega_cache.json'
let rtega_get_cache = {}
try { rtega_get_cache = JSON.parse(fs.readFileSync(cache_path).toString()) } catch (e) {  }

async function rtega_get_with_cache(dom, sentence) {
  const cached = rtega_get_cache[sentence]
  if (cached) { return cached }
  const output = await rtega_get(dom, sentence)
  rtega_get_cache[sentence] = output
  fs.writeFileSync(cache_path, JSON.stringify(rtega_get_cache))
  return output
}

exports.rtega_get_with_cache = rtega_get_with_cache
