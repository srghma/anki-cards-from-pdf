const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./scripts/lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
toNumberOrNull = x => Number(x) === 0 ? null : Number(x)

// table = await readStreamArray(fs.createReadStream('/home/srghma/projects/anki-cards-from-pdf/chinese pinyin mnemonics2.tsv').pipe(csv({ separator: "\t", headers: "ru en 0 1 2 3 4 5".split(" ") })))
// table = table.map(x => ({ ...x, ruen: `${x.ru}|${x.en}` }))
// table = R.map(x => x[0], R.groupBy(R.prop('ruen'), table))
// table = R.map(x => {
//   x = R.map(x => x.split(' ')[0].trim(), x)
//   return R.pick('1 2 3 4 5'.split(' '), x)
// }, table)

allKanjiOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: "kanji c ms purpleculture_pinyin purpleculture_hsk chinese_junda_freq_ierogliph_number".split(" ") })))

// listOfKanji = allKanjiOrig.map(x => ({
//   kanji:                               x.kanji,
//   purpleculture_hsk:                   toNumberOrNull(x.purpleculture_hsk),
//   chinese_junda_freq_ierogliph_number: toNumberOrNull(x.chinese_junda_freq_ierogliph_number),
//   purpleculture_pinyin:                x.purpleculture_pinyin ? (Array.from(x.purpleculture_pinyin.matchAll(/mp3\/([^\.]+)/g) || [])).map(x => x[1]) : []
// }))
// pinyinToKanji = listOfKanji.map(x => x.purpleculture_pinyin.map(purpleculture_pinyin=> ({ ...x, purpleculture_pinyin}))).flat()
// pinyinToKanji = R.groupBy(R.prop('purpleculture_pinyin'), pinyinToKanji)

// printed = listOfKanji.map(x => {
//   const printRow  = ([k, class_, v]) => {
//     v = R.sortBy(R.prop('chinese_junda_freq_ierogliph_number'), v)
//     if (v.length <= 0) { return null }
//     const key = nodeWith('span', { class: "key" }, k)
//     const val = v
//       .map(R.prop('kanji'))
//       .map(nodeWith('span', { class: ["kanji"] }))
//       .join(',')
//     return nodeWith('div', { class: ["row", `row-${class_}`] }, `${key}: ${val}`)
//   }
//   const withSamePronouciation_ = x.purpleculture_pinyin.map(pinyin => {
//     const v_ = pinyinToKanji[pinyin]
//     const findHSK = n => v_.filter(x => x.purpleculture_hsk == n)
//     const printedValues = [
//       ["HSK 1", "hsk-1", findHSK(1)],
//       ["HSK 2", "hsk-2", findHSK(2)],
//       ["HSK 3", "hsk-3", findHSK(3)],
//       ["HSK 4", "hsk-4", findHSK(4)],
//       ["HSK 5", "hsk-5", findHSK(5)],
//       ["HSK 6", "hsk-6", findHSK(6)],
//       ["5000",  "5000", v_.filter(x => x.chinese_junda_freq_ierogliph_number <= 5000 && x.purpleculture_hsk === null)],
//       ["Other", "other", v_.filter(x => x.chinese_junda_freq_ierogliph_number > 5000 && x.purpleculture_hsk === null)],
//     ].map(printRow).filter(x => x != null)
//     return `
//     <div class="pinyin">${pinyin}</div>
//     <div class="same-pronounciation">${printedValues}</div>
//     `
//   }).join('\n')
//   return {
//     kanji: x.kanji,
//     withSamePronouciation_,
//   }
// })

// ;(function(input){
//   const s = input.map(x => Object.values(x).join('\t')).join('\n')
//   // const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
//   // const s = require('csv-writer').createObjectCsvStringifier({ header, fieldDelimeter: ";" }).stringifyRecords(input)
//   fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
// })(printed);

allKanji = R.map(R.pick("kanji purpleculture_hsk chinese_junda_freq_ierogliph_number purpleculture_pinyin".split(" ")), allKanjiOrig)
allKanji = R.map(R.over(R.lensProp("purpleculture_pinyin"), x => {
  x = Array.from(x.matchAll(/<a class="pinyin tone(\d+)\s*" href="https:\/\/www\.purpleculture\.net\/mp3\/([^\.]+)\.mp3">([^<]+)<\/a>/g))
  x = x.map(x => ({ number: x[1], numbered: x[2], marked: x[3] }))
  x = x.map(x => ({ ...x, withoutMark: x.numbered.replace(/\d+/g, '') }))
  console.log(x)
  return x
}), allKanji)
allKanji = allKanji.map(kanjiInfo => kanjiInfo.purpleculture_pinyin.map(pinyinInfo => ({
  // numbered: 'shan4',
  kanji: kanjiInfo.kanji,
  purpleculture_hsk: toNumberOrNull(kanjiInfo.purpleculture_hsk),
  chinese_junda_freq_ierogliph_number: toNumberOrNull(kanjiInfo.chinese_junda_freq_ierogliph_number),
  number: toNumberOrNull(pinyinInfo.number),
  marked: pinyinInfo.marked,
  withoutMark: pinyinInfo.withoutMark,
}))).flat()

