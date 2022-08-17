const fetch = require('node-fetch')
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
const TongWen = require('./scripts/lib/TongWen').TongWen
{ etimologias } = require('./scripts/lib/etimologiasdechile')
const { JSDOM } = require("jsdom");
const dom = new JSDOM(``);
queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
removeAccent = str => str.normalize("NFD").replace(/\p{Diacritic}/gu, "")
const { sd2json } = require("dict-sd2json")

// let bpath = 'test.ifo'
// let respath = test/'test.json'

conjucationsstyle = [
  '<style>ol li {  font-size:   70%',
  '}table.conjugation span.irrg {  color:       #731C1C',
  'display:     inline',
  '}table.conjugation span.dfcv {  color:       #BFBFBF',
  'display:     inline',
  '}table.conjugation span.regn {  font-size:      60%',
  'vertical-align: super',
  '}table.conjugation span.dfcv span.irrg {  color:       #949494',
  'display:     inline',
  '}table.conjugation td {  font-size:  90%',
  'text-align: center',
  '}table.conjugation td.lt {  text-align: right',
  'font-size:  70%',
  'color:      #969696',
  '}table.conjugation td.rt {  text-align: left',
  'font-size:  70%',
  'color:      #969696',
  '}table.conjugation td.h1 {  font-size:  110%',
  'line-height:2.5em',
  'border-bottom-style: solid',
  'border-bottom-width: 1px',
  '}table.conjugation td.h2 {  font-size:  110%',
  'line-height:1.5em',
  '}table.conjugation td.h3 {  font-size:  80%',
  'line-height:1.5em',
  'border-bottom-style: solid',
  'border-bottom-width: 1px',
  '}</style>'
]

conjucations_clear = input => {
  try {
    input = input.replace(/ (class|rowspan|colspan|style|width|border|width|cellspacing|cellpadding)="[^"]+"/g, '').replace(/ (class|rowspan|colspan|style|width|border|width|cellspacing|cellpadding)="[^"]+"/g, '')
    const p = [ 'él/yo', 'él', 'yo/él', 'yo', 'vosotros', 'vos', 'tú/vos', 'tú', 'subjuntivo', 'pretérito', 'presente', 'participio', 'nosotros', 'infinitivo', 'indicativo', 'imperfecto', 'imperativo', 'gerundio', 'futuro', 'formas no finitas', 'ellos', 'condicional' ]
    p.forEach(x => { input = input.replace(new RegExp(`<td>${x}</td>`, "gi"), '') })
    return R.uniq(Array.from(input.matchAll(/<td>([^<]+)<\/td>/gi)).map(x => x[1].split('/')).flat().sort())
  } catch (e) {
    console.log(e)
  }
}
conjucations = await sd2json("/home/srghma/Desktop/esstarsict/EsRu/esru-es-conjugation-goldendict/es-conjugation.ifo")
conjucations = conjucations.docs
conjucations = conjucations.map(R.over(R.lensProp('trns'), x => x.join('').replace(conjucationsstyle.join(''), '')))
conjucations = conjucations.map(x => ({ ...x, conjucations: conjucations_clear(x.trns) }))
conjucations = R.sortBy(R.prop('_id'), conjucations)
conjucationsMap = R.fromPairs(conjucations.map(x => [x._id, { conjucations_table: x.trns, conjucations_variants: x.conjucations }])); null

UniversalEsRu = await sd2json("/home/srghma/Desktop/esstarsict/EsRu/esru-UniversalEsRu/UniversalEsRu.ifo")
UniversalEsRu = UniversalEsRu.docs
UniversalEsRu = UniversalEsRu.map(R.over(R.lensProp('trns'), xs => {
  xs = xs || []
  xs = xs.map(x => Array.isArray(x) ? x.join('') : x)
  return xs
}))
UniversalEsRu = R.sortBy(R.prop('_id'), UniversalEsRu)
UniversalEsRuMap = R.fromPairs(UniversalEsRu.map(x => [x._id, x.trns])); null

esRuPopupdict = await sd2json("/home/srghma/Desktop/esstarsict/EsRu/esru-popupdictEsRu/xn_popupdict_es-ru.ifo")
esRuPopupdict = esRuPopupdict.docs
esRuPopupdict = esRuPopupdict.map(R.over(R.lensProp('trns'), xs => {
  xs = xs || []
  xs = xs.map(x => Array.isArray(x) ? x.join('') : x)
  return xs
}))
esRuPopupdict = R.sortBy(R.prop('_id'), esRuPopupdict)
esRuPopupdictMap = R.fromPairs(esRuPopupdict.map(x => [x._id, x.trns])); null

