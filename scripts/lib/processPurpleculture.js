const R = require('ramda')
const RA = require('ramda-adjunct')
const chinesePinyinMnemonics = require('./chinesePinyinMnemonics').chinesePinyinMnemonics

const arrayToRecord = (headers) => (x) => {
  buff = {}
  headers.forEach((h, i) => {
    buff[h] = x[i]
  })
  return buff
}

let convertToRuTable = R.pipe(
  R.map(arrayToRecord([
    'numbered',
    'marked',
    '3',
    '4',
    '5',
    '6',
    'cased',
    'ru',
  ])),
  R.sortBy(x => x.numbered.length),
  R.reverse
)(require('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-ru-by-kfcd.json'))

let chinesePinyinMnemonicsUnused = JSON.parse(JSON.stringify(chinesePinyinMnemonics))
convertToRuTable = convertToRuTable.map(x => {
  let id = x['numbered'].replace(/\d/g, '')

  if (["hng", "ng", "hm", "n", "m", "ê"].includes(id)) { return }

  if (id === "r") { id = "er" }

  const m = chinesePinyinMnemonics.find(x => {
    if (x.en.length < 1) {
      console.log(x.en)

      throw new Error(x.en)
    }
    return x.en.includes(id)
  })
  chinesePinyinMnemonicsUnused = chinesePinyinMnemonicsUnused.filter(x => !x.en.includes(id))

  if (!m) {
    console.log({ x })
    throw new Error(id)
  }

  return { ...x, ...m }
}).filter(R.identity)
if (chinesePinyinMnemonicsUnused.length > 0) { throw new Error() }

function convertPinyinNumberedToRu(text) {
  return text.replace(
    /<span class="pinyin tone(\d)\s*">([^<]+)<\/span>/g,
    (fullStr, group1, group2) => {
      let numbered = group2

      if (numbered == "nu:1") { numbered = "nv1" }
      if (numbered == "nu:2") { numbered = "nv2" }
      if (numbered == "nu:3") { numbered = "nv3" }
      if (numbered == "nu:4") { numbered = "nv4" }
      if (numbered == "nu:5") { numbered = "nv5" }

      if (numbered == "lu:1") { numbered = "lv1" }
      if (numbered == "lu:2") { numbered = "lv2" }
      if (numbered == "lu:3") { numbered = "lv3" }
      if (numbered == "lu:4") { numbered = "lv4" }
      if (numbered == "lu:5") { numbered = "lv5" }

      const el = convertToRuTable.find(x => x.numbered === numbered)

      if (!el) {
        console.log({
          // text,
          // fullStr,
          group1,
          group2
        })
        throw new Error(group2)
      }

      const output = `<span class="pinyin-vowel">${el.vowel}</span><span class="pinyin-consonant">${el.consonant}</span><span class="pinyin-location">${el.location}</span><span class="pinyin-human">${el.human}</span><span class="pinyin-marked">${el.marked}</span><span class="pinyin-ru">${el.ru}</span><span class="pinyin-numbered">${el.numbered}</span>`

      return '<span class="pinyin tone' + group1 + '">' + output + '</span>'
    }
  )
}

function processPurpleculture(text) {
  const s = text
    .replace(/ id="[^"]+"/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/<div class="pyd h7"><\/div>/g, "")
    .replace(/ href=\"[^\"]+\"/g, "")
    .replace(/\<a /g, "<span ")
    .replace(/\<\/a\>/g, "</span>")
    .replace(/\<span style="display:none">[^\<]*\<\/span\>/g, '')
    .replace(/\<div class="small text-muted pt-1" style="display:none;"\>\<\/div\>/g, '')

  return convertPinyinNumberedToRu(s)
}

exports.convertToRuTable = convertToRuTable
exports.processPurpleculture = processPurpleculture
exports.arrayToRecord = arrayToRecord
