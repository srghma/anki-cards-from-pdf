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
const mkQueue = require('./scripts/lib/mkQueue').mkQueue

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/big-table.csv').pipe(csv({ separator: ",", headers: [ "word", "freq" ] })))

// words = input.map(x => x.word).join('\n')
// ru_transl = await translate.translate(words, 'ru')
// ru_transl_ = ru_transl.split('\n')

const queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
output = []
promises = input.map((x, inputIndex) => async jobIndex => {
  const word = x['word']
  console.log({ m: "doing", inputIndex, jobIndex, word })
  const dom = doms[jobIndex]
  if (!RA.isNonEmptyString(word)) { throw new Error('word') }
  if (!dom) { throw new Error('dom') }
  // let ru_transl = await require('./scripts/lib/google_translate_with_cache').google_translate_with_cache(word, 'ru')

  let dict = null
  try {
    dict = await require('./scripts/lib/purplecultre_dictionary').purplecultre_dictionary_with_cache(dom, word)
  } catch (e) {
    console.error({ m: "error", inputIndex, word, e })
    return
  }

  let translation = null
  try {
    translation = await require('./scripts/lib/purplecultre_pinyin_converter').purplecultre_pinyin_converter_with_cache(dom, word)
  } catch (e) {
    console.error({ m: "error", inputIndex, word, e })
    return
  }

  if (translation) {
    console.log({ m: "finished", jobIndex, inputIndex, length: input.length })
    output.push({ ...x, dict, translation })
  }
})
mkQueue(queueSize).addAll(promises)

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output);
