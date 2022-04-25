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
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })

function partition(list = [], n = 1) {
  const isPositiveInteger = Number.isSafeInteger(n) && n > 0;
  if (!isPositiveInteger) {
    throw new RangeError('n must be a positive integer');
  }

  const q = Math.floor( list.length / n );
  const r = list.length % n;

  let i   ; // denotes the offset of the start of the slice
  let j   ; // denotes the zero-relative partition number
  let len ; // denotes the computed length of the slice

  const partitions = [];
  for ( i=0, j=0, len=0; i < list.length; i+=len, ++j ) {
    len = j < r ? q+1 : q ;
    const partition = list.slice( i, i+len ) ;
    partitions.push( partition ) ;
  }

  return partitions;
}

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});

// await etimologias(dom, 'nomofilo')

etimologias_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/etimologias_cache.json_'
etimologias_cache_orig = JSON.parse(fs.readFileSync(etimologias_with_cache_path).toString()); null
etimologias_cache = R.map(R.prop('etimology'), etimologias_cache_orig); null
etimologias_cache = R.toPairs(etimologias_cache)
etimologias_cache = etimologias_cache.filter(([k, v]) => v)

// R.uniq(etimologias_cache.map(x => Array.from(x[1].matchAll(/<h3>\n?\s*([^\<]+).*/g))[0]).filter(x => x).map(x => x[1].trim()))

etimologias_cache = etimologias_cache.map(([k, v]) => [k, v.replace(/<i>- Gracias: [^<]*<\/i>/g, '')])
etimologias_cache = etimologias_cache.map(([k, v]) => [k, v.replace(/<!--VA-T [^-]*-->/g, '')])
beautify_html = require('js-beautify').html;
// prettify = require('html-prettify');
etimologias_cache = etimologias_cache.map(([k, v]) => [k, beautify_html(v)])
etimologias_cache = R.groupBy(R.prop('1'), etimologias_cache);null
etimologias_cache = R.values(etimologias_cache)
etimologias_cache = etimologias_cache.map(xs => [xs[0][1], xs.map(x => x[0])])
// etimologias_cache = etimologias_cache.map(([v, keys]) => ({ keys: keys.join(', '), v }))
// etimologias_cache = etimologias_cache.map(([v, keys]) => ({ keys: keys, v: require('html-to-markdown').convert(v) }))
etimologias_cache = etimologias_cache.map(([v, keys]) => ({ keys: keys, v: v }))

keys = R.uniq(etimologias_cache.map(x => x.keys[0]))

async function doWork() {
  // etimologias_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/etimologias_cache.json'
  // etimologias_cache = JSON.parse(fs.readFileSync(etimologias_with_cache_path).toString()); null
  // etimologias_known_words = R.uniq(R.keys(etimologias_cache))
  // etimologias_maybe_unknown_words_with_dots = R.uniq(R.values(etimologias_cache).filter(x => x).map(x => x.sections).flat()).sort()
  // etimologias_maybe_unknown_words_with_and_without_dots = etimologias_unknown_words_with_dots.map(x => ({ orig: x, without: x.toLowerCase().replace(/\W/g, '') }))
  // etimologias_maybe_unknown_words_with_and_without_dots = R.sortBy(R.prop('without'), etimologias_maybe_unknown_words_with_and_without_dots)

  // // etimologias_maybe_unknown_words_with_and_without_dots.filter(x => !x.without)

  // // R.values(R.groupBy(R.prop('without'), etimologias_maybe_unknown_words_with_and_without_dots)).filter(xs => xs.length > 1)
  // etimologias_unknown_words_without_dots = R.keys(R.groupBy(R.prop('without'), etimologias_maybe_unknown_words_with_and_without_dots)).filter(x => x.length > 1)
  // etimologias_unknown_words_without_dots = R.difference(etimologias_unknown_words_without_dots, etimologias_known_words)
  // console.log(etimologias_unknown_words_without_dots)

  // etimologias_unknown_words_without_dots = R.uniq(etimologias_unknown_words_with_dots.map(x => x.toLowerCase().replace(/\W/g, ''))).sort()

  async function mapper(output, x, inputIndex, dom) {
    word = x
    if(!word) { throw new Error('') }
    let transl = null
    try {
      transl = await require('./scripts/lib/etimologiasdechile').etimologias_with_cache(dom, word)
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
  mkQueue(queueSize).addAll(keys.map((x, inputIndex) => async jobIndex => { await mapper(output, x, inputIndex, doms[jobIndex]) }))
  // etimologias_cache.esencial.etimology

  await require('./scripts/lib/etimologiasdechile').etimologias_syncronize()
}

// doWork();

etimologias_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/etimologias_cache.json'
etimologias_cache_orig = JSON.parse(fs.readFileSync(etimologias_with_cache_path).toString()); null
etimologias_cache_orig = R.map(R.prop('etimology'), etimologias_cache_orig); null
etimologias_cache_orig = R.toPairs(etimologias_cache_orig)
etimologias_cache_orig = etimologias_cache_orig.filter(([k, v]) => v)
etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/<i>- Gracias: [^<]*<\/i>/g, '')])
etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/<!--[^>]+>/g, '')])
etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/<h3>\n\s*/g, '<h3>')])
etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/\s*\n\s*<\/h3>/g, '</h3>')])
etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/<p>\n\s*/g, '<p>')])
etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, v.replace(/\s*\n\s*<\/p>/g, '</p>')])
beautify_html = require('js-beautify').html;
// prettify = require('html-prettify');
etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => [k, beautify_html(v)])
etimologias_cache_orig = etimologias_cache_orig.filter(([k, v]) => k !== 'http')
etimologias_cache_orig = etimologias_cache_orig.map(([k, v]) => ({ k, v }))
etimologias_cache = R.groupBy(R.prop('v'), etimologias_cache_orig);null
etimologias_cache = R.values(etimologias_cache)
etimologias_cache = etimologias_cache.map(xs => ({ value: xs[0].v, keys: xs.map(x => x.k) }))
etimologias_cache = etimologias_cache.map(x => ({ ...x, keysFromText: Array.from(x.value.matchAll(/<h3>(<i>)?([^\<]+)/g))[0][2].trim() }))
etimologias_cache = etimologias_cache.map(x => {
  // try {
    keysFromText = x.keysFromText.split(' ')
    let allKeys = [...x.keys, ...keysFromText].flat()
    removeAccent = str => str.normalize("NFD").replace(/\p{Diacritic}/gu, "")
    allKeys = allKeys.map(x => x.toLowerCase()).map(removeAccent).map(x => x.replace(/\W/g, '')).filter(x => x.length > 1)
    allKeys = R.uniq(allKeys)
    allKeys = R.sortBy(R.identity, allKeys)
    return { ...x, allKeys }
  // } catch (e) {
  //   console.log(x)
  // }
})

