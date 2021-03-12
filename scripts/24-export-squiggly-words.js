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
const removeHTML = require('./scripts/lib/removeHTML').removeHTML

selectedWords = R.uniq(require('/home/srghma/projects/anki-cards-from-pdf/from-pdf-tmp.json').map(x => fixRadicalToKanji(x.annotation_text).split('').filter(isHanzi).join('')))

translation = await translate.translate(selectedWords.join('\n'), 'en')
translation = translation[0].split('\n').filter(x => x !== '')

if (translation.length !== selectedWords.length) { throw new Error('not equal length') }

sentencesDeck = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: "hanzi english ruby".split(" ") })))

selectedWordsWithTr = R.zipWith((word, translation) => { return { word, translation, decks: sentencesDeck.filter(x => x.hanzi.includes(word)) } }, selectedWords, translation)

function printDeckItem(deck) {
  return `<div class="context__deck"><span class="context__decks__hanzi">${deck.hanzi}</span><span class="context__decks__english">${deck.english}</span></div>`
}

ierogliphs = R.uniq(selectedWords.map(x => x.split('')).flat())
ierogliphs = ierogliphs.map(i => ({ i, words: selectedWordsWithTr.filter(x => x.word.includes(i)) }))
// console.log(JSON.stringify(ierogliphs[0]))
ierogliphs = ierogliphs.map(({ i, words }) => {
  const contextes = words.map((x) => {
    return `<div class="context"><span class="context__word">${x.word}</span><span class="context__translation">${x.translation}</span><span class="context__decks">\n${x.decks.slice(0, 3).map(printDeckItem).join('\n')}\n</span></div>`
  })
  return {
    i,
    words: `<div class="contextes">${contextes.join('\n')}</div>`,
  }
})

async function mymapper(x) {
  const sentence = removeHTML(dom, x.word)
  let purpleculture_raw = null
  try {
    purpleculture_raw = await require('./scripts/lib/purpleculter_get').purpleculter_get(dom, sentence)
    console.log({ sentence, purpleculture_raw })
  } catch (e) {
    console.error({ e, x })
    return
  }

  return {
    ...x,
    purpleculture_raw,
  }
}

output = []
;(async function(input){
  for (let i = 0; i < input.length; i++) {
    const res = await mymapper(input[i])
    if (res) {
      fs.appendFileSync('allsetpinyincache.json', JSON.stringify(res))
      output.push(res)
    }
    console.log({ i, l: input.length })
  };
})(selectedWordsWithTr);

ipwordscache_path = '/home/srghma/projects/anki-cards-from-pdf/ipacache.json'
ipwordscache = JSON.parse(require('fs').readFileSync(ipwordscache_path))

// console.log(output.map(x => x.word).join('\n'))

output_ = output.map(x => {
  const ruby = require('./scripts/lib/processPurpleculture').processPurpleculture(ipwordscache, x.purpleculture_raw)
  return {
    // ...x,
    // sentence_without_html
    // en_cased:    rubyToDifferentPinyin(dom, 'en', 'cased', ruby),
    hanzi:         x.word.replace(/\s+/g, ' ').trim(),
    english:       x.translation,
    article_title: `<span class="context__decks">\n${x.decks.slice(0, 3).map(printDeckItem).join('\n')}\n</span>`,
    ruby,
    ruby_raw:      x.purpleculture_raw,
    ru_marked:     rubyToDifferentPinyin(dom, 'ru', 'marked', ruby),
    ru_numbered:   rubyToDifferentPinyin(dom, 'ru', 'numbered', ruby),
    en_marked:     rubyToDifferentPinyin(dom, 'en', 'marked', ruby),
    en_numbered:   rubyToDifferentPinyin(dom, 'en', 'numbered', ruby),
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
