const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray
const escapeRegExp = require('./escapeRegExp').escapeRegExp
const wiktionary = require('wiktionary')

/////////////////
const wiktionary_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/wiktionary_cache.json'
let wiktionary_cache = {}
try { wiktionary_cache = JSON.parse(fs.readFileSync(wiktionary_with_cache_path).toString()) } catch (e) {  }

let eachNIndex = 0
exports.wiktionary_with_cache = async function wiktionary_with_cache(word, language) {
  const cached = wiktionary_cache[word]
  if (wiktionary_cache.hasOwnProperty(word)) { return cached }

  const x = await wiktionary(word, language)
  // const x = null
  // if (x) {
  wiktionary_cache[word] = x
  eachNIndex++
  if (eachNIndex % 10 === 0) {
    console.log(`syncing wiktionary ${eachNIndex}`)
    fs.writeFileSync(wiktionary_with_cache_path, JSON.stringify(wiktionary_cache))
  }
  // }
  return x
}

exports.wiktionary_syncronize = function wiktionary_syncronize() {
  fs.writeFileSync(wiktionary_with_cache_path, JSON.stringify(wiktionary_cache))
}
