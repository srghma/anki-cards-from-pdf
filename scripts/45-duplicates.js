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
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Selected Notes.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

input = R.groupBy(R.prop('kanji'), input)

input = R.mapObjIndexed(xs => xs.map(x => ({ bkrs_e: x._94.split(', '), tr: x._95 })), input)

input = R.mapObjIndexed(xs => ({ bkrs_e: xs.map(R.prop('bkrs_e')).filter(x => x !== '-' && x !== '<div>-</div>').join(','), tr: R.uniq(xs.map(R.prop('tr'))).join('') }), input)

input = R.toPairs(input).map(x => ({ k: x[0], ...x[1] }))

input = input.map(x => ({ ...x, bkrs_e: R.uniq(x.bkrs_e.replace(/-/g, '').split(',').filter(R.identity).map(R.trim).filter(R.identity)).join(', ') }))

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input);
