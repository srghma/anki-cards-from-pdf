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
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const escapeRegExp = require('./scripts/lib/escapeRegExp').escapeRegExp
queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })

inputOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/my spanish verbs 1000.txt').pipe(csv({ separator: "\t", headers: "verb".split(' ') })))
input = inputOrig.map(x => x.verb)

async function mapper(output, x, inputIndex, dom) {
  word = x
  if(!word) { throw new Error('') }
  let transl = null
  try {
    transl = await require('./scripts/lib/tatoeba').tatoeba_with_cache(dom, word)
    // console.log({ word, transl })
  } catch (e) {
    console.error({ word, e })
    return
  }
  output.push({
    x,
    transl,
  })
}
output = []
mkQueue(queueSize).addAll(input.map((x, inputIndex) => async jobIndex => { await mapper(output, x, inputIndex, doms[jobIndex]) }))
require('./scripts/lib/tatoeba').tatoeba_syncronize()

bable_cache = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/bable-examples.json').toString())
spanishdict_cache = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/spanishdict.json').toString())
baidu_google_es_to_en = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_en.json').toString())
baidu_google_es_to_ru = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_ru.json').toString())

output_ = R.fromPairs(output.map(x => [x.x, x.transl])); null
input_ = input.map(x => ({ x, transl: output_[x], bable: bable_cache[x], spanishdict: spanishdict_cache[x] }))
input_ = input_.map(x => {
  let transl = x.transl
  if (transl) {
    transl = transl.map(x => x[1])
    transl = transl.map(x => {
      if (!x.text) { throw new Error(x) }
      if (x.translations.length === 0) { throw new Error(x) }
      return {
        text: x.text,
        translations: x.translations,
      }
    })
  }
  return { ...x, transl }
})
input_ = input_.map(x => {
  let transl = x.transl
  if (transl) {
    transl = transl.map(x => {
      let ruArray = R.uniq(x.translations.flat().filter(x => x.lang_tag === 'ru').map(x => x.text))
      let enArray = R.uniq(x.translations.flat().filter(x => x.lang_tag === 'en').map(x => x.text))
      return {
        es: x.text,
        ruArray,
        enArray,
      }
    })
  }
  // return transl
  return { ...x, transl }
})

// input_.filter(x => (x.transl || []).length === 0 && (x.bable || []).length === 0)
// input_.filter(x => (x.spanishdict || []).length === 0)[0]

firstThreeArray = input_.map(({ x, transl, bable, spanishdict }) => {
  // console.log({ x, transl, bable, spanishdict })
  let firstThree = []
  if (x === 'enflorar') {
    firstThree = [{ es: 'Enfloramos los bancos de la iglesia para la boda', ruArray: ['мы украсили скамьи церкви на свадьбу'], enArray: [] }]
  } else if (x === 'porracear') {
    firstThree = [{ es: 'Lo porraceó hasta que acabó confesando el nombre de su compinche', ruArray: ['он избивал его, пока тот не признал имя своего приятеля'], enArray: [] }]
  } else {
    const firstThree1 = (spanishdict || []).slice(0, 2).map(({ es, en }) => ({ es: es.trim(), ruArray: [], enArray: [en] }))
    const firstThree2 = (transl || []).map(x => {
      return {
        es: x.es.trim(),
        ruArray: x.ruArray.map(x => x.trim()).sort().reverse().slice(0, 3),
        enArray: x.enArray.map(x => x.trim()).sort().reverse().slice(0, 3),
      }
    }).slice(0, 2)
    firstThree = [...firstThree1, ...firstThree2]
  }
  if (firstThree.length === 0) {
    console.log({ x, transl, bable, spanishdict })
    throw new Error('x')
  }
  firstThree = firstThree.map(({ es, ruArray, enArray }) => {
    return {
      es,
      ruArray: R.uniq([...ruArray, baidu_google_es_to_ru[es]]),
      enArray: R.uniq([...enArray, baidu_google_es_to_en[es]]),
    }
  })
  return { word: x, firstThree }
})

// sentences = firstThreeArray.map(x => x.firstThree).flat().map(x => x.es)
// fs.writeFileSync('/home/srghma/Downloads/sdf.csv', sentences.join('\n'))
// sentencesTransl = fs.readFileSync('/home/srghma/Downloads/sdf-_1_.csv').toString().trim().split('\n')

// // =GOOGLETRANSL(text, "es", "ru")
// sentencesTransl = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/sdf-_2_.csv`).pipe(csv({ separator: ",", headers: "w".split(' ') })))
// sentencesTransl = sentencesTransl.map(x => x.w.trim())
// console.log(sentences.length, sentencesTransl.length)
// translations = R.fromPairs(R.zip(sentences, sentencesTransl))
// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_ru.json', JSON.stringify(translations, undefined, 2))

firstThreeArrayHTML = firstThreeArray.map(x => {
  const div = (type, text) => text ? `<div class="example-sentence-translation-${type}">${text}</div>` : ''
  const p = (text) => text ? `<p>${text}</p>` : ''
  const transl = x.firstThree.map(({ es, ruArray, enArray }) => {
    const answer = [
      div('ru', ruArray.map(p).join('')),
      div('en', enArray.map(p).join('')),
    ].join('')
    return [
      `<div class="example-sentence-translation-es">${es}</div>`,
      div('answer', answer)
    ].join('')
  }).map(x => `<div class="example-sentence-translation">${x}</div>`).join('')
  return { word: x.word, transl }
})

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/sdf.csv', s)
})(firstThreeArrayHTML);

// tatoeba_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/tatoeba_cache.json'
// tatoeba_cache = JSON.parse(fs.readFileSync(tatoeba_with_cache_path).toString())
// output.filter(x => x.transl.length === 0).map(x => x.x).forEach(x => {
//   delete tatoeba_cache[x]
// })
// fs.writeFileSync(tatoeba_with_cache_path, JSON.stringify(tatoeba_cache))
