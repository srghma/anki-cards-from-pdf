const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray
const escapeRegExp = require('./escapeRegExp').escapeRegExp

exports.forvo_es = async function forvo_es(dom, str) {
  let t = await fetch(`https://forvo.com/search/${encodeURIComponent(str)}/es/`)
  t = await t.text()
  // t = parse(t)
  const [with_word_html, related_html] = t.split('Related words and phrases')

  const parse = x => {
    if (!x) { return undefined }
    dom.window.document.body.innerHTML = x
    let div = Array.from(dom.window.document.body.querySelectorAll('div.play'))
    div = div.map(x => {
      let url = x.getAttribute('onclick').replace(/\);return false;$/g, '').replace(/^Play\(/g, '')
      // try {
      //   url = `[${url}]`
      //   url = JSON.parse(url)
      // } catch (e) {
      //   console.log(e, url)
      // }
      const title = x.getAttribute('title')
      return { url, title: x.getAttribute('title').replace(/^Listen/, '').replace(/pronunciation$/, '').trim() }
    })
    return div
  }

  const word = parse(with_word_html)
  const related = parse(related_html)

  return { word, related }
}

/////////////////
const forvo_es_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/forvo_es_cache.json'
let forvo_es_cache = {}
try { forvo_es_cache = JSON.parse(fs.readFileSync(forvo_es_with_cache_path).toString()) } catch (e) {  }

let eachNIndex = 0
exports.forvo_es_with_cache = async function forvo_es_with_cache(dom, word) {
  const cached = forvo_es_cache[word]
  if (forvo_es_cache.hasOwnProperty(word)) { return cached }

  const x = await exports.forvo_es(dom, word)
  // const x = null
  // if (x) {
  forvo_es_cache[word] = x
  eachNIndex++
  if (eachNIndex % 10 === 0) {
    console.log(`syncing forvo_es ${eachNIndex}`)
    fs.writeFileSync(forvo_es_with_cache_path, JSON.stringify(forvo_es_cache))
  }
  // }
  return x
}

exports.forvo_es_syncronize = function forvo_es_syncronize() {
  fs.writeFileSync(forvo_es_with_cache_path, JSON.stringify(forvo_es_cache))
}
