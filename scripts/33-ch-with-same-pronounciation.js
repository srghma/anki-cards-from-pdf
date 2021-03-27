allKanjiOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese.txt').pipe(csv({ separator: "\t", headers: "k1 k2 img".split(" ") })))
allKanjiOrig_ = allKanjiOrig.map(x => ({ k1: x.k1.trim(), k2: x.k2.split(' ').map(x => x.trim()).filter(R.identity), img: x.img, sound: x._12.trim() }))
trad = allKanjiOrig_.map(x => x.k2.map(k => ({ k1: k.trim(), img: x.img, sound: x.sound }))).flat()
allKanjiOrig_ = R.concat(trad, allKanjiOrig_)
allKanjiOrig_ = R.map(R.props("k1 sound".split(' ')), allKanjiOrig_)

;(function(input){
  // const s = input.map(x => Object.values(x).join('\t')).join('\n')
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header, fieldDelimeter: ";" }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(allKanjiOrig_);

listOfKanji = allKanjiOrig.map(x => ({
  kanji:                               x.kanji,
  purpleculture_hsk:                   toNumberOrNull(x.purpleculture_hsk),
  chinese_junda_freq_ierogliph_number: toNumberOrNull(x.chinese_junda_freq_ierogliph_number),
  purpleculture_pinyin:                x.purpleculture_pinyin ? (Array.from(x.purpleculture_pinyin.matchAll(/mp3\/([^\.]+)/g) || [])).map(x => x[1]) : []
}))
pinyinToKanji = listOfKanji.map(x => x.purpleculture_pinyin.map(purpleculture_pinyin=> ({ ...x, purpleculture_pinyin}))).flat()
pinyinToKanji = R.groupBy(R.prop('purpleculture_pinyin'), pinyinToKanji)

printed = listOfKanji.map(x => {
  const printRow  = ([k, class_, v]) => {
    v = R.sortBy(R.prop('chinese_junda_freq_ierogliph_number'), v)
    if (v.length <= 0) { return null }
    const key = nodeWith('span', { class: "key" }, k)
    const val = v
      .map(R.prop('kanji'))
      .map(nodeWith('span', { class: ["kanji"] }))
      .join(',')
    return nodeWith('div', { class: ["row", `row-${class_}`] }, `${key}: ${val}`)
  }
  const withSamePronouciation_ = x.purpleculture_pinyin.map(pinyin => {
    const v_ = pinyinToKanji[pinyin]
    const findHSK = n => v_.filter(x => x.purpleculture_hsk == n)
    const printedValues = [
      ["HSK 1", "hsk-1", findHSK(1)],
      ["HSK 2", "hsk-2", findHSK(2)],
      ["HSK 3", "hsk-3", findHSK(3)],
      ["HSK 4", "hsk-4", findHSK(4)],
      ["HSK 5", "hsk-5", findHSK(5)],
      ["HSK 6", "hsk-6", findHSK(6)],
      ["5000",  "5000", v_.filter(x => x.freq <= 5000 && x.hsk === null)],
      ["Other", "other", v_.filter(x => x.freq > 5000 && x.hsk === null)],
    ].map(printRow).filter(x => x != null).join('\n')
    return `
    <div class="pinyin">${pinyin}</div>
    <div class="same-pronounciation">${printedValues}</div>
    `
  }).join('\n')
  return {
    kanji: x.kanji,
    withSamePronouciation_,
  }
})

;(function(input){
  // const s = input.map(x => Object.values(x).join('\t')).join('\n')
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header, fieldDelimeter: ";" }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(printed);
