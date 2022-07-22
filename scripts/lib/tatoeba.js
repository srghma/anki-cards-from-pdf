const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray
const escapeRegExp = require('./escapeRegExp').escapeRegExp

exports.tatoeba = async function tatoeba(dom, str) {
  function parse(t) {
    dom.window.document.body.innerHTML = t
    let div = dom.window.document.body.querySelector('div#content')
    if (!div) { throw new Error('no div') }
    div = Array.from(div.querySelectorAll('div[sentence-and-translations]'))
    div = div.map(x => x.getAttribute('ng-init').replace(/^vm\.init\(/g, `[`).replace(/, 'rus'\)$/g, `]`).replace(/, 'eng'\)$/g, `]`))
    div = div.map(x => {
      try {
        return JSON.parse(x)
      } catch (e) {
        console.log(e, x)
        throw e
      }
    })
    return div
  }

  let t = await fetch(`https://tatoeba.org/en/sentences/search?from=spa&has_audio=yes&native=&orphans=no&query=${encodeURIComponent(str)}&sort=relevance&sort_reverse=&tags=&to=rus&trans_filter=limit&trans_has_audio=&trans_link=&trans_orphan=&trans_to=rus&trans_unapproved=&trans_user=&unapproved=no&user=`)
  t = await t.text()
  t = parse(t)

  if (t.length !== 0) { return t }

  let t1 = await fetch(`https://tatoeba.org/en/sentences/search?from=spa&query=${encodeURIComponent(str)}&to=rus`)
  t1 = await t1.text()
  t1 = parse(t1)

  if (t1.length !== 0) { return t1 }

  let t2 = await fetch(`https://tatoeba.org/en/sentences/search?from=spa&query=${encodeURIComponent(str)}&to=eng`)
  t2 = await t2.text()
  t2 = parse(t2)

  if (t2.length === 0) {
    console.log('NOTHING FOUND FOR')
    console.log({
      str,
      x: `https://tatoeba.org/en/sentences/search?from=spa&has_audio=yes&native=&orphans=no&query=${encodeURIComponent(str)}&sort=relevance&sort_reverse=&tags=&to=rus&trans_filter=limit&trans_has_audio=&trans_link=&trans_orphan=&trans_to=rus&trans_unapproved=&trans_user=&unapproved=no&user=`,
      x1: `https://tatoeba.org/en/sentences/search?from=spa&query=${encodeURIComponent(str)}&to=rus`,
      x2: `https://tatoeba.org/en/sentences/search?from=spa&query=${encodeURIComponent(str)}&to=eng`,
    })
    return null
  }

  return t2
}

/////////////////
const tatoeba_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/tatoeba_cache.json'
let tatoeba_cache = {}
try { tatoeba_cache = JSON.parse(fs.readFileSync(tatoeba_with_cache_path).toString()) } catch (e) {  }

let eachNIndex = 0
exports.tatoeba_with_cache = async function tatoeba_with_cache(dom, word) {
  const cached = tatoeba_cache[word]
  if (cached) { return cached }

  const x = await exports.tatoeba(dom, word)
  // const x = null
  // if (x) {
  tatoeba_cache[word] = x
  eachNIndex++
  if (eachNIndex % 10 === 0) {
    console.log(`syncing tatoeba ${eachNIndex}`)
    fs.writeFileSync(tatoeba_with_cache_path, JSON.stringify(tatoeba_cache))
  }
  // }
  return x
}

exports.tatoeba_syncronize = function tatoeba_syncronize() {
  fs.writeFileSync(tatoeba_with_cache_path, JSON.stringify(tatoeba_cache))
}
