// node --experimental-repl-await

// const pinyinConvert = require('pinyin-convert')
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const chineseToPinyin = require('chinese-to-pinyin')
const rtega_get = require('./scripts/lib/rtega_get').rtega_get
const readStreamArray = require('./scripts/lib/readStreamArray')

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "hanzi" ] })))

let output = []

;(async function(){
  async function mymapper(x) {
    const hanzi = x['hanzi']

    let mnemonic = null

    try {
      mnemonic = await rtega_get(hanzi)
      console.log({ hanzi, mnemonic })
    } catch (e) {
      console.error(e)
    }

    return {
      hanzi,
      mnemonic,
    }
  }

  for (let i = 0; i < input.length; i++) {
    const res = await mymapper(input[i])

    fs.appendFileSync('rtegacache.json', JSON.stringify(res))

    output.push(res)

    console.log({ i, l: input.length })
  };
})();

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
