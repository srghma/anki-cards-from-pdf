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

inputOrig_ = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/spanish essential 50000.txt').pipe(csv({ separator: "\t", headers: "id extra_es extra_ru".split(' ') })))

normalize = x => x ? x.replace('[sound:', '').replace(']', '') : undefined

inputOrig = inputOrig_.map(x => ({ la: x._13, id: x.id, forvo: normalize(x._17), google: normalize(x._18), orderN: x._22, orderN: Number(x._22) }))
inputOrig = R.sortBy(R.prop('orderN'), inputOrig)
inputOrig = inputOrig.filter(x => x.google)
// inputOrig = inputOrig.slice(0, 2)

output_ = [ { id: '1', x: '<table>' + inputOrig.map(x => `<tr><td>${x.la}</td><td>${x.id}</td><td>${x.google}</td><td>${x.google}</td><td>${x.google}</td><td>${x.forvo || x.google}</td></tr>`).join('') + '</table>' } ]

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/sdf.csv', s)
})(output_);
