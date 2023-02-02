const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const removeHTML = require('./scripts/lib/removeHTML').removeHTML

process.on('unhandledRejection', error => { console.log('unhandledRejection', error) })

// let files = await require('fs/promises').readdir(`/home/srghma/projects/srghma-chinese/anki-addon-glossary`)
// files = files.filter(x => x.endsWith('.json')).map(basename => { // xxxx.json
//   let absolutePath = `/home/srghma/projects/srghma-chinese/anki-addon-glossary/${basename}`
//   return absolutePath
// })
// files = await Promise.all(files.map(async absolutePath => {
//   const hanzi = await require('fs/promises').readFile(absolutePath)
//   return hanzi
// }))
// files = files.map(x => JSON.parse(x.toString()))

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

errors = []
async function mapper(output, inputElement, inputElementIndex, dom) {
  const kanji = inputElement.kanji
  if (!kanji) { throw new Error('') }
  if (inputElementIndex % 10 === 0) { await wait(1000) }
  let transl = null
  try {
    transl = await require('./scripts/lib/trainchinese').trainchinese_with_cache(dom, inputElement.kanji)
    console.log({ kanji, transl })
  } catch (e) {
    console.error({ kanji, e })
    await wait(2000)
    errors.push({ kanji, e })
    return
  }
  output.push({
    kanji,
    transl
  })
}
output = []
const queueSize = 1
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
// mkQueue(queueSize).addAll(files.filter(x => !x.Ru_trainchinese).map((inputElement, inputElementIndex) => async jobIndex => { mapper(output, inputElement, inputElementIndex, doms[jobIndex]) }))
mkQueue(queueSize).addAll(files.filter(x => !x.Ru_trainchinese).map((inputElement, inputElementIndex) => async jobIndex => { mapper(output, inputElement, inputElementIndex, doms[jobIndex]) }))

// errors_ = []
async function mapper(output, inputElement, inputElementIndex, dom) {
  const kanji = inputElement.kanji
  if (!kanji) { throw new Error('') }
  if (inputElementIndex % 10 === 0) { await wait(1000) }
  let transl = null
  try {
    transl = await require('./scripts/lib/trainchinese').trainchinese_with_cache(dom, inputElement.kanji)
    console.log({ kanji, transl })
  } catch (e) {
    console.error({ kanji, e })
    // errors_.push({ kanji, e })
    await wait(2000)
    return
  }
  output.push({
    kanji,
    transl
  })
}
mkQueue(queueSize).addAll(errors_.map((inputElement, inputElementIndex) => async jobIndex => { mapper(output, inputElement, inputElementIndex, doms[jobIndex]) }))

output_ = R.groupBy(R.prop('kanji'), output)
output_ = R.map(xs => R.uniq(xs.map(x => x.transl).flat().filter(x => x)), output_)
output_ = R.toPairs(output_)
output_ = output_.map(([kanji, transl]) => ({ kanji, transl }))
output_ = output_.filter(x => !R.isEmpty(x.transl))

output_ = output_.map(({ kanji, transl }) => ({ kanji, transl: transl.filter(x => x.ch == kanji).filter(R.prop('transl')) })).filter(x => x.transl.length > 0)
output_ = output_.map(({ kanji, transl }) => ({ kanji, transl: transl.map(R.over(R.lensProp('transl'), x => x.replace(/\S+ \(фамилия\);?/g, '').trim())) })).filter(x => x.transl.length > 0)
output_ = output_.map(({ kanji, transl }) => {
  const markHelp = x => {
    if (!x) { return '' }
    x = removeHTML(dom, x)
    x = x.trim().replace(/\[(\w+)\]/g, '<span class="trainchinese-transl__pinyin-info">[$1]</span>')
    x = x.split('').map(x => {
      if (isHanzi(x)) { return `<span class="trainchinese-transl__hanzi-info">${x}</span>` }
      return x
    }).join('')
    return x
  }
  return {
    kanji,
    transl: transl.map(x => {
      const pinyin = '<span class="trainchinese-pinyin">' + x.pinyin + '</span>'
      const type = '<span class="trainchinese-type">' + x.type + '</span>'
      const transl_____ = '<span class="trainchinese-transl">' + markHelp(x.transl) + '</span>'
      const res = pinyin + ': (' + type + ') ' + transl_____
      return res
    }).join('<br/>')
  }
})
output_ = R.groupBy(R.prop('kanji'), output_)
output_ = R.map(xs => R.uniq(xs.map(x => x.transl)).join('<br>'), output_)

var hanzi = require("hanzi");
//Initiate
hanzi.start();

files_ = files.map(x => {
  let glyphs = hanzi.decompose(x.kanji, 1).components.filter(x => x !== 'No glyph available')
  glyphs = glyphs.map(glyph => {
    return {
      glyph,
      pinyins: hanzi.getPinyin(glyph)
    }
  })
  x = {
    ...x,
    Ru_trainchinese: x.Ru_trainchinese || output_[x.kanji] || "",
    glyphs,
  }
  // function omit(obj) {
  //   Object.keys(obj).forEach(key => {
  //     if (obj[key] === undefined) {
  //       delete obj[key];
  //     }
  //   })
  // }
  return x
})

files_.forEach(async x => {
  const absolutePath = `/home/srghma/projects/srghma-chinese/anki-addon-glossary/${x.kanji}.json`
  await require('fs/promises').writeFile(absolutePath, JSON.stringify(x, undefined, 2))
})

// ;(function(input){
//   const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
//   const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
//   fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
// })(output_);
