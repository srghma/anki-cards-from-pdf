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

input_ = input.filter(x => !x._20 && !x._1 && !x._37 && !x._82 && !x._88 && !x._91 && !x._18)
// input_.map(R.prop('kanji')).join('').includes('鏕')

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
queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
mkQueue(queueSize).addAll(input_.map((x, inputIndex) => async jobIndex => { mapper(output, x["kanji"], inputIndex, doms[jobIndex]) }))

require('./scripts/lib/baidu').baidu_translate_sync()

// input__ = output.map(({ kanji, transl }) => {
//   dom.window.document.body.innerHTML = transl
//   const lemmaSummaryNode = dom.window.document.body.querySelector('.lemma-summary')
//   let chinese = lemmaSummaryNode.innerHTML
//   return { kanji, chinese }
// })

input___ = output.filter(x => x.transl).map(({ kanji, transl }) => {
  chinese = transl.trim()
    .replace(/\s+src="data:image[^"]*"/g, "")
    .replace(/\s+href="javascript\:;"/g, "")
    .replace(/\s+href="javascript\:void\(0\);"/g, "")
    .replace(/\s+id="[^"]*"/g, "")
    .replace(/\s+title="[^"]*"/g, "")
    .replace(/\s+nslog-type="[^"]*"/g, "")
    .replace(/\s+nslog="[^"]*"/g, "")
    .replace(/\s+uid="[^"]*"/g, "")
    .replace(/\s+name="[^"]*"/g, "")
    .replace(/\s+data-\w+="[^"]*"/g, "")
    .replace(/\s+data-\w+-\w+="[^"]*"/g, "")
    .replace(/\s+data-\w+-\w+-\w+="[^"]*"/g, "")
    .replace(/\s+target="[^"]*"/g, "")
    .replace(/\s+class="[^"]*"/g, "")
    .replace(/\s+style="[^"]*"/g, "")
    .replace(/\s+alt="[^"]*"/g, "")
    .replace(/\s+alt="[^"]*"/g, "")
    .replace(/\s+label-module="[^"]*"/g, "")
    .replace(/\s+href=\"/g, " href=\"https://baike.baidu.com")
    .replace(/<font>([^<]+)<\/font>/g, "$1")
    .replace(/<font>([^<]+)<\/font>/g, "$1")
    .replace(/<font>([^<]+)<\/font>/g, "$1")
    .replace(/&nbsp;/g, "")
    .replace(/\[\d\]/g, "")
    .replace(/<img>/g, "")
    .replace(/\n+/gm, "\n")
    .replace(/<([^>]+)\s*>\s*<\/\1\s*>/g, "")
    .replace(/<([^>]+)\s*>\s*<\/\1\s*>/g, "")
    .replace(/<([^>]+)\s*>\s*<\/\1\s*>/g, "")
    .replace(/\n+/gm, "\n")
    .replace(/\n/g, "<br>")
    // .replace(/<br>/g, "\n")
    // .replace(/<br><br>/g, "<br>")
    // .replace(/<br><br>/g, "<br>")
    // .replace(/<a><br><\/a>/g, "")
  return { kanji, chinese }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input___);

// input___.find(x => x.kanji === '㿿')

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