esRuModernUsage = await sd2json("/home/srghma/Desktop/esstarsict/fromlingvo13/EsRu/ModernUsageEsRu.ifo")
esRuModernUsage = esRuModernUsage.docs
esRuModernUsage = esRuModernUsage.map(R.over(R.lensProp('trns'), xs => {
  xs = xs || []
  xs = xs.map(x => Array.isArray(x) ? x.join('') : x)
  return xs
}))
esRuModernUsage = R.sortBy(R.prop('_id'), esRuModernUsage)
esRuModernUsageMap = R.fromPairs(esRuModernUsage.map(x => [x._id, x.trns])); null

LAROUSSE_EsEs = await sd2json("/home/srghma/Desktop/esstarsict/EsEs/LAROUSSE/LAROUSSE_EsEs.ifo")
LAROUSSE_EsEs = LAROUSSE_EsEs.docs
LAROUSSE_EsEs = LAROUSSE_EsEs.map(R.over(R.lensProp('trns'), xs => {
  xs = xs || []
  xs = xs.map(x => Array.isArray(x) ? x.join('') : x)
  return xs
}))
LAROUSSE_EsEs = R.sortBy(R.prop('_id'), LAROUSSE_EsEs)
LAROUSSE_EsEsMap = R.fromPairs(LAROUSSE_EsEs.map(x => [x._id, x.trns])); null

modernslangEsRu = await sd2json("/home/srghma/Desktop/esstarsict/EsRu/esru-modernslang/modernslangEsRu.ifo")
modernslangEsRu = modernslangEsRu.docs
modernslangEsRu = modernslangEsRu.map(R.over(R.lensProp('trns'), xs => {
  xs = xs || []
  xs = xs.map(x => Array.isArray(x) ? x.join('') : x)
  return xs
}))
modernslangEsRu = R.sortBy(R.prop('_id'), modernslangEsRu)
modernslangEsRuMap = R.fromPairs(modernslangEsRu.map(x => [x._id, x.trns])); null

esencialEsEs = await sd2json("/home/srghma/Desktop/esstarsict/EsEs/DELE_VOX/DELE_VOX_EsEs.ifo")
esencialEsEs = esencialEsEs.docs
esencialEsEs = esencialEsEs.map(R.over(R.lensProp('trns'), xs => {
  xs = xs || []
  xs = xs.map(x => Array.isArray(x) ? x.join('') : x)
  return xs
})).filter(x => x._id.length !== 1)
// esencialEsEs = R.sortBy(R.prop('_id'), esencialEsEs)

etimologias_cacheMap = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/etimologias_with_ru_cache.json').toString())
etimologias_cacheMap = R.fromPairs(etimologias_cacheMap.map(x => x.allKeys.map(key => [key, { etimologyEs: x.value, etimologyRu: x.ruText }])).flat());null

mostused = await readStreamArray(fs.createReadStream("/home/srghma/projects/anki-cards-from-pdf/spanish-data-input/10000_formas.cvs", { encoding: "latin1" }).pipe(csv({ separator: "\t", headers: "freqIndex esWordWithAccent".split(' ') })))
mostused = mostused.map(x => ({ freqIndex: Number(x.freqIndex.trim()), esWordWithAccent: x.esWordWithAccent.trim()  }))
mostused = mostused.map(x => ({ ...x, esWordWithoutAccent: removeAccent(x.esWordWithAccent) }))
mostusedMap = R.fromPairs(mostused.map(x => [x.esWordWithoutAccent.toLowerCase(), { freqIndex: x.freqIndex, esWordWithAccent: x.esWordWithAccent }]))
mostUsedFreqIndexAndWithAccent = str => {
  const x = mostusedMap[removeAccent(str).toLowerCase()]
  if (!x) { return undefined }
  return x.freqIndex
}

