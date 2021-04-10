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

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji", "trch" ] })))

async function mapper(output, kanji, inputIndex, dom) {
  if(!kanji) { throw new Error('') }
  let transl = null
  try {
    transl = await require('./scripts/lib/trainchinese').trainchinese_with_cache(dom, kanji)
    console.log({ kanji, transl })
  } catch (e) {
    console.error({ kanji, e })
  }
  output.push({
    kanji,
    transl
  })
}
output = []
const queueSize = 1
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
mkQueue(queueSize).addAll(input.map((x, inputIndex) => async jobIndex => { mapper(output, x["kanji"], inputIndex, doms[jobIndex]) }))

output_ = output.filter(R.prop('transl'))
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

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
