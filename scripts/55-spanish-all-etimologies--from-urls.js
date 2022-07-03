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
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});

// await etimologias(dom, 'nomofilo')

etimologias_cache__urls = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/etimologias_cache--urls--without-nulls.json').toString())
etimologias_cache__urls = R.uniq(Object.values(etimologias_cache__urls)).sort()

etimologias_with_ru_cache = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/etimologias_with_ru_cache.json').toString()); null

etimologias_cache = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/etimologias_cache.json').toString()); null
// R.filter(x => !x, etimologias_cache)

etimologias_cache__sections = R.uniq(R.values(etimologias_cache).filter(x => x).map(R.prop('sections')).flat()).sort()
etimologias_cache__sections = etimologias_cache__sections.filter(x => x.length > 1)

etimologias_cache__keys = R.uniq(R.keys(etimologias_cache)).sort()
etimologias_cache__keys = etimologias_cache__keys.filter(x => x.length > 1)

etimologias_cache_ = R.without(etimologias_cache__keys, [...etimologias_cache__sections, ...etimologias_cache__urls])

async function mapper(output, word, inputIndex, dom) {
  if(!word) { throw new Error('') }
  let transl = null
  try {
    transl = await require('./scripts/lib/etimologiasdechile').etimologias_with_cache(dom, word)
    console.log({ word, inputIndex })
  } catch (e) {
    console.error({ word, e })
    return
  }
  output.push({
    word,
    transl,
  })
}
output = []
mkQueue(queueSize).addAll(etimologias_cache_.map((x, inputIndex) => async jobIndex => { await mapper(output, x, inputIndex, doms[jobIndex]) }))

{ output: output.length, etimologias_cache_: etimologias_cache_.length }

require('./scripts/lib/etimologiasdechile').etimologias_syncronize()
