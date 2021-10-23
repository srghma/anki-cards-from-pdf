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

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))

  return filesAbsPath.map(file => {
    let x = require('fs').readFileSync(file).toString() // .replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)

    x = x.split(/―{2,}|-{2,}/).map(R.trim)

    x = x.filter(content => {
      if (content.length === 1) {
        if (isHanzi(content[0])) {
          return false
        }
      }
      return true
    })

    x = x.join('\n\n-----\n\n')

    return { file, x }
  })
}

subCh = await readdirFullPath("/home/srghma/projects/anki-cards-from-pdf/ru-pinyin")
