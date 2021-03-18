const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const csv = require('csv-parser')
const fs = require('fs')
const chineseToPinyin = require('chinese-to-pinyin')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const R = require('ramda')
const RA = require('ramda-adjunct')

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

const queueSize = 1
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })

output = []
promises = input.map((x, inputIndex) => async jobIndex => {
  const kanji = x['kanji']

  if (x._66) {
    console.log({ m: "skipping", kanji: x.kanji })
    return
  }

  const dom = doms[jobIndex]
  if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }
  if (!dom) { throw new Error('dom') }

  let translation = null
  try {
    translation = await require('./scripts/lib/rtega_get').rtega_get_with_cache(dom, kanji)

    if (!translation) {
      console.log({ m: "didnt find", kanji: x.kanji })
      return
    }
  } catch (e) {
    console.error({ m: "error", inputIndex, kanji, e })
    return
  }

  console.log({ m: "finished", jobIndex, inputIndex, length: input.length })
  output.push({ kanji, translation })
})
await mkQueue(queueSize).addAll(promises)

output_ = output.filter(x => x.mnemonic != '').map(x => {
  const s = x.mnemonic
    .replace(/ id="[^"]+"/g, "")
    .replace(/ uid="[^"]+"/g, "")
    .replace(/ data-\w+="[^"]+"/g, "")
    .replace(/ target="[^"]*"/g, "")
    .replace(/ class="[^"]+"/g, "")
    .replace(/ style="[^"]+"/g, "")
    .replace(/ href=\"/g, " href=\"http://rtega.be/chmn/")
    .replace(/<font>([^<]+)<\/font>/g, "$1")
    .replace(/<font>([^<]+)<\/font>/g, "$1")

  return { ...x, mnemonic: "<table>" + s + "</table>" }
})


await require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/Chinese Grammar Wiki2.txt', header:  Object.keys(output_[0]).map(x => ({ id: x, title: x })) }).writeRecords(output_)
