const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')

function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

exports.trainchinese = async function trainchinese(dom, str) {
  const r = await fetch(`https://www.trainchinese.com/v2/search.php?searchWord=${encodeURIComponent(str)}&tcLanguage=ru`, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": "X-Mapping-llahcpom=0C14464A7A01A280C5776A75B2327FDB; aff_site=https%3A%2F%2Fwww.google.com%2F"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });

  const t = await r.text()

  if (t.includes('Не удалось ничего найти с')) { return null }

  dom.window.document.body.innerHTML = t

  const node = dom.window.document.querySelector('table.table')

  const buff = []

  node.querySelectorAll('div.chinese').forEach(chNode => {
    const ch = chNode.textContent.trim().split('').filter(require('./isHanzi').isHanziOrSpecial).join('')

    const pinyin = chNode.nextSibling.nextSibling.textContent.trim()

    if (RA.isNilOrEmpty(pinyin)) { throw new Error('pinyin') }

    const typeAndTransl__Node = chNode.nextSibling.nextSibling.nextSibling.nextSibling

    if (RA.isNilOrEmpty(typeAndTransl__Node)) { throw new Error('typeAndTransl__Node') }

    const transl__ = typeAndTransl__Node.querySelector('span').textContent.trim()

    typeAndTransl__Node.querySelector('span').remove()

    const type = typeAndTransl__Node.textContent.trim()

    if (RA.isNilOrEmpty(transl__)) { throw new Error('transl') }
    if (RA.isNilOrEmpty(type)) { throw new Error('type') }

    buff.push({
      ch,
      pinyin,
      transl: transl__,
      type,
    })
  })

  return buff
}

/////////////////
const trainchinese_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/trainchinese_cache.json'

let trainchinese_cache = {}
try { trainchinese_cache = JSON.parse(fs.readFileSync(trainchinese_with_cache_path).toString()) } catch (e) {  }

// trainchinese_cache_ = Object.values(trainchinese_cache).flat().filter(R.identity)
// trainchinese_cache_ = trainchinese_cache_.filter(x => x.ch.length == 1)
// trainchinese_cache_ = R.uniq(trainchinese_cache_)
// trainchinese_cache_ = R.groupBy(R.prop('ch'), trainchinese_cache_)
// Object.keys(trainchinese_cache_).length

async function trainchinese_with_cache(dom, sentence) {
  const cached = trainchinese_cache[sentence]
  if (cached) { return cached }

  const x = await require('./trainchinese').trainchinese(dom, sentence)
  trainchinese_cache[sentence] = x

  fs.writeFileSync(trainchinese_with_cache_path, JSON.stringify(trainchinese_cache))

  return x
}

exports.trainchinese_with_cache = trainchinese_with_cache
