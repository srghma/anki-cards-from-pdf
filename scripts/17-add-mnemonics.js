const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const chinesePinyinMnemonics = require('./scripts/lib/chinesePinyinMnemonics').chinesePinyinMnemonics
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Pimsleur.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

input_ = input.map(x => {
  let sentence = x['_7'] // en numbered

  chinesePinyinMnemonics.forEach(chinesePinyinMnemonic => {
    sentence = sentence.replace(new RegExp(`${chinesePinyinMnemonic.en}(\d)`), (_, group1) => {
      return '<b>' + [
        chinesePinyinMnemonic.en,
        chinesePinyinMnemonic.ru,
        group1,
        chinesePinyinMnemonic.consonant,
        chinesePinyinMnemonic.vowel,
        chinesePinyinMnemonic.human,
        chinesePinyinMnemonic.location,
      ].join('; ') + '</b>'
    })
  })

  console.log({ before: x['_7'], sentence })

  return {
    id: x['kanji'],
    sentence
  }
})


;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