// { '1': 332, '2': 258, '3': 321, '4': 355, '5': 36 }
// R.mapObjIndexed(R.compose(R.prop('length'), R.uniq, R.map(R.prop('withoutMark'))), R.groupBy(R.prop('number'), allKanji))

// pinyin = R.mapObjIndexed(R.compose(x => x.sort(), R.uniq, R.map(R.prop('withoutMark'))), R.groupBy(R.prop('number'), allKanji))

// dir = '1-world'
// parentDir = '/home/srghma/.local/share/Anki2/User 1/collection.media'
// files = fs.readdirSync(`${parentDir}/mnemonic-places/${dir}`)
// filesWithPinyin = R.zip(R.uniq(R.map(R.prop('withoutMark'), allKanji)).sort(), files)
// pinyinCss = [
//   "1-high.jpg",
//   "2-what.jpg",
//   "3-convultion.jpg",
//   "4-no.jpg",
//   "5-stop.jpg",
// ].map((x, i) => `.my-pinyin-image-container.pinyin-number-${i + 1} img:nth-child(3) { content: url(mnemonic-places/${x}); }`).join('\n')
// pinyinCss = pinyinCss + '\n' + filesWithPinyin.map(x => `.my-pinyin-image-container.pinyin-${x[0]} img:nth-child(2) { content: url(mnemonic-places/${dir}/${encodeURIComponent(x[1])}); }
// .my-pinyin-image-container.pinyin-${x[0]} span:before { content: "${x[1].replace(/\.jpg/g, '')}"; }
// `).join('\n')
// fs.writeFileSync('/home/srghma/.local/share/Anki2/User 1/collection.media/mnemonic-places/pinyin-to-countries.css', pinyinCss)
// allKanjiForTable = R.groupBy(R.prop('withoutMark'), R.sortBy(R.prop('withoutMark'), allKanji))
// pinyinToImageForTable = R.pipe(
//   R.groupBy(R.prop('purpleculture_pinyin')),
//   R.map(R.groupBy(R.prop('n'))),
//   R.map(R.map(x => x[0]))
// )(pinyin)

cities_ = R.reverse(R.sortBy(R.prop('population'), require('all-the-cities')))
cities_ = R.map(R.pick('cityId name country'.split(' ')), cities_)
cities_ = R.fromPairs(R.map(x => [x.cityId, R.pick('name country'.split(' '), x)], cities_))

// citiesBuff = cities_
// output = R.fromPairs(R.reverse(R.sortBy(R.prop('length'), R.keys(allKanji))).map(pinyin => {
//   let foundInStart = true
//   let [citiesWith, citiesWithout] = R.partition(city => city.country != 'CN' && city.name.toLowerCase().startsWith(pinyin), citiesBuff)
//   if (citiesWith.length <= 0) {
//     [citiesWith, citiesWithout] = R.partition(city => city.name.toLowerCase().startsWith(pinyin), citiesBuff)
//   }
//   if (citiesWith.length <= 0) {
//     foundInStart = false
//     [citiesWith, citiesWithout] = R.partition(city => city.name.toLowerCase().includes(pinyin), citiesBuff)
//   }

//   if (citiesWith.length <= 0) {
//     return [pinyin, null]
//   }

//   if (foundInStart) {
//     citiesBuff = citiesWithout
//     return [pinyin, citiesWith[0]]
//   } else {
//     // console.log({ x, citiesWithout })
//     let citiesWithFirst5 = citiesWith.slice(0, 1)
//     const citiesWithOther = citiesWith.slice(1)
//     citiesBuff = [...citiesWithOther, ...citiesWithout]
//     citiesWithFirst5 = citiesWithFirst5[0]

//     return [pinyin, citiesWithFirst5]
//   }
// }))
// output_ = R.mapObjIndexed((v, k) => R.pick('name country'.split(' '), v), output)

// require("i18n-iso-countries").registerLocale(require("i18n-iso-countries/langs/en.json"))

// pinyinToCountry = R.mapObjIndexed((x, pinyin) => {
//   if (!x) { return null }
//   const country = require("i18n-iso-countries").getName(x.country, "en", {select: "official"})
//   const name = x.name.replace(new RegExp(pinyin, "i"), pinyin.toUpperCase())
//   return { name, country, "1": "", "2": "", "3": "", "4": "", "5": "" }
// }, output)

