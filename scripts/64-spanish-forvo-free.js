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
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const escapeRegExp = require('./scripts/lib/escapeRegExp').escapeRegExp
queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })

inputOrig_ = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/spanish essential 50000.txt').pipe(csv({ separator: "\t", headers: "id extra_es extra_ru".split(' ') })))
input = inputOrig_.map(x => x.id)
// input = input.slice(0, 2)

async function mapper(output, x, inputIndex, dom) {
  word = x
  if(!word) { throw new Error('') }
  let forvo_es = null
  try {
    forvo_es = await require('./scripts/lib/forvo').forvo_es_with_cache(dom, word)
    // console.log({ word, forvo_es })
  } catch (e) {
    console.error({ word, e })
    return
  }
  output.push({
    x,
    forvo_es,
  })
}
output = []
mkQueue(queueSize).addAll(input.map((x, inputIndex) => async jobIndex => { await mapper(output, x, inputIndex, doms[jobIndex]) }))
require('./scripts/lib/forvo').forvo_es_syncronize()

output_ = output.map(({ x, forvo_es }) => ({ es: x, ...forvo_es }))
parse = xs => (xs || []).flat().map(({ url, title }) => {
  url = url.split(',')
  url = url.map(x => {
    try {
      return JSON.parse(x)
    } catch (e) {
      if (x[0] === '\'' && R.last(x) === '\'') { return x.slice(1, -1) }
      console.log(e, url, title)
      throw e
    }
  })
  function isBase64(str) {
    if (typeof str !== 'string') { return false }
    return str.length % 4 == 0 && /^[A-Za-z0-9+/]+[=]{0,2}$/.test(str);
  }
  url = url.map(x => isBase64(x) ? atob(x) : x)
  // return url
  return { title, url }
})
output__ = output_.map(({ es, word, related }) => ({ es, word: parse(word), related: parse(related) }))

// output__.map(({ es, word, related }) => word.map(({ title, url }) => { if (es !== title) { throw new Error(es) } }))
// output__.map(({ es, word, related }) => word.filter(({ title, url }) => es !== title)).filter(x => x.length > 0)

filterMp3 = url => url.filter(x => typeof x === 'string').filter(x => x.endsWith('.mp3'))
output_ = output__.map(({ es, word, related }) => ({ es, word: word.map(x => filterMp3(x.url)), related: related.map(x => [x.title, filterMp3(x.url)]) }))
output_ = output_.map(({ es, word }) => ({ es, word: R.uniq(word.flat()) }))
output_ = output_.map(({ es, word }) => ({ es, word: word.map(url => ({ url, name: require('path').parse(url).name })) }))

output_ = output_.filter(({ es, word }) => word.length > 0)
// R.uniq(output_.map(({ es, word }) => word.length))

output_csv = output_.map(({ es, word }) => {
  const [w1, w2] = word
  const w = name => {
    if (!name) { return undefined }
    name = name.name
    if (!name) { return undefined }
    return `[sound:forvo-es-${name}.mp3]`
  }
  return { es, w1: w(w1), w2: w(w2) }
})

// x = output_csv.map(x => [x.w1, x.w2].filter(x => x)).flat()
// console.log(x.length, R.uniq(x).length)

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/sdf.csv', s)
})(output_csv);

fs.writeFileSync('/home/srghma/Downloads/sdf.txt', output_.map(({ es, word }) => word.map(({ url, name }) => `wget -nc -O "/home/srghma/.local/share/Anki2/User 1/collection.media/forvo-es-${name}.mp3" "https://audio12.forvo.com/audios/mp3/${url}"`)).flat().flat().join('\n'))
