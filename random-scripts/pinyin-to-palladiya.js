// node --experimental-repl-await

const csv = require('csv-parser')
const fs = require('fs')
// const pinyinConvert = require('pinyin-convert')
const R = require('ramda')
const chineseToPinyin = require('chinese-to-pinyin')
const purpleculter_get = require('./random-scripts/purpleculter_get').purpleculter_get

function readStreamArray(stream) {
  return new Promise((resolve, reject) => {
      const data = []

      stream.on("data", chunk => data.push(chunk))
      stream.on("end", () => resolve(data))
      stream.on("error", error => reject(error))
  })
}

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese Grammar Wiki.txt').pipe(csv({ separator: "\t", headers: [ "id", "sentence" ] })))

convertToRuTable = await readStreamArray(fs.createReadStream('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-ru-by-kfcd').pipe(csv({ separator: '\t', headers: ["from", "2", '3', '4', '5', '6', '7', '8', '9', 'to', '11', '12'] })))

const convertToRuTable_ = R.pipe(
  R.map(R.over(R.lensProp('from'), from => from.replace(/5$/, ""))),
  R.sortBy((x) => x.from.length),
  R.reverse
)(convertToRuTable)

async function mymapper(x) {
  const convertPinyinMarkedToNumbered = async (text) => {
    let words = require('pinyin-split').default(text, true)
    words = require('pinyin-utils').markToNumber(words, false)
    return words.join('')
  }

  const convertPinyinNumberedToRu = (text) => {
    let ru = text
    for (const { from, to } of convertToRuTable_) {
      ru = ru.replace(new RegExp(from, 'ig'), to)
    }
    return ru
  }

  const sentence = x['sentence']

  // console.log({ sentence, x })

  const pinyin_marked = await (x['pinyin_marked'] ? Promise.resolve(x['pinyin_marked']) : chineseToPinyin(sentence))
  console.log({ pinyin_marked, sentence, x })
  const pinyin_numbered = await convertPinyinMarkedToNumbered(pinyin_marked)
  // console.log({ pinyin_numbered })
  const pinyin_ru = convertPinyinNumberedToRu(pinyin_numbered)
  // console.log({ pinyin_ru })

  return {
    id: x['id'],
    pinyin_marked,
    pinyin_numbered,
    pinyin_ru,
  }
}

output = await Promise.all(input.map(mymapper))

await require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/Chinese Grammar Wiki2.txt', header:  ["id", "pinyin_marked", "pinyin_numbered", "pinyin_ru"].map(x => ({ id: x, title: x })) }).writeRecords(output)