// pinyinToCountry

// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-countries.json', JSON.stringify(pinyinToCountry, null, 2))

// export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
// export PUPPETEER_EXECUTABLE_PATH=/nix/store/3pvqzg29lhyc0gh3hbfpymf7yganvni8-google-chrome-beta-88.0.4324.50/bin/google-chrome-beta
// node --experimental-repl-await --unhandled-rejections=strict

pinyinToCountry = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-countries.json').toString())

const Scraper = require('images-scraper')
const google = new Scraper({
  puppeteer: {
    headless: true,
  },
})

promises = R.values(R.mapObjIndexed(
  (v, k) => {
    if (!v.name) { return null }
    const place = `${v.country} ${v.name}`
    return [
      `${place} statue`,
      `${place} museum`,
      `${place} water`,
      `${place} temple church`,
      `${place} restaurant`,
    ].map((q, i) => ({ i: i + 1, q, k }))
  },
  pinyinToCountry
)).filter(R.identity).flat()

mkQueue(1).addAll(
  promises.map(({ i, k, q }) => async jobIndex => {
    if (pinyinToCountry[k][i]) {
      console.log({ m: "skipping", k, q, i })
      return
    }
    const images = await google.scrape(q, 5)
    console.log({ images, k, q, i })
    pinyinToCountry[k][i] = images
    fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-countries.json', JSON.stringify(pinyinToCountry, null, 2))
  })
)

mapper = (v, k) => {
  const print = (v_) => {
    if (v_.length <= 0) { return null }
    const mark = v_[0].marked
    const findHSK = n => v_.filter(x => x.purpleculture_hsk == n)

    const printRow  = ([k, class_, v]) => {
      if (v.length <= 0) { return null }
      const key = nodeWith('span', { class: "key" }, k)
      const val = v
        .map(R.prop('kanji'))
        .map(nodeWith('span', { class: ["kanji"] }))
        .join(',')
      return nodeWith('div', { class: ["row", `row-${class_}`] }, `${key}: ${val}`)
    }

    const printedValues = [
      ["HSK 1", "hsk-1", findHSK(1)],
      ["HSK 2", "hsk-2", findHSK(2)],
      ["HSK 3", "hsk-3", findHSK(3)],
      ["HSK 4", "hsk-4", findHSK(4)],
      ["HSK 5", "hsk-5", findHSK(5)],
      ["HSK 6", "hsk-6", findHSK(6)],
      ["5000",  "5000", v_.filter(x => x.chinese_junda_freq_ierogliph_number <= 5000 && x.purpleculture_hsk === null)],
      ["Other", "other", v_.filter(x => x.chinese_junda_freq_ierogliph_number > 5000 && x.purpleculture_hsk === null)],
    ].map(printRow).filter(x => x != null)

    let image = pinyinToImageForTable[k][v_[0].number]
    // image = `<img src="file:///home/srghma/.local/share/Anki2/User 1/collection.media/mnemonic-places/${encodeURIComponent(image.dir)}/${encodeURIComponent(image.filename)}" alt="${image.filename.replace(/\.jpg/, '')}"></a>`
    image = `<img src="file:///home/srghma/.local/share/Anki2/User 1/collection.media/mnemonic-places/${encodeURIComponent(image.dir)}/${encodeURIComponent(image.filename)}" alt="${image.filename.replace(/\.jpg/, '')}">`

    let head = mark
    head = nodeWith('a', { href: `https://www.google.com/search?tbm=isch&q=${linkContent.split(' ').map(encodeURIComponent).join('+')}`, target: "_blank" }, head)
    head = nodeWith('span', { class: "marked" }, head)

    return [head, ...printedValues, image].join('\n')
  }

  const find = n => v.filter(x => x.number == n)

  return [
    k,
    print(find(1)),
    print(find(2)),
    print(find(3)),
    print(find(4)),
    print(find(5)),
  ]
}

allKanji_ = R.values(R.mapObjIndexed(mapper, allKanjiForTable))

fileContent = `<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Table</title>
  <style>
tr:nth-child(even) {background: #CCC; }
tr:nth-child(odd) {background: #FFF; }
.row-other { display: none; }
.example-image { display: block; }
.example-image img { max-height: 200px; max-width: 200px; }
  </style>
 </head><body><table>
   <tr>
    ${["", "", "", "1, ˉ", "2, ˊ", "3, ˇ", "4, ˋ", "5, ."].map(nodeWith('th', null)).join('\n')}
   </tr>
   ${allKanji_.map(R.map(x => nodeWith('td', null, x || ''))).map(x => nodeWith('tr', null, x.join('  \n'))).join('\n')}
  </table>
 </body>
</html>`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/table.html', fileContent)
