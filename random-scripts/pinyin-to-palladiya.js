// node --experimental-repl-await

// const pinyinConvert = require('pinyin-convert')
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const chineseToPinyin = require('chinese-to-pinyin')
const purpleculter_get = require('./purpleculter_get').purpleculter_get

function readStreamArray(stream) {
  return new Promise((resolve, reject) => {
      const data = []

      stream.on("data", chunk => data.push(chunk))
      stream.on("end", () => resolve(data))
      stream.on("error", error => reject(error))
  })
}

async function mymapper(x) {
  const sentence = x['sentence']

  // console.log({ sentence, x })

  let purpleculternumbered = null

  try {
    purpleculternumbered = await purpleculter_get(sentence)
    console.log({ sentence, purpleculternumbered })
  } catch (e) {
    console.error(e)
  }

  // const pinyin_marked = await (x['pinyin_marked'] ? Promise.resolve(x['pinyin_marked']) : chineseToPinyin(sentence))
  // const pinyin_numbered = await convertPinyinMarkedToNumbered(pinyin_marked)
  // // console.log({ pinyin_numbered })
  // const pinyin_ru = convertPinyinNumberedToRu(pinyin_numbered)
  // // console.log({ pinyin_ru })

  return {
    id: x['id'],
    sentence,
    purpleculternumbered,
    // pinyin_marked,
    // pinyin_numbered,
    // pinyin_ru,
  }
}

// const convertPinyinMarkedToNumbered = async (text) => {
//   let words = require('pinyin-split').default(text, true)
//   words = require('pinyin-utils').markToNumber(words, false)
//   return words.join('')
// }

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese Grammar Wiki.txt').pipe(csv({ separator: "\t", headers: [ "id", "sentence" ] })))

convertToRuTable = await ( readStreamArray(fs.createReadStream('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-ru-by-kfcd').pipe(csv({ separator: '\t', headers: ["numbered", "marked", "ru"] })))
    .then(convertToRuTable => {
      return R.pipe(
        R.sortBy((x) => x.numbered.length),
        R.reverse
      )(convertToRuTable)
    })
  )

output = JSON.parse("[" + fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/random-scripts/pinyincache.json').toString().replace(/}{/g, "},{") + "]")

// let output = []

// ;(async function(){
//   for (let i = 0; i < input.length; i++) {
//     const res = await mymapper(input[i])

//     fs.appendFileSync('pinyincache.json', JSON.stringify(res))

//     output.push(res)

//     console.log({ i, l: input.length })
//   };
// })();

function convertPinyinNumberedToRu(text) {
  let buffer = text
  for (let { numbered, marked, ru } of convertToRuTable) {
    // `<span class="pinyin-numbered">${numbered}</span>`
    const output = `<span class="pinyin-marked">${marked}</span><span class="pinyin-ru">${ru}</span>`
    const regexpr = new RegExp("\>" + numbered + "\<", 'g')
    buffer = buffer.replace(regexpr, `>${output}<`)
  }
  return buffer
}

output_ = output.map(x => {
  const s = x.purpleculternumbered
    .replace(/ id="[^"]+"/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/<div class="pyd h7"><\/div>/g, "")
    .replace(/ href=\"[^\"]+\"/g, "")
    .replace(/\<a /g, "<span ")
    .replace(/\<\/a\>/g, "</span>")
    .replace(/\<span style="display:none">[^\<]*\<\/span\>/g, '')
    .replace(/\<div class="small text-muted pt-1" style="display:none;"\>\<\/div\>/g, '')

  return { id: x.id, purpleculternumbered: convertPinyinNumberedToRu(s) }
})


await require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/Chinese Grammar Wiki2.txt', header:  ["id", "purpleculternumbered"].map(x => ({ id: x, title: x })) }).writeRecords(output_)
