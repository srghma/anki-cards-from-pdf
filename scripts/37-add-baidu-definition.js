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

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

input_ = input.filter(x => !x._18 && !x._19)
input_.map(R.prop('kanji')).join('').includes('鏕')

async function mapper(output, kanji, inputIndex, dom) {
  if(!kanji) { throw new Error('') }
  let transl = null
  try {
    // require('./scripts/lib/baidu').baidu_translate_sync()
    transl = await require('./scripts/lib/baidu').baidu_with_cache(dom, kanji)
    // console.log({ kanji, transl })
  } catch (e) {
    console.error({ kanji, e })
    return
  }
  output.push({
    kanji,
    transl
  })
}
output = []
const queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
mkQueue(queueSize).addAll(input_.map((x, inputIndex) => async jobIndex => { mapper(output, x["kanji"], inputIndex, doms[jobIndex]) }))

require('./scripts/lib/baidu').baidu_translate_sync()

input__ = output.map(({ kanji, transl }) => {
  dom.window.document.body.innerHTML = transl
  const lemmaSummaryNode = dom.window.document.body.querySelector('.lemma-summary')
  let chinese = lemmaSummaryNode.innerHTML
  return { kanji, chinese }
})

input___ = input__.map(({ kanji, chinese }) => {
  chinese = chinese
    .replace(/ id="[^"]+"/g, "")
    .replace(/ uid="[^"]+"/g, "")
    .replace(/ name="[^"]+"/g, "")
    .replace(/ data-\w+="[^"]+"/g, "")
    .replace(/ target="[^"]*"/g, "")
    .replace(/ class="[^"]+"/g, "")
    .replace(/ style="[^"]+"/g, "")
    .replace(/ label-module="[^"]+"/g, "")
    .replace(/ href=\"/g, " href=\"https://baike.baidu.com")
    .replace(/<font>([^<]+)<\/font>/g, "$1")
    .replace(/<font>([^<]+)<\/font>/g, "$1")
    .replace(/&nbsp;/g, "")
    .replace(/\[\d\]/g, "")
    .replace(/\n/g, "")
    .replace(/<a><\/a>/g, "")
    .replace(/<sup><\/sup>/g, "")
  return { kanji, chinese }
})

async function mapper(output, { kanji, chinese }, inputIndex, dom) {
  if(!kanji) { throw new Error('') }
  let transl = null
  try {
    transl = await require('./scripts/lib/google_translate_with_cache').google_translate_with_cache(chinese, { to: 'en' })
  } catch (e) {
    console.error({ kanji, e })
    return
  }
  output.push({
    kanji,
    chinese,
    transl,
  })
}
output_ = []
const queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
mkQueue(queueSize).addAll(input___.map((x, inputIndex) => async jobIndex => { mapper(output_, x, inputIndex, doms[jobIndex]) }))

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
