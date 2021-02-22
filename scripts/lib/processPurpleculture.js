const R = require('ramda')

const arrayToRecord = (headers) => (x) => {
  buff = {}
  headers.forEach((h, i) => {
    buff[h] = x[i]
  })
  return buff
}

const convertToRuTable = R.pipe(
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
