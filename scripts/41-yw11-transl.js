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

const yw11_dictionary_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/yw11_dictionary_cache.json'

yw11_dictionary_cache = JSON.parse(fs.readFileSync(yw11_dictionary_with_cache_path).toString())
yw11_dictionary_cache = R.toPairs(yw11_dictionary_cache).map(x => ({ k: x[0], tr: x[1] }))

// function removeHTML(text) {
//   return text.replace(/<style[^>]*>.*<\/style>/gm, '')
//       // Remove script tags and content
//       .replace(/<script[^>]*>.*<\/script>/gm, '')
//       // Remove all opening, closing and orphan HTML tags
//       .replace(/<[^>]+>/gm, '')
//       // Remove leading spaces and repeated CR/LF
//       .replace(/([\r\n]+ +)+/gm, '');
// }

// yw11_dictionary_cache_ = yw11_dictionary_cache.map(x => ({ k: x.k, tr: require('html-to-markdown').convert(x.tr) }))
yw11_dictionary_cache = yw11_dictionary_cache.filter(x => x.tr)
yw11_dictionary_cache_ = yw11_dictionary_cache.map(x => ({ k: x.k, tr: x.tr.replace(/　　　/g, ', ') }))

yw11_dictionary_cache_ = yw11_dictionary_cache_.map(x => ({ k: x.k, tr: removeHTML(dom, x.tr) }))
yw11_dictionary_cache__ = yw11_dictionary_cache_.map(x => ({ k: x.k, tr: x.tr.split('\n').map(R.trim).join('\n').replace(/\n+/g, '\n') }))
yw11_dictionary_cache___ = R.splitEvery(30, yw11_dictionary_cache__)

output__ = []
promises = yw11_dictionary_cache___.map((x, index) => async jobIndex => {
  const sep = '\n+++++++++++++++++++++\n'
  const translationInput = x.map(R.prop('tr')).join(sep)
  try {
    let translation = await require('./scripts/lib/google_translate_with_cache').google_translate_with_cache(translationInput, { from: 'zh', to: 'en' })
    translation = translation.split('+++++++++++++++++++++').filter(R.identity)
    console.log({
      m: 'finish',
      trl: translation.length,
      xl: x.length,
    })
    // console.log({
    //   m: 'finish',
    //   translation,
    //   // x,
    // })
    if (translation.length !== x.length) {
      console.log({
        m: 'error',
        translation,
        // x,
      })
      return
    }
    const output = R.zipWith((en_transl, x) => ({ ...x, en_transl }), translation, x)
    console.log({ m: 'finished', index, from: yw11_dictionary_cache___.length })
    output__.push(output)
  } catch (e) {
    console.log(e)
  }
})
await mkQueue(2).addAll(promises)

require('./scripts/lib/google_translate_with_cache').google_translate_sync()

yw11_dictionary_cache___.length
output__.length

yw11_dictionary_cache__.length
output__.flat().length

output___ = output__.flat().map(x => ({ k: x.k, en_transl: x.en_transl.trim().replace(/\n/g, '<br>') }))

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output___);


// yw11_dictionary_cache___ = yw11_dictionary_cache__.map(({ k, tr }) => `${k}\n||------------------\n${tr}`)
// yw11_dictionary_cache___ = R.splitEvery(7000, yw11_dictionary_cache___)
// yw11_dictionary_cache___ = yw11_dictionary_cache___.map(x => x.join('\n|||---------------\n'))

// yw11_dictionary_cache___.forEach((x, i) => {
//   fs.writeFileSync(`./yw11tr${i}.txt`, x)
// })
// yw11_dictionary_cache___.length