// output_ = output.filter(x => !x.transl)
// output_ = output.filter(x => x.transl)
// output_ = output_.map(x => ({ ...x.x, etimology: x.transl.etimology }))

output_ = etimologias_cache.map(x => ({ id: x.allKeys.join(', '), etimology: removeHTML(dom, x.value) }))
// output_ = output_.map(x => ({ ...x, etimology: require('html-to-text').convert(x.etimology) }))

output__ = partition(output_, 10)
// output__.map(x => x.length)
output__.forEach((x, index) => {
  require('csv-writer').createObjectCsvWriter({ path: `/home/srghma/Downloads/etymology-${index}.csv`, header: ["id", "etimology"] }).writeRecords(x).then(() => { console.log('...Done') })
  console.log(`ssconvert /home/srghma/Downloads/etymology-${index}.csv /home/srghma/Downloads/etymology-${index}.xlsx`)
})

promises = output__.map(async (x, index) => {
  const read = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/etymology-${index}.csv`).pipe(csv({ separator: ",", headers: "ruId ruText".split(' ') })))
  return { x, read }
})

translated = await Promise.all(promises)
translated_ = translated.map(x => R.zipWith(R.mergeLeft, x.x, x.read)).flat()
translated_ = translated_.map(x => ({ ...x, ruText: x.ruText.trim(), ruId: x.ruId.trim().split(', '), id: x.id.split(', ') }))
translated_ = translated_.map(x => ({ ...x, ruId: R.sortBy(R.identity, x.ruId), id: R.sortBy(R.identity, x.id) }))

translatedMap = R.fromPairs(translated_.map(x => [x.id.join(', '), x])); null
etimologias_cache_with_ru = etimologias_cache.map(x => ({ ...x, ...(translatedMap[x.allKeys.join(', ')]) }))
// etimologias_cache_with_ru.filter(x => !x.ruId)

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/etimologias_with_ru_cache.json', JSON.stringify(etimologias_cache_with_ru))

// require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["key", "value"].map(x => ({ id: x, title: x })) }).writeRecords(output_).then(() => { console.log('...Done') })
require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["id", "etimology"] }).writeRecords(output_).then(() => { console.log('...Done') })

// =GOOGLETRANSL(text, "es", "ru")
translations = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/output - output (1).csv`).pipe(csv({ separator: ",", headers: "w ru noth es".split(' ') })))
translations = translations.map(x => [x.w, x.ru])
translations = R.fromPairs(translations); null

output__ = output_.map(x => ({ ...x, ru: translations[x.word] }))

output__.filter(x => !x.ru)

output__ = output__.map(x => x.ids.map(id => ({ id, ...x }))).flat()
output__ = R.groupBy(R.prop('id'), output__); null
output__ = R.mapObjIndexed(R.map(R.prop('ru')), output__); null
output__ = R.mapObjIndexed(xs => xs.join('\n<hr/>\n'), output__); null
output__ = R.toPairs(output__)
output__ = output__.map(([key, value]) => ({ key, value }))

require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["key", "value"].map(x => ({ id: x, title: x })) }).writeRecords(output__).then(() => { console.log('...Done') })
