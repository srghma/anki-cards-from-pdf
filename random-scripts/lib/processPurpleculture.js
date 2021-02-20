convertToRuTable = R.pipe(
  R.map(x => ({ numbered: x[0], marked: x[1], ru: x[2] })),
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

exports.processPurpleculture = function processPurpleculture(text) {
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
