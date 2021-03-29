const fetch = require('node-fetch')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
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
const mkQueue = require('./scripts/lib/mkQueue').mkQueue

sherlockSentencesTable = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: "ch en article mypurpleculture".split(' ') })))

first = sherlockSentencesTable.filter(x => x.article == '')
sherlockSentencesTable_ = R.concat(first, sherlockSentencesTable).map(x => {
  dom.window.document.body.innerHTML = x.mypurpleculture
  mypurpleculture = mapWithForEachToArray(dom.window.document.body.querySelectorAll('.tooltips'), node => node.textContent.trim()).map(x => x.split('').filter(isHanzi).join('')).filter(R.identity)
  return mypurpleculture.map(mypurpleculture => ({ mypurpleculture, ...(R.pick("ch en article".split(' '), x)) }))
}).flat()
sherlockSentencesTable_ = R.groupBy(R.prop('mypurpleculture'), sherlockSentencesTable_)
sherlockSentencesTable_ = R.mapObjIndexed(R.pipe(R.slice(0, 5), R.sortBy(R.prop('article')), R.uniqBy(R.prop('ch'))), sherlockSentencesTable_)
sherlockSentencesTable_ = R.map(x => ({ word: x[0], sentences: x[1] }), R.toPairs(sherlockSentencesTable_))

function printDeckItem(deck) {
  return `<div class="context__deck"><span class="context__decks__hanzi">${deck.hanzi}</span><span class="context__decks__english">${deck.english}</span></div>`
}

allKanjiTable = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

async function mapper(output, { word, sentences }, inputIndex, dom) {
  // // custom translation
  // if (x.word.length == 1) {
  //   const kanjiElemWithTr = allKanjiTable.find(kanjiElem => kanjiElem.kanji == x.word)
  //   if (!kanjiElemWithTr) { throw new Error('asdfasdf') }
  //   english = kanjiElemWithTr._54 + '<br>' + kanjiElemWithTr._55
  // }
  // let purpleculture_raw = null
  // try {
  //   purpleculture_raw = await require('./scripts/lib/purpleculture_pinyin_converter').purpleculture_pinyin_converter_with_cache(dom, word)
  //   console.log({ word, purpleculture_raw })
  // } catch (e) {
  //   console.error({ e, x })
  //   return
  // }

  let trainchinese = null
  try {
    trainchinese = await require('./scripts/lib/trainchinese').trainchinese_with_cache(dom, word)
    console.log({ word, trainchinese })
  } catch (e) {
    console.error({ e, word })
    return
  }

  let purpleculture_dictionary = null
  try {
    purpleculture_dictionary = await require('./scripts/lib/purpleculture_dictionary').purpleculture_dictionary_with_cache(dom, word)
    console.log({ word, purpleculture_dictionary })
  } catch (e) {
    console.error({ e, word })
    return
  }

  output.push({
    word,
    sentences,
    // purpleculture_raw,
    trainchinese,
    purpleculture_dictionary,
  })
}

output = []
const queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
await mkQueue(queueSize).addAll(sherlockSentencesTable_.map((x, inputIndex) => async jobIndex => { mapper(output, x, inputIndex, doms[jobIndex]) }))

ipwordscache_path = '/home/srghma/projects/anki-cards-from-pdf/ipacache.json'
ipwordscache = JSON.parse(require('fs').readFileSync(ipwordscache_path))
console.log(output.map(x => x.word).filter(x => ipwordscache[x] == null).join('\n'))

output_ = output.map(x => {
  dom.window.document.body.innerHTML = x.purpleculture_dictionary
  let purpleculture_dictionary_en = dom.window.document.querySelector('.en')

  if (purpleculture_dictionary_en) {
    purpleculture_dictionary_en = purpleculture_dictionary_en.textContent.trim()
    purpleculture_dictionary_en = purpleculture_dictionary_en.replace(/Classifiers: \S+/g, '')
    if (purpleculture_dictionary_en.startsWith('old variant of')) { purpleculture_dictionary_en = null }
  }

  // const asdfasdf = x.trainchinese.map(x => x.ch)
  // console.log({
  //   w: x.word,
  //   wl: x.word.length,
  //   // trainchinese: x.trainchinese,
  //   x: asdfasdf,
  //   xl: asdfasdf.map(x => x.length),
  //   y: asdfasdf.filter(y => y.length == x.word.length)
  // })

  let trainchinese = x.trainchinese.filter(x => x).filter(y => y.ch == x.word).map(x => {
    const pinyin = '<span class="trainchinese-pinyin">' + x.pinyin + '</span>'
    const type = '<span class="trainchinese-type">' + x.type + '</span>'
    const transl_____ = '<span class="trainchinese-transl">' + x.transl + '</span>'

    const res = pinyin + ': (' + type + ') ' + transl_____
    return res
  })

  let english = [ x.translation, purpleculture_dictionary_en, ...trainchinese ].filter(R.identity).join('\n<br>\n')

  const ruby = require('./scripts/lib/processPurpleculture').processPurpleculture(ipwordscache, x.purpleculture_raw)

  return {
    // ...x,
    // sentence_without_html
    // en_cased:    rubyToDifferentPinyin(dom, 'en', 'cased', ruby),
    hanzi:         x.word.replace(/\s+/g, ' ').trim(),
    english,
    article_title: `<span class="context__decks">\n${x.decks.slice(0, 3).map(printDeckItem).join('\n')}\n</span>`.replace(new RegExp(x.word, "g"), `<b>${x.word}</b>`),
    ruby,
    ruby_raw:      x.purpleculture_raw,
    en_marked:     rubyToDifferentPinyin(dom, 'en', 'marked', ruby),
    en_numbered:   rubyToDifferentPinyin(dom, 'en', 'numbered', ruby),
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
