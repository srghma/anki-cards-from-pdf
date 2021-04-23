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

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))
input = input.map(x => ({ kanji: x.kanji, purpleculture_dictionary_orig_transl: x._1.trim() }))
// freq = R.fromPairs(input.map(x => [x.kanji, x.freq]))
output___ = await require('./scripts/gen_purpleculture_info').gen_purpleculture_info(input)

// allKanji = R.uniq(output___.map(x => (x.purpleculture_dictionary_orig_transl || '')).join('').split('').filter(isHanzi))
// fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', allKanji.join('\n'))

// output____ = output___.map(x => ({
//   ...x,
//   sounds: Array.from(x.pinyinWithHtml.matchAll(/allsetlearning-([^\.]+).mp3/g)).map(R.prop(1)).map(x => `[sound:allsetlearning-${x}.mp3]`).join('<br>')
// }))

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output___);
