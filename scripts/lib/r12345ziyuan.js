const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray

function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

const req_options = {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors"
}

exports.r12345ziyuan = async function r12345ziyuan(dom, str) {
  try {
    let r = await fetch(`https://bkso.r12345ziyuan.com/item/${encodeURIComponent(str)}`, req_options)
    let t = await r.text()
    dom.window.document.body.innerHTML = t
    let mainContentNode = dom.window.document.querySelector('#gj_con')
    if (mainContentNode) {
      console.log(str, r.status, mainContentNode.innerHTML)
      return mainContentNode.innerHTML
    } else {
      console.log(str, r.status, t)
    }
  } catch (e) {
    console.log(str, r.status, e)
  }
}

/////////////////
const r12345ziyuan_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/r12345ziyuan_cache.json'
let r12345ziyuan_cache = {}
if (fs.existsSync(r12345ziyuan_with_cache_path)) { r12345ziyuan_cache = JSON.parse(fs.readFileSync(r12345ziyuan_with_cache_path).toString()) }

// r12345ziyuan_cache_ = R.toPairs(r12345ziyuan_cache).map(([kanji, val]) => {
//   dom.window.document.body.innerHTML = val
//   const lemmaSummaryNode = dom.window.document.body.querySelector('.lemma-summary')
//   return { kanji, ch: lemmaSummaryNode.innerHTML }
// })

let eachNIndex = 0
exports.r12345ziyuan_with_cache = async function r12345ziyuan_with_cache(dom, sentence) {
  const cached = r12345ziyuan_cache[sentence]
  if (cached) { return cached }
  const x = await exports.r12345ziyuan(dom, sentence)
  r12345ziyuan_cache[sentence] = x
  eachNIndex++
  if (eachNIndex % 10 === 0) {
    console.log('syncking r12345ziyuan')
    fs.writeFileSync(r12345ziyuan_with_cache_path, JSON.stringify(r12345ziyuan_cache))
  }
  return x
}

exports.r12345ziyuan_translate_sync = function r12345ziyuan_translate_sync() {
  fs.writeFileSync(r12345ziyuan_with_cache_path, JSON.stringify(r12345ziyuan_cache))
}
