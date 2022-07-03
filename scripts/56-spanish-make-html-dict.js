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

style = [
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

conjucations = await sd2json("/home/srghma/Desktop/esstarsict/EsRu/esru-es-conjugation-goldendict/es-conjugation.ifo")
conjucations = conjucations.docs
conjucations = conjucations.map(R.over(R.lensProp('trns'), x => x.join('').replace(style.join(''), '')))
conjucations = R.sortBy(R.prop('_id'), conjucations)

esRu = await sd2json("/home/srghma/Desktop/esstarsict/EsRu/esru-UniversalEsRu/UniversalEsRu.ifo")
esRu = esRu.docs
esRu = esRu.map(R.over(R.lensProp('trns'), xs => {
  xs = xs || []
  xs = xs.map(x => Array.isArray(x) ? x.join('') : x)
  return xs.join('<br>')
}))
esRu = R.sortBy(R.prop('_id'), esRu)

// etimologias_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/etimologias_cache.json'
// etimologias_cache_orig = JSON.parse(fs.readFileSync(etimologias_with_cache_path).toString()); null
// etimologias_cache_orig = R.map(R.prop('etimology'), etimologias_cache_orig); null
// etimologias_cache_orig = R.toPairs(etimologias_cache_orig)
// etimologias_cache_orig = etimologias_cache_orig.filter(([k, v]) => v)
// etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/<i>- Gracias: [^<]*<\/i>/g, '')])
// etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/<!--[^>]+>/g, '')])
// etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/<h3>\n\s*/g, '<h3>')])
// etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/\s*\n\s*<\/h3>/g, '</h3>')])
// etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/<p>\n\s*/g, '<p>')])
// etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/\s*\n\s*<\/p>/g, '</p>')])
// beautify_html = require('js-beautify').html;
// // prettify = require('html-prettify');
// etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, beautify_html(v)])
// etimologias_cache_orig = etimologias_cache_orig.filter(([k, v]) => k !== 'http')
// etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => ({ k, v }))

// etimologias_cache = R.groupBy(R.prop('v'), etimologias_cache_orig);null
// etimologias_cache = R.values(etimologias_cache)
// etimologias_cache = etimologias_cache.map(xs => ({ value: xs[0].v, keys: xs.map(x => x.k) }))
// etimologias_cache = etimologias_cache.map(x => ({ ...x, keysFromText: Array.from(x.value.matchAll(/<h3>(<i>)?([^\<]+)/g))[0][2].trim() }))
// etimologias_cache = etimologias_cache.map(x => {
//   // try {
//     keysFromText = x.keysFromText.split(' ')
//     let allKeys = [...x.keys, ...keysFromText].flat()
//     allKeys = allKeys.map(x => x.toLowerCase()).map(removeAccent).map(x => x.replace(/\W/g, '')).filter(x => x.length > 1)
//     allKeys = R.uniq(allKeys)
//     allKeys = R.sortBy(R.identity, allKeys)
//     return { ...x, allKeys }
//   // } catch (e) {
//   //   console.log(x)
//   // }
// })

// etimologias_cache = etimologias_cache.map(([v, keys]) => ({ keys: keys, v: require('html-to-markdown').convert(v) }))
// etimologias_cache = etimologias_cache.map(([v, keys]) => ({ keys: keys, v: v }))

// R.sortBy(R.identity, R.uniq(etimologias_cache.map(x => Array.from(x[1].matchAll(/<h3>\n?\s*([^\<]+).*/g))[0]).filter(x => x).map(x => x[1].trim())))

// windows1252 = await (import('windows-1252'))
// windows1252.decode(etimologias_cache[0].v)

// et = etimologias_cache.map(x => require('string-strip-html').stripHtml(x.v).result)
// require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/etymology.csv', header: R.keys(et) }).writeRecords(et).then(() => { console.log('...Done') })

// txtString = etimologias_cache.map(x => require('string-strip-html').stripHtml(x.v).result).join('\n\n--------------\n\n')
// fs.writeFileSync('/home/srghma/Downloads/etymology.txt', txtString)

// htmlString = etimologias_cache.map(x => x.v).join('\n\n<div class="page-break" style="page-break-after: always;"></div>\n\n')
// var HTMLtoDOCX = require('html-to-docx')
// filePath = './example.docx';
// (async () => {
//   const fileBuffer = await HTMLtoDOCX(htmlString, null, {
//     table: { row: { cantSplit: false } },
//     footer: false,
//     pageNumber: false,
//   });

//   fs.writeFile(filePath, fileBuffer, (error) => {
//     if (error) {
//       console.log('Docx file creation failed');
//       return;
//     }
//     console.log('Docx file created successfully');
//   });
// })();


// etimologias_cache = R.fromPairs(etimologias_cache)
// require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.csv', header: R.keys(etimologias_cache) }).writeRecords(etimologias_cache).then(() => { console.log('...Done') })

// esRu_ = esRu.filter(x => x._id.length > 1 && (/^[a-z]/.test(x._id.charAt(0)) || x._id.charAt(0) === '¡' || x._id.charAt(0) === '¿'))
// words = [
//   etimologias_cache.map(x => x.keys).flat(),
//   conjucations.map(x => x._id),
//   esRu_.map(x => x._id),
// ].flat()
// words = R.sortBy(R.identity, R.uniq(words))
// require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.csv', header: ["x"] }).writeRecords(words.map(x => ({ x }))).then(() => { console.log('...Done') })

esRuMap = R.fromPairs(esRu.map(x => [x._id, x.trns])); null
conjucationsMap = R.fromPairs(conjucations.map(x => [x._id, x.trns])); null

// x = etimologias_cache[0].v
// const blob = new Blob([stringVal], {type: 'text/plain; charset=utf-8'});
// m = await blob.arrayBuffer()

// string = new TextDecoder("windows-1252").decode(uint8array);

etimologias_cacheMap = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/etimologias_with_ru_cache.json').toString())
etimologias_cacheMap = R.fromPairs(etimologias_cacheMap.map(x => x.allKeys.map(key => [key, { etimologyEs: x.value, etimologyRu: x.ruText }])).flat());null

mostused = await readStreamArray(fs.createReadStream("/home/srghma/projects/anki-cards-from-pdf/spanish-data-input/10000_formas.cvs", { encoding: "latin1" }).pipe(csv({ separator: "\t", headers: "freqIndex esWordWithAccent".split(' ') })))
mostused = mostused.map(x => ({ freqIndex: Number(x.freqIndex.trim()), esWordWithAccent: x.esWordWithAccent.trim()  }))
mostused = mostused.map(x => ({ ...x, esWordWithoutAccent: removeAccent(x.esWordWithAccent) }))
mostusedMap = R.fromPairs(mostused.map(x => [x.esWordWithoutAccent.toLowerCase(), { freqIndex: x.freqIndex, esWordWithAccent: x.esWordWithAccent }]))

esAndGoogleTranslations = await readStreamArray(fs.createReadStream("/home/srghma/projects/anki-cards-from-pdf/spanish-data-input/es-to-ru.csv").pipe(csv({ separator: ",", headers: "es googleRu".split(' ') })))
esAndGoogleTranslations = esAndGoogleTranslations.map(x => ({ ...x, conjugations: conjucationsMap[x.es], ru: esRuMap[x.es], ...etimologias_cacheMap[x.es] }))
// esAndGoogleTranslations = esAndGoogleTranslations.filter(x => x.es.length > 1 && (/^[a-z]/.test(x.es.charAt(0)) || x.es.charAt(0) === '¡' || x.es.charAt(0) === '¿'))
esAndGoogleTranslations = esAndGoogleTranslations.filter(x => x.es.length > 1 && /^[a-zñ]+$/.test(x.es))
mostUsedFreqIndexAndWithAccent = str => mostusedMap[removeAccent(str).toLowerCase()]
esAndGoogleTranslations = esAndGoogleTranslations.map(x => ({ ...x, ...mostUsedFreqIndexAndWithAccent(x.es) }))
esAndGoogleTranslations = R.sortBy(R.prop('es'), esAndGoogleTranslations)

esAndGoogleTranslationsMap = esAndGoogleTranslations.map(x => [x.es, R.omit(['es'], x)])
esAndGoogleTranslationsMap = R.fromPairs(esAndGoogleTranslationsMap);null

function cleanObject(jsonObject) {
  var clone = JSON.parse(JSON.stringify(jsonObject))
  for(var prop in clone)
      if(clone[prop] == null)
          delete clone[prop];
  return clone;
}

bucketIds = {
  w1: esAndGoogleTranslations[10000].es,
  w2: esAndGoogleTranslations[20000].es,
  w3: esAndGoogleTranslations[30000].es,
  w4: esAndGoogleTranslations[40000].es,
  w5: esAndGoogleTranslations[50000].es,
  w6: esAndGoogleTranslations[60000].es,
}

console.log(bucketIds)

is1     = x => x <= bucketIds.w1
is2     = x => x > bucketIds.w1 && x <= bucketIds.w2
is3     = x => x > bucketIds.w2 && x <= bucketIds.w3
is4     = x => x > bucketIds.w3 && x <= bucketIds.w4
is5     = x => x > bucketIds.w4 && x <= bucketIds.w5
is6     = x => x > bucketIds.w5 && x <= bucketIds.w6
isOther = x => x > bucketIds.w6

onlyPick = is => R.pickBy((_, key) => is(key))

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/info-1.json',     JSON.stringify(cleanObject(onlyPick(is1)(esAndGoogleTranslationsMap))))
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/info-2.json',     JSON.stringify(cleanObject(onlyPick(is2)(esAndGoogleTranslationsMap))))
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/info-3.json',     JSON.stringify(cleanObject(onlyPick(is3)(esAndGoogleTranslationsMap))))
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/info-4.json',     JSON.stringify(cleanObject(onlyPick(is4)(esAndGoogleTranslationsMap))))
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/info-5.json',     JSON.stringify(cleanObject(onlyPick(is5)(esAndGoogleTranslationsMap))))
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/info-6.json',     JSON.stringify(cleanObject(onlyPick(is6)(esAndGoogleTranslationsMap))))
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/info-other.json', JSON.stringify(cleanObject(onlyPick(isOther)(esAndGoogleTranslationsMap))))

renderTable = (esAndGoogleTranslations, first10000) => {
  const td         = (x) => String.raw`<td>${x}</td>`
  const tdOptional = (x) => x ? String.raw`<td>${x}</td>` : ''
  const tdData     = (kl, x) => String.raw`<td class="${kl}" data-content="${x}"></td>`

  if (first10000) {
    esAndGoogleTranslations = esAndGoogleTranslations.filter(x => x.freqIndex)
  }

  return esAndGoogleTranslations.map((x, index) => {
    let ruTranslation

    if (x.ru) {
      ruTranslation = Array.from(x.ru.matchAll(/<dtrn>(.*?)<\/dtrn>/g))
      ruTranslation = ruTranslation.map(x => x[1])
      ruTranslation = ruTranslation.map(x => x.replace(/<co>(.*?)<\/co>/g, ''))
      // console.log(ruTranslation)
      ruTranslation = ruTranslation.map(x => x.replace(/<abr>(.*?)<\/abr>/g, ''))
      ruTranslation = ruTranslation.map(x => x.trim())
      ruTranslation = ruTranslation.filter(x => x)
      ruTranslation = ruTranslation.filter(x => !x.includes('<kref>'))
      ruTranslation = ruTranslation[0]
      if (ruTranslation) { ruTranslation = ruTranslation.split('<br>').map(x => x.trim().replace(/^,/, '').trim()).filter(x => x).join(', ') }
      if (ruTranslation) { ruTranslation = ruTranslation.replace(/<\/?.*?>/g, '') }
    }

    const ruTranslationOrGoogle = ruTranslation ? ruTranslation : x.googleRu
    const ruTranslationOrGoogleClass = ruTranslation ? 'ru-translation-from-dictionary' : null

    const tds = [
      td(String.raw`<a href="show.html#${encodeURIComponent(x.es)}" target="_blank">${index + 1}</td>`),
      td(x.esWordWithAccent || x.es),
      tdData(['ru-translation-get-from-content', ruTranslationOrGoogleClass].filter(x => x).join(' '), ruTranslationOrGoogle),
      td(x.conjugations ? "C" : ""),
      td(x.etimologyEs ? "E" : ""),
      tdOptional(first10000 ? (x.freqIndex || "") : null),
    ]

    return String.raw`<tr>${tds.join('')}</tr>`
  })
}

// renderTable(esAndGoogleTranslations.filter(x => x.es === 'abordar'), false)

renderHtml = (esAndGoogleTranslations, first10000) => `<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Spanish dict</title>
  <link rel="stylesheet" href="index.css">
  <link rel="stylesheet" href="common.css">
  <script src="index.js"></script>
 </head>
 <body class="nightMode">
  <table border="1" class="mytable" style="display: none;">
   ${renderTable(esAndGoogleTranslations, first10000).join('\n')}
  </table>
</div>
</div>
 </body>
</html>`

await (require('mkdirp'))('/home/srghma/projects/anki-cards-from-pdf/html/spanish')
// fs.writeFileSync('/home/srghma/.local/share/Anki2/User 1/collection.media/spanish.html', html_)
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/index.html', renderHtml(esAndGoogleTranslations, false))
fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/first10000.html', renderHtml(esAndGoogleTranslations, true))
// rclone sync /home/srghma/projects/anki-cards-from-pdf/html/spanish spanish:/
