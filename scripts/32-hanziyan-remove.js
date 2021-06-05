const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const svg2img = require('svg2img')
const btoa = require('btoa')
const mkdirp = require('mkdirp')

allKanjiOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: "kanji _1 _2".split(" ") })))
allKanjiOrig_ = allKanjiOrig.map(x => {
  const f = x => x.replace(' style="padding-top:30px; "', '').replace('<br style="clear:left; ">', '').replace(' class="isection wiki_class"', '').replace(/&nbsp; <\/div>$/, '').replace(/^<div> /, '')
  const _1 = f(x._1)
  const _2 = f(x._2)
  return { kanji: x.kanji, _1, _2  }
})

// ;(function(input){
//   const s = input.map(x => Object.values(x).join('\t')).join('\n')
//   // const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
//   // const s = require('csv-writer').createObjectCsvStringifier({ header, fieldDelimeter: ";" }).stringifyRecords(input)
//   fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
// })(allKanjiOrig_);

;(function(input){
  const s = input.map(x => Object.values(x).join('\t')).join('\n')
  // const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  // const s = require('csv-writer').createObjectCsvStringifier({ header, fieldDelimeter: ";" }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(allKanjiOrig_);
