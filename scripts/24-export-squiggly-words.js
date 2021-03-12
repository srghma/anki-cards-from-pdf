const fetch = require('node-fetch')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const easypronunciation_chinese = require('./scripts/lib/easypronunciation_chinese').easypronunciation_chinese
const processPurpleculture = require('./scripts/lib/processPurpleculture').processPurpleculture

selectedWords = R.uniq(require('/home/srghma/projects/anki-cards-from-pdf/from-pdf-tmp.json').map(x => fixRadicalToKanji(x.annotation_text).split('').filter(isHanzi).join('')))

translation = await translate.translate(selectedWords.join('\n'), 'en')
translation = translation[0].split('\n').filter(x => x !== '')

if (translation.length !== selectedWords.length) { throw new Error('not equal length') }

sentencesDeck = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: "hanzi english ruby".split(" ") })))

selectedWordsWithTr = R.zipWith((word, translation) => { return { word, translation, decks: sentencesDeck.filter(x => x.hanzi.includes(word)) } }, selectedWords, translation)

ierogliphs = R.uniq(selectedWords.map(x => x.split('')).flat())
ierogliphs = ierogliphs.map(i => ({ i, words: selectedWordsWithTr.filter(x => x.word.includes(i)) }))
// console.log(JSON.stringify(ierogliphs[0]))

ierogliphs = ierogliphs.map(({ i, words }) => {
  const contextes = words.map((x) => {
    const decks = x.decks.slice(0, 3).map(deck => {
      return `<div class="context__deck"><span class="context__decks__hanzi">${deck.hanzi}</span><span class="context__decks__hanzi">${deck.english}</span></div>`
    }).join('\n')

    return `<div class="context"><span class="context__word">${x.word}</span><span class="context__translation">${x.translation}</span><span class="context__decks">\n${decks}\n</span></div>`
  })

  return {
    i,
    words: `<div class="contextes">${contextes.join('\n')}</div>`,
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(ierogliphs);
