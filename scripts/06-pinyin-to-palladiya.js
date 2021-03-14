// node --experimental-repl-await

// const pinyinConvert = require('pinyin-convert')
// const chineseToPinyin = require('chinese-to-pinyin')
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const purplecultre_pinyin_converter = require('./purplecultre_pinyin_converter').purplecultre_pinyin_converter

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
    purpleculternumbered = await purplecultre_pinyin_converter(sentence)
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

output = JSON.parse("[" + fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/scripts/pinyincache.json').toString().replace(/}{/g, "},{") + "]")

// let output = []

// ;(async function(){
//   for (let i = 0; i < input.length; i++) {
//     const res = await mymapper(input[i])

//     fs.appendFileSync('pinyincache.json', JSON.stringify(res))

//     output.push(res)

//     console.log({ i, l: input.length })
//   };
// })();

output_ = output.map(x => {
  return { id: x.id, purpleculternumbered: require('./lib/processPurpleculture').processPurpleculture(x.purpleculternumbered) }
})


await require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/Chinese Grammar Wiki2.txt', header:  ["id", "purpleculternumbered"].map(x => ({ id: x, title: x })) }).writeRecords(output_)
