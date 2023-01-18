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
    "cookie": "BAIDU_SSP_lcr=https://www.google.com/; zhishiTopicRequestTime=1618073597187; BAIKE_SHITONG=%7B%22data%22%3A%22fd135056066f2382e84c285a73527dea1387a8a24bc6af802541ade4b9d7c9d9db7a1b1f00b2de7734b784461669e72236c8ec0c2fd3c5d909c32f4747509c1dd7d655497af7bc1dbdf7f1d986627b5309b93b37df2900dd62c0ae9749f9f58dfa07da92ed1ba16064b2ab30de6f4c8a24deabcf4c2b5299d6db4e3bb23ce281%22%2C%22key_id%22%3A%2210%22%2C%22sign%22%3A%22afc8efe0%22%7D; BAIDUID=8041DBE92227DC1D98AD9630020D019A:FG=1; BAIDUID_BFESS=8041DBE92227DC1DC73C306D244A6018:FG=1; __yjs_duid=1_de49d65578aef1f99b4b5d9b6519f03b1617108112642; Hm_lvt_55b574651fcae74b0a9f1cf9c8d7c93a=1618073598,1618073718,1618073729; Hm_lpvt_55b574651fcae74b0a9f1cf9c8d7c93a=1618073729; ab_sr=1.0.0_MGQ4ODRjOGNiOTQyODM5ZDZmM2VjZjdlYTFiODBiY2I2NWNlY2M0ODg1OGJlMWYxMTQzMDNkZmI3ZWI2YmYyZGFhYzNiODA2YzlmYTI5NjI3YmU4ZTQ3MzE5ZTRjZWU1"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors"
}

exports.baidu = async function baidu(dom, str) {
  let r = await fetch(`https://bkso.baidu.com/item/${encodeURIComponent(str)}`, req_options)
  let t = await r.text()
  dom.window.document.body.innerHTML = t
  let mainContentNode = dom.window.document.querySelector('.main-content') || dom.window.document.querySelector('#posterCon')
  if (!mainContentNode) { throw new Error('no mainContentNode') }
  let lemmaSummaryNode = mainContentNode.querySelector('.lemma-summary')
  if (lemmaSummaryNode) { return mainContentNode.innerHTML }

  const links = mapWithForEachToArray(mainContentNode.querySelectorAll('a'), x => ({ href: x.href, textContent: x.textContent })).filter(x => x.textContent.includes('字'))
  const link = links[0]

  if (!link) { throw new Error('no link') }
  const href = `https://bkso.baidu.com${link.href}`

  r = await fetch(href, req_options)
  t = await r.text()
  dom.window.document.body.innerHTML = t
  mainContentNode = dom.window.document.querySelector('.main-content') || dom.window.document.querySelector('#posterCon')
  if (!mainContentNode) { throw new Error('no mainContentNode') }
  lemmaSummaryNode = mainContentNode.querySelector('.lemma-summary')
  if (lemmaSummaryNode) { return mainContentNode.innerHTML }

  throw new Error('nothing found')
}

/////////////////
const baidu_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/baidu_cache.json'
let baidu_cache = {}
if (fs.existsSync(baidu_with_cache_path)) { baidu_cache = JSON.parse(fs.readFileSync(baidu_with_cache_path).toString()) }

// baidu_cache_ = R.toPairs(baidu_cache).map(([kanji, val]) => {
//   dom.window.document.body.innerHTML = val
//   const lemmaSummaryNode = dom.window.document.body.querySelector('.lemma-summary')
//   return { kanji, ch: lemmaSummaryNode.innerHTML }
// })

let eachNIndex = 0
exports.baidu_with_cache = async function baidu_with_cache(dom, sentence) {
  const cached = baidu_cache[sentence]
  if (cached) { return cached }

  return null
  // const x = await exports.baidu(dom, sentence)
  // baidu_cache[sentence] = x
  // eachNIndex++
  // if (eachNIndex % 10 === 0) {
  //   console.log('syncking baidu')
  //   fs.writeFileSync(baidu_with_cache_path, JSON.stringify(baidu_cache))
  // }
  // return x
}

exports.baidu_translate_sync = function baidu_translate_sync() {
  fs.writeFileSync(baidu_with_cache_path, JSON.stringify(baidu_cache))
}
