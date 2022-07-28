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

output_ = R.fromPairs(output.map(x => [x.x, x.transl])); null
input_ = input.map(word => ({ word, transl: output_[word], bable: bable_cache[word], spanishdict: spanishdict_cache[word] }))
input_ = input_.map(x => {
  let transl = x.transl
  if (transl) {
    transl = transl.map(x => x[1])
    transl = transl.map(x => {
      if (!x.text) { throw new Error(x) }
      if (x.translations.length === 0) { throw new Error(x) }
      // if (x.audios.length === 0) { throw new Error(x) }
      return {
        text: x.text,
        translations: x.translations,
        audios: x.audios,
      }
    })
  }
  return { ...x, transl }
})
// input_[0].transl[0]
input_ = input_.map(x => {
  let transl = x.transl
  if (transl) {
    transl = transl.map(x => {
      let ruArray = R.uniq(x.translations.flat().filter(x => x.lang_tag === 'ru').map(x => x.text))
      let enArray = R.uniq(x.translations.flat().filter(x => x.lang_tag === 'en').map(x => x.text))
      return {
        es: x.text,
        audios: x.audios,
        ruArray,
        enArray,
      }
    })
  }
  // return transl
  return { ...x, transl }
})
input_ = input_.map(({ word, transl, bable, spanishdict }) => {
  return {
    word,
    transl: (transl || []).map(x => ({ ...x, es: x.es.trim() })),
    bable: (bable || []).map(x => x.trim()),
    spanishdict: (spanishdict || []).map(x => ({ ...x, es: x.es.trim() })),
  }
})

// sentences = R.uniq(input_.map(x => [x.transl.map(x => x.es), [x.bable[0]], x.spanishdict.map(x => x.es)]).flat().flat())
// sentences = firstThreeArray.map(x => x.firstThree).flat().map(x => x.es)
sentences = [...noTranslSentences]
// // fs.writeFileSync('/home/srghma/Downloads/sdf.csv', sentences.map(JSON.stringify).join('\n'))
// fs.writeFileSync('/home/srghma/Downloads/sdf.txt', [...noTranslSentences].join('\n'))
sentences_transl_ru = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/sdf-_6_-_2_.csv`).pipe(csv({ separator: ",", headers: "w".split(' ') }))).then(sentencesTransl => sentencesTransl.map(x => x.w.trim()))
sentences_transl_en = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/sdf-_6_-_1_.csv`).pipe(csv({ separator: ",", headers: "w".split(' ') }))).then(sentencesTransl => sentencesTransl.map(x => x.w.trim()))
console.log(sentences.length, sentences_transl_ru.length, sentences_transl_en.length)

// // =GOOGLETRANSL(text, "es", "ru")
// sentencesTransl =
// console.log(sentences.length, sentencesTransl.length)

// baidu_google_es_to_en = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_en.json').toString())
// translations = R.fromPairs(R.zip(sentences, sentences_transl_en))
// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_en.json', JSON.stringify({ ...baidu_google_es_to_en, ...translations }, undefined, 2))
baidu_google_es_to_en = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_en.json').toString())

// baidu_google_es_to_ru = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_ru.json').toString())
// translations = R.fromPairs(R.zip(sentences, sentences_transl_ru))
// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_ru.json', JSON.stringify({ ...baidu_google_es_to_ru, ...translations }, undefined, 2))
baidu_google_es_to_ru = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_ru.json').toString())

// input_.filter(x => (x.transl || []).length === 0 && (x.bable || []).length === 0)
// input_.filter(x => (x.spanishdict || []).length === 0)[0]

mySpanishVerbs = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/my spanish verbs 1000.txt').pipe(csv({ separator: "\t", headers: "id en es prompt image audioen audiosp section topic chapter russian etimol etimolru rugoldendict conjugationstable".split(' ') })))
mySpanishVerbs = R.fromPairs(mySpanishVerbs.map(x => [x.id, x]));null

alreadyIncludedSentences = new Set()
noTranslSentences = new Set()
firstThreeArray = input_.map(({ word, transl, bable, spanishdict }) => {
  // console.log({ word, transl, bable, spanishdict })
  let firstThree = []
  if (word === 'enflorar') {
    firstThree = [{ es: 'Enfloramos los bancos de la iglesia para la boda', ruArray: ['мы украсили скамьи церкви на свадьбу'], enArray: [] }]
  } else if (word === 'porracear') {
    firstThree = [{ es: 'Lo porraceó hasta que acabó confesando el nombre de su compinche', ruArray: ['он избивал его, пока тот не признал имя своего приятеля'], enArray: [] }]
  } else {
    const sortAndFilter = list => {
      list = list.filter(x => !alreadyIncludedSentences.has(x.es))
      return R.sortBy(x => x.es.length, list).slice(0, 2)
    }
    const addSentences = list => {
      list.map(x => x.es).forEach(x => alreadyIncludedSentences.add(x))
    }
    const firstThree1 = (spanishdict || []).map(({ es, en }) => ({ es: es.trim(), ruArray: [], enArray: [en] }))
    const firstThree2 = (transl || []).map(x => {
      return {
        es: x.es.trim(),
        audios: x.audios,
        ruArray: x.ruArray.map(x => x.trim()).sort().reverse(),
        enArray: x.enArray.map(x => x.trim()).sort().reverse(),
      }
    })
    const firstThree1_included = sortAndFilter(firstThree1)
    addSentences(firstThree1_included)
    const firstThree2_included = sortAndFilter(firstThree2)
    addSentences(firstThree2_included)
    firstThree = [...firstThree1_included, ...firstThree2_included]
  }
  if (firstThree.length === 0) {
    console.log({ word, transl, bable, spanishdict })
    throw new Error('word')
  }
  firstThree = firstThree.map(({ es, audios, ruArray, enArray }) => {
    const auto_ru = baidu_google_es_to_ru[es]
    const auto_en = baidu_google_es_to_en[es]
    if (!auto_ru || !auto_en) {
      console.log(es)
      throw new Error('auto_ru')
      // noTranslSentences.add(es)
    }
    return {
      es,
      audios,
      auto_ru,
      auto_en,
      ruArray: R.without([auto_ru], R.uniq(ruArray)),
      enArray: R.without([auto_en], R.uniq(enArray)),
    }
  })
  const verbData = mySpanishVerbs[word]
  if (!verbData) { throw new Error('verbData') }
  return { word, firstThree, verbData }
})