esAndGoogleTranslations = esencialEsEs.map(x => ({ es: x._id, esencialEsEs: x.trns }))
esAndGoogleTranslations = esAndGoogleTranslations.map(x => ({ ...x, ...conjucationsMap[x.es], universalEsRu: UniversalEsRuMap[x.es], ruPopup: esRuPopupdictMap[x.es], ruModernUsage: esRuModernUsageMap[x.es], ...etimologias_cacheMap[x.es], larousse: LAROUSSE_EsEsMap[x.es], modernslang: modernslangEsRuMap[x.es], mostUsed: mostUsedFreqIndexAndWithAccent(x.es) }))
esAndGoogleTranslations = esAndGoogleTranslations.map(x => {
  const clearFunc = text => {
    if (!text) { return undefined }
    if (Array.isArray(text)) {
      text = text.join('<br>')
    }
    if (typeof text === "string") {
      text = text.replace(`<k>${x.es}</k><br>`, '').trim()
    }
    return text
  }
  const esencialEsEs = clearFunc(x.esencialEsEs)
  // console.log({ x: x.es, esencialEsEs })
  // if (!esencialEsEs) { throw new Error(esencialEsEs) }

  let esencialEsEs__type = R.uniq(Array.from(esencialEsEs.matchAll(/<i><c c="green">([^<]+)/g)).map(x => x[1].trim().replace(/adjetivo/g, '').replace(/adverbio/g, '').replace(/locución/g, '').replace(/adverbial/g, '').replace(/ - /g, '').replace(/˜/g, '').replace(/^,/g, '').replace(/,$/g, '').toLowerCase().trim()).filter(x => x.includes('sustantivo')).sort())

  const mapOfTypes = {
    'nombre propio, sustantivo masculino':        'el',
    'nombre, sustantivo':                         'el',
    'sustantivo':                                 'el',
    'sustantivo ambiguo':                         'el',
    'sustantivo ambiguo / masculino':             'el',
    'sustantivo común':                           'el la',
    'sustantivo común, plural':                   'las los',
    'sustantivo femenino':                        'la',
    'sustantivo femenino / sustantivo masculino': 'el la',
    'sustantivo femenino plural':                 'las',
    'sustantivo femenino sustantivo común':       'la',
    'sustantivo femenino, plural':                'la',
    'sustantivo masculino':                       'el',
    'sustantivo masculino plural':                'los',
    'sustantivo masculino y femenino':            'el la',
    'sustantivo masculino,':                      'el',
    'sustantivo masculino, plural':               'las',
    'sustantivo masculino, sustantivo femenino':  'el la',
  }

  esencialEsEs__type = esencialEsEs__type.map(x => {
    const type = mapOfTypes[x]
    if (!type) { throw new Error(type) }
    return type.split(' ').sort()
  })

  esencialEsEs__type = R.uniq(esencialEsEs__type.flat().sort()).join(' ')

  // const normalize = str => str.normalize("NFD").replace(/\p{Diacritic}/gu, "")
  const normalize = str => {
    Object.entries({
      'á': 'a',
      'é': 'e',
      'í': 'i',
      'ó': 'o',
      'ú': 'u',
      'ü': 'u',
      'ñ': 'n',
    }).forEach(([wth, wthout]) => {
      str = str.replace(new RegExp(wth, "g"), wthout)
    })
    return str
  }

  return {
    ...x,
    esencialEsEs,
    universalEsRu:             clearFunc(x.universalEsRu),
    ruPopup:                   clearFunc(x.ruPopup),
    ruModernUsage:             clearFunc(x.ruModernUsage),
    larousse:                  clearFunc(x.larousse),
    modernslang:               clearFunc(x.modernslang),
    mostUsed:                  clearFunc(x.mostUsed),
    esencialEsEs__type,
    'es + esencialEsEs__type': [esencialEsEs__type, x.es].filter(x => x).join(' '),
    'es__without':             normalize(x.es),
  }
})

esAndGoogleTranslations = R.sortBy(R.prop('es__without'), esAndGoogleTranslations)
esAndGoogleTranslations = esAndGoogleTranslations.map((x, orderN) => ({ ...x, orderN: orderN + 1 }))
// esAndGoogleTranslations.reverse().slice(0, 1)

// console.log(R.uniq(esAndGoogleTranslations.map(x => x.esencialEsEs__type).flat()).sort().join('\n'))
// esAndGoogleTranslations.filter(x => (x.esencialEsEs__type || '').includes('común'))
// esAndGoogleTranslations.filter(x => (x.esencialEsEs__type || '').includes('sustantivo femenino, plural'))
// esAndGoogleTranslations.filter(x => (x.esencialEsEs__type || '').includes('locución'))

// fs.writeFileSync('/home/srghma/Downloads/sdf.csv', esAndGoogleTranslations.map(x => x.es).join('\n'))

esAndGoogleTranslations = R.project([
  'es',
  // 'esencialEsEs',
  // 'universalEsRu',
  // 'ruPopup',
  // 'ruModernUsage',
  // 'larousse',
  // 'modernslang',
  'mostUsed',
  // 'etimologyEs',
  // 'etimologyRu',
  // 'conjucations_table',
  // 'esencialEsEs__type',
  'es + esencialEsEs__type',
  'orderN'
], esAndGoogleTranslations)

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/sdf.csv', s)
})(R.map(R.omit(['conjucations_variants']), esAndGoogleTranslations));

// tatoeba_sentences_copy = [...tatoeba_sentences]
// getTatoeba = word => {
//   const wordR = new RegExp('word', 'i')
//   const indexForRemoval = tatoeba_sentences_copy.find(x => wordR.test(x.text))
//   if (!indexForRemoval) { return undefined }
//   const ret = tatoeba_sentences_copy[indexForRemoval]
//   tatoeba_sentences_copy.splice(indexForRemoval,1)
//   return ret
// }
// esAndGoogleTranslations = esAndGoogleTranslations.map(x => ({ ...x, tatoeba_from_es: getTatoeba(x.es) }))

