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
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const escapeRegExp = require('./scripts/lib/escapeRegExp').escapeRegExp
const XLSX = require('xlsx')
dictionary = require('chinese-dictionary')

tOrig = fs.readFileSync('/tmp/zsh5aMiGk').toString()
tOrig = tOrig.split('\n').filter(R.identity)

output = []
buffer = null
tOrig.forEach(x => {
  if (x.startsWith('\\section')) {
    console.log(x)
    if (buffer) { output.push(buffer) }
    buffer = {
      h: x.replace(/\\section /g, ''),
      x: [],
    }
  } else {
    if (buffer) {
      buffer.x.push(Number(x))
    }
  }
})

output_ = output.map(x => x.x.map(elem => x.h + elem)).flat()

output_.forEach(x => {
  fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/ru-pinyin/${x}.html`, html_)
})
