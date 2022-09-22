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

headers = [
  'es',
  'ex_es',
  'ex_ru',
  'esencialEsEs',
  'universalEsRu',
  'ruPopup',
  'ruModernUsage',
  'larousse',
  'modernslang',
  'mostUsed',
  'etimologyEs',
  'etimologyRu',
  'conjucations_table',
  'esencialEsEs__type',
  'esencialEsEs__ru',
  // 'es + esencialEsEs__type',
  // 'orderN'
]
inputOrig_ = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/spanish essential 50000.txt`).pipe(csv({ separator: "\t", headers })))

input = inputOrig_.map(x => {
  return {
    es:            x.es,
    esencialEsEs:  x.esencialEsEs.replace(new RegExp(x.es, "gi"), "~"),
    universalEsRu: x.universalEsRu.replace(new RegExp(x.es, "gi"), "~"),
  }
})

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/sdf.csv', s)
})(input);