esAndGoogleTranslations.filter(x => !x.universalEsRu)
// esAndGoogleTranslations.filter(x => x.tatoeba_from_es)

sentences_transl_ru = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/sdf-_6_-_2_.csv`).pipe(csv({ separator: ",", headers: "w".split(' ') }))).then(sentencesTransl => sentencesTransl.map(x => x.w.trim()))

// const csv = require('fast-csv')
// const yallist = require('yallist')

// async function parse(path, headers) {
//   return new Promise((resolve, reject) => {
//     // const l = fs.readFileSync('/home/srghma/Downloads/tatoeba/links.csv').toString().trim().split('\n').length
//     const buffer = yallist.create()
//     fs.createReadStream(path)
//       .pipe(csv.parse({ delimiter: '\t', headers: headers.split(' ') }))
//       .on('error', error => reject(error))
//       .on('data', row => buffer.push(row))
//       .on('end', (rowCount) => resolve(buffer))
//   })
// }

// console.time('test');
// links                = await parse('/home/srghma/Downloads/tatoeba/links.csv', "sentence_id translation_id")
// links                = fs.readFileSync('/home/srghma/Downloads/tatoeba/links.csv').toString().trim().split('\n').map(x => x.split("\t").map(([sentence_id, translation_id]) => ({ sentence_id, translation_id })))

tatoeba_sentences = await (async function () {
  sentences            = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/spa_sentences.tsv`).pipe(csv({ separator: "\t",            headers: "sentence_id lang text".split(' ') })))

  // links                = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/links.csv`).pipe(csv({ separator: "\t",                headers: "sentence_id translation_id".split(' ') })))
  // sentences            = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/sentences.csv`).pipe(csv({ separator: "\t",            headers: "sentence_id lang text".split(' ') })))
  // sentences_CC0        = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/sentences_CC0.csv`).pipe(csv({ separator: "\t",        headers: "sentence_id lang text date_modified".split(' ') })))
  sentences_with_audio = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/sentences_with_audio.csv`).pipe(csv({ separator: "\t", headers: "sentence_id audio_id username license attribution_url".split(' ') })))
  sentences_with_audio_ = sentences_with_audio.map(({ sentence_id, audio_id }) => ({ sentence_id: Number(sentence_id), audio_id: Number(audio_id) }))
  sentences_with_audio_ = R.fromPairs(sentences_with_audio_.map(({ sentence_id, audio_id }) => ([sentence_id, audio_id])));null
  // tags                 = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/tags.csv`).pipe(csv({ separator: "\t",                 headers: "sentence_id tag_name".split(' ') })))
  // transcriptions       = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/transcriptions.csv`).pipe(csv({ separator: "\t",       headers: "sentence_id lang script_name username transcription".split(' ') })))
  // users_sentences      = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/users_sentences.csv`).pipe(csv({ separator: "\t",      headers: "username lang sentence_id review date_added date_last_modified".split(' ') })))

  spa_en = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/Sentence pairs in Spanish-English - 2022-08-02.tsv`).pipe(csv({ separator: "\t", headers: "spa_sentence_id spa_sentence_text en_sentence_id en_sentence_text".split(' ') })))
  spa_en = spa_en.map(x => ({ ...x, en_sentence_audio: sentences_with_audio_[x.en_sentence_id] }))
  spa_en = R.groupBy(R.prop('spa_sentence_id'), spa_en);null
  spa_en = R.map(R.project(['en_sentence_id', 'en_sentence_text', 'en_sentence_audio']), spa_en)
  // spa_en = spa_en.map(({ spa_sentence_id, spa_sentence_text, en_sentence_id, en_sentence_text }) => [])

  spa_ru = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/tatoeba/Sentence pairs in Spanish-Russian - 2022-08-02.tsv`).pipe(csv({ separator: "\t", headers: "spa_sentence_id spa_sentence_text ru_sentence_id ru_sentence_text".split(' ') })))
  spa_ru = spa_ru.map(x => ({ ...x, ru_sentence_audio: sentences_with_audio_[x.ru_sentence_id] }))
  spa_ru = R.groupBy(R.prop('spa_sentence_id'), spa_ru);null
  spa_ru = R.map(R.project(['ru_sentence_id', 'ru_sentence_text', 'ru_sentence_audio']), spa_ru)

  sentences_ = sentences.map(({ sentence_id, text }) => ({ sentence_id: Number(sentence_id), text }))
  sentences_ = sentences_.map(({ sentence_id, text }) => ({ sentence_id, text, audio: sentences_with_audio_[sentence_id], ru: spa_ru[sentence_id], en: spa_en[sentence_id] }))
  return sentences_
})();
