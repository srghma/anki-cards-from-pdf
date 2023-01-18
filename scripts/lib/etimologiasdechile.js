const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray
const escapeRegExp = require('./escapeRegExp').escapeRegExp

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

const httpRequester = require('request')
let crypt

function get(url) {
  return new Promise((resolve, reject) => {
    httpRequester({
      uri: url,
      encoding: 'binary',
      method: 'GET'
    }, (err, response, body) => {
      if (err) {
        return reject(response);
      }
      let decoded = crypt.decode(body);
      resolve(decoded);
    });
  });
}

exports.etimologias = async function etimologias(dom, str) {
  if (!crypt) {
    crypt = await (import('windows-1252'))
  }
  // TODO: {
  //   references: {
  //    { orig: 'sa.bana', without: 'sabana' },
  //    { orig: 'sabana', without: 'sabana' }
  //   },
  //   dictionary: { 'sa.bana': { ... } }
  // }

  // let r = await fetch(`http://etimologias.dechile.net/?${encodeURIComponent(str)}`, req_options)
  // let t = await r.text()

  let t = await get(`http://etimologias.dechile.net/?${encodeURIComponent(str)}`)

  if (t.includes('Error 404')) { return null }

  dom.window.document.body.innerHTML = t
  let div = dom.window.document.body.querySelector('div.container')

  if (!div) { throw new Error('no div') }

  let html = div.innerHTML.trim()
  let etimology = R.head(R.split('<p align="center">\n<!-- Modified Eti-inline -->', html)).trim()

  etimology = etimology.replace(new RegExp(escapeRegExp('<!-- (c) www.deChile.net -->'), 'gi'), '')

  let sections = Array.from(div.querySelectorAll('section > div#menu > a')).map(x => x.href.trim().replace(/\/\?/g, ''))

  return { etimology, sections }
}

/////////////////
const etimologias_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/etimologias_cache.json'
let etimologias_cache = {}
if (fs.existsSync(etimologias_with_cache_path)) { etimologias_cache = JSON.parse(fs.readFileSync(etimologias_with_cache_path).toString()) }

// etimologias_cache_ = R.toPairs(etimologias_cache).map(([kanji, val]) => {
//   dom.window.document.body.innerHTML = val
//   const lemmaSummaryNode = dom.window.document.body.querySelector('.lemma-summary')
//   return { kanji, ch: lemmaSummaryNode.innerHTML }
// })

let eachNIndex = 0
exports.etimologias_with_cache = async function etimologias_with_cache(dom, word) {
  const cached = etimologias_cache[word]
  if (cached) { return cached }

  // return null
  const x = await exports.etimologias(dom, word)
  etimologias_cache[word] = x
  eachNIndex++
  if (eachNIndex % 10 === 0) {
    console.log(`syncing etimologias ${eachNIndex}`)
    fs.writeFileSync(etimologias_with_cache_path, JSON.stringify(etimologias_cache))
  }
  return x
}

exports.etimologias_syncronize = function etimologias_syncronize() {
  fs.writeFileSync(etimologias_with_cache_path, JSON.stringify(etimologias_cache))
}