csv_output = R.sortBy(R.prop('word'), firstThreeArray).map(({ word, firstThree, verbData }) => firstThree.map(({ es, audios, auto_ru, auto_en, ruArray, enArray }) => {
  let audio = (audios || [])[0]
  if (audio) {
    audio = audio.id
    // audio = `https://tatoeba.org/en/audio/download/${audio}`
  }
  return {
    // audio,
    sentence_es:        es,
    sentence_audio:     audio ? `[sound:${audio}.mp3]` : '',
    sentence_ru:        ruArray.join('<br>'),
    sentence_ru_google: auto_ru,
    sentence_en:        enArray.join('<br>'),
    sentence_en_google: auto_en,
    id:                 verbData.id,
    en:                 verbData.en,
    es:                 verbData.es,
    prompt:             verbData.prompt,
    image:              verbData.image,
    audioen:            verbData.audioen,
    audiosp:            verbData.audiosp,
    section:            verbData.section,
    topic:              verbData.topic,
    chapter:            verbData.chapter,
    russian:            verbData.russian,
    etimol:             verbData.etimol,
    etimolru:           verbData.etimolru,
    rugoldendict:       verbData.rugoldendict,
    conjugationstable:  verbData.conjugationstable,
  }
})).flat()

// dictionaryEs = require('dictionary-es')
// es_dic = null
// dictionaryEs(function (error, es) {
//   if (error) throw error
//   es_dic = es
// })
// es_dic.aff.toString()
// es_dic.dic.toString()

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/sdf.csv', s)
})(csv_output);

// audios = csv_output.map(x => x.audio).filter(x => x)
// console.log(audios.map(filename => `wget -O "/home/srghma/.local/share/Anki2/User 1/collection.media/${filename}.mp3" "https://tatoeba.org/en/audio/download/${filename}"`).join('\n'))

// async function mapper({ filename, inputIndex, jobIndex }) {
//   const download = require('./scripts/lib/download').download
//   async function checkFileExists(file) {
//     const fs = require('fs')
//     return fs.promises.access(file, fs.constants.F_OK).then(() => true).catch(() => false)
//   }
//   const path = `/home/srghma/.local/share/Anki2/User 1/collection.media/${filename}.mp3`
//   const exists = await checkFileExists(path)
//   console.log({ m: 'exists', filename, inputIndex, jobIndex })
//   if (exists) {
//     return
//   }
//   const url = `https://tatoeba.org/en/audio/download/${filename}`
//   try {
//     await download(url, path)
//     console.log({ filename, inputIndex, jobIndex })
//   } catch (e) {
//     console.error({ e, filename, inputIndex, jobIndex, url })
//     // return
//   }
// }
// queueSize = 10
// await mkQueue(queueSize).addAll(audios.map((filename, inputIndex) => async jobIndex => { mapper({ filename, inputIndex, jobIndex }) }))


// sentences = firstThreeArray.map(x => x.firstThree).flat().map(x => x.es)
// fs.writeFileSync('/home/srghma/Downloads/sdf.csv', sentences.join('\n'))
// sentencesTransl = fs.readFileSync('/home/srghma/Downloads/sdf-_1_.csv').toString().trim().split('\n')

// // =GOOGLETRANSL(text, "es", "ru")
// sentencesTransl = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/sdf-_2_.csv`).pipe(csv({ separator: ",", headers: "w".split(' ') })))
// sentencesTransl = sentencesTransl.map(x => x.w.trim())
// console.log(sentences.length, sentencesTransl.length)
// translations = R.fromPairs(R.zip(sentences, sentencesTransl))
// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/baidu_google_es_to_ru.json', JSON.stringify(translations, undefined, 2))

// firstThreeArrayHTML = firstThreeArray.map(x => {
//   const div = (type, text) => text ? `<div class="example-sentence-translation-${type}">${text}</div>` : ''
//   const p = (text) => text ? `<p>${text}</p>` : ''
//   const transl = x.firstThree.map(({ es, ruArray, enArray }) => {
//     const answer = [
//       div('ru', ruArray.map(p).join('')),
//       div('en', enArray.map(p).join('')),
//     ].join('')
//     return [
//       `<div class="example-sentence-translation-es">${es}</div>`,
//       div('answer', answer)
//     ].join('')
//   }).map(x => `<div class="example-sentence-translation">${x}</div>`).join('')
//   return { word: x.word, transl }
// })


// tatoeba_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/tatoeba_cache.json'
// tatoeba_cache = JSON.parse(fs.readFileSync(tatoeba_with_cache_path).toString())
// output.filter(x => x.transl.length === 0).map(x => x.x).forEach(x => {
//   delete tatoeba_cache[x]
// })
// fs.writeFileSync(tatoeba_with_cache_path, JSON.stringify(tatoeba_cache))
