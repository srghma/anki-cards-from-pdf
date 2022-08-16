const fetch = require('node-fetch')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const removeHTML = require('./scripts/lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./scripts/lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./scripts/lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const TongWen = require('./scripts/lib/TongWen').TongWen
{ etimologias } = require('./scripts/lib/etimologiasdechile')
const { JSDOM } = require("jsdom");
const dom = new JSDOM(``);
queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
removeAccent = str => str.normalize("NFD").replace(/\p{Diacritic}/gu, "")
const { sd2json } = require("dict-sd2json")

esencialEsEs = await sd2json("/home/srghma/Desktop/esstarsict/EsEs/DELE_VOX/DELE_VOX_EsEs.ifo")
esencialEsEs = esencialEsEs.docs
esencialEsEs = esencialEsEs.map(R.over(R.lensProp('trns'), xs => {
  xs = xs || []
  xs = xs.map(x => Array.isArray(x) ? x.join('') : x)
  return xs
})).filter(x => x._id.length !== 1)

esencialEsEs = esencialEsEs.map(x => x._id)

async function mapper(output, x, inputIndex, dom) {
  if(!x) { throw new Error('') }
  let word = null
  try {
    word = await require('./scripts/lib/wiktionary').wiktionary_with_cache(x, 'en')
    // console.log({ word, word })
  } catch (e) {
    console.error({ word, e })
    return
  }
  output.push({
    x,
    word,
  })
}
output = []
mkQueue(queueSize).addAll(esencialEsEs.map((x, inputIndex) => async jobIndex => { await mapper(output, x, inputIndex) }))
require('./scripts/lib/wiktionary').wiktionary_syncronize()

output_ = output.filter(x => x.word).map(x => ({ word: x.x, html: x.word.html.split('<h2><span id="').filter(x => x).map(html => {
  const [h2, text] = html.split('</span></h2>')
  if (!text) { return null }
  const h2_ = h2.split('">')[0]
  try {
    return { name: h2_, text: text.trim() }
  } catch (e) {
    console.log({ x, html })
    throw e
  }
}).filter(x => x) }))

output_ = output_.map(({ word, html }) => {
  if (html.length === 1) { return { word, html: html[0].text } }
  const spanish = html.find(x => x.name === 'Spanish')
  // console.log(spanish)
  if (spanish) { return { word, html: spanish.text } }
  let vars = [
    'English',
    'Latin',
    'Galician',
    'French',
    'Portuguese',
    'Italian',
  ]
  vars = vars.map(lang => ({ lang, text: html.find(x => x.name === lang) }))
  vars = vars.filter(({ lang, text }) => text)
  vars = vars.map(({ lang, text }) => ({ lang, text: text.text }))
  vars = vars.slice(0, 3)
  vars = vars.map(({ lang, text }) => `<h2>${lang}</h2><br>${text}`).join(`<br>`)
  // try {
  return { word, html: vars }
  // } catch (e) {
  //   console.log({ word, html })
  //   throw e
  // }
})

output_ = output_.map(({ word, html }) => {
  try {
    return { word, html: html.replace(/ id="[^"]+"/g, '').replace(/\n/g, '') }
  } catch (e) {
    console.log({ word, html })
    throw e
  }
})

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/sdf.csv', s)
})(output_);
