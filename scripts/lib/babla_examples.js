const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray
const escapeRegExp = require('./escapeRegExp').escapeRegExp

exports.babla_examples = async function babla_examples(dom, str) {
  function parse(t) {
    dom.window.document.body.innerHTML = t
    let div = dom.window.document.body.querySelector('div.sense-group')
    if (!div) {
      console.log(t)
      throw new Error('no div')
    }
    return div.innerHTML.trim()
  }

  let t = await fetch(`https://es.bab.la/ejemplos/espanol/${encodeURIComponent(str)}`)
  t = await t.text()
  t = parse(t)

  return t
}

/////////////////
const babla_examples_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/babla_examples_cache.json'
let babla_examples_cache = {}
if (fs.existsSync(babla_examples_with_cache_path)) { babla_examples_cache = JSON.parse(fs.readFileSync(babla_examples_with_cache_path).toString()) }

let eachNIndex = 0
exports.babla_examples_with_cache = async function babla_examples_with_cache(dom, word) {
  const cached = babla_examples_cache[word]
  if (cached) { return cached }

  const x = await exports.babla_examples(dom, word)
  if (x) {
    babla_examples_cache[word] = x
    eachNIndex++
    if (eachNIndex % 10 === 0) {
      console.log(`syncing babla_examples ${eachNIndex}`)
      fs.writeFileSync(babla_examples_with_cache_path, JSON.stringify(babla_examples_cache))
    }
  }
  return x
}

exports.babla_examples_syncronize = function babla_examples_syncronize() {
  fs.writeFileSync(babla_examples_with_cache_path, JSON.stringify(babla_examples_cache))
}
