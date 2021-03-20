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
// const cities = require('all-the-cities')

// table = await readStreamArray(fs.createReadStream('/home/srghma/projects/anki-cards-from-pdf/chinese pinyin mnemonics2.tsv').pipe(csv({ separator: "\t", headers: "ru en 0 1 2 3 4 5".split(" ") })))
// table = table.map(x => ({ ...x, ruen: `${x.ru}|${x.en}` }))
// table = R.map(x => x[0], R.groupBy(R.prop('ruen'), table))
// table = R.map(x => {
//   x = R.map(x => x.split(' ')[0].trim(), x)
//   return R.pick('1 2 3 4 5'.split(' '), x)
// }, table)

allKanjiOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: "kanji hsk freq pinyin".split(" ") })))
allKanji = R.map(R.pick("kanji hsk freq pinyin".split(" ")), allKanjiOrig)
allKanji = R.map(R.over(R.lensProp("pinyin"), x => {
  x = Array.from(x.matchAll(/<a class="pinyin tone(\d+)\s*" href="https:\/\/www\.purpleculture\.net\/mp3\/([^\.]+)\.mp3">([^<]+)<\/a>/g))
  x = x.map(x => ({ number: x[1], numbered: x[2], marked: x[3] }))
  x = x.map(x => ({ ...x, withoutMark: x.numbered.replace(/\d+/g, '') }))
  console.log(x)
  return x
}), allKanji)
toNumber = x => {
  x = Number(x)
  return x === 0 ? null : x
}
allKanji = allKanji.map(kanjiInfo => kanjiInfo.pinyin.map(pinyinInfo => ({
  // numbered: 'shan4',
  kanji: kanjiInfo.kanji,
  hsk: toNumber(kanjiInfo.hsk),
  freq: toNumber(kanjiInfo.freq),
  number: toNumber(pinyinInfo.number),
  marked: pinyinInfo.marked,
  withoutMark: pinyinInfo.withoutMark,
}))).flat()

// { '1': 332, '2': 258, '3': 321, '4': 355, '5': 36 }
// R.mapObjIndexed(R.compose(R.prop('length'), R.uniq, R.map(R.prop('withoutMark'))), R.groupBy(R.prop('number'), allKanji))

// pinyin = R.mapObjIndexed(R.compose(x => x.sort(), R.uniq, R.map(R.prop('withoutMark'))), R.groupBy(R.prop('number'), allKanji))

dir = '1-world'
parentDir = '/home/srghma/.local/share/Anki2/User 1/collection.media'
files = fs.readdirSync(`${parentDir}/mnemonic-places/${dir}`)
filesWithPinyin = R.zip(R.uniq(R.map(R.prop('withoutMark'), allKanji)).sort(), files)

pinyinCss = [
  "1-high.jpg",
  "2-what.jpg",
  "3-convultion.jpg",
  "4-no.jpg",
  "5-stop.jpg",
].map((x, i) => `.my-pinyin-image-container.pinyin-number-${i + 1} img:nth-child(3) { content: url(mnemonic-places/${x}); }`).join('\n')

pinyinCss = pinyinCss + '\n' + filesWithPinyin.map(x => `.my-pinyin-image-container.pinyin-${x[0]} img:nth-child(2) { content: url(mnemonic-places/${dir}/${encodeURIComponent(x[1])}); }
.my-pinyin-image-container.pinyin-${x[0]} span:before { content: "${x[1].replace(/\.jpg/g, '')}"; }
`).join('\n')

fs.writeFileSync('/home/srghma/.local/share/Anki2/User 1/collection.media/mnemonic-places/pinyin-to-countries.css', pinyinCss)

allKanjiForTable = R.groupBy(R.prop('withoutMark'), R.sortBy(R.prop('withoutMark'), allKanji))

pinyinToImageForTable = R.pipe(
  R.groupBy(R.prop('pinyin')),
  R.map(R.groupBy(R.prop('n'))),
  R.map(R.map(x => x[0]))
)(pinyin)

// cities_ = R.reverse(R.sortBy(R.prop('population'), cities))
// cities_ = R.map(R.pick('cityId name country'.split(' ')), cities_)
// cities_ = R.fromPairs(R.map(x => [x.cityId, R.pick('name country'.split(' '), x)], cities_))

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
// pinyinToCountry = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-countries.json').toString())

// const Scraper = require('images-scraper')
// const google = new Scraper({
//   puppeteer: {
//     headless: true,
//   },
// })

// promises = R.values(R.mapObjIndexed(
//   (v, k) => {
//     if (!v.name) { return null }
//     const place = `${v.country} ${v.name}`
//     return [
//       `${place} statue`,
//       `${place} museum`,
//       `${place} water`,
//       `${place} temple church`,
//       `${place} restaurant`,
//     ].map((q, i) => ({ i: i + 1, q, k }))
//   },
//   pinyinToCountry
// )).filter(R.identity).flat()


// {
//   duan
//   Duan Lake in New York
//   1: https://lh5.googleusercontent.com/p/AF1QipMUAWiagjd64VyRadCIJdfuhcv26vIhm929iP3S=w203-h270-k-no
//   3: https://lh5.googleusercontent.com/p/AF1QipNgr18lyxkNt93Z3aMYBDhaYHa1g4cnFkadj7So=w203-h270-k-no
//   4: https://lh5.googleusercontent.com/p/AF1QipN2U-3ZYSwioOWhSTtw2qpxo7bIiZIoGg_bV2pV=w203-h152-k-no


//   chuai
//   Chuailo Resort
//   Мізорам, Індія
//   https://lh5.googleusercontent.com/p/AF1QipMXHv5QsLI51OcV7MK23jLv3EU8k04PqADjAWS4=w203-h114-k-no
//   https://lh5.googleusercontent.com/p/AF1QipOwWgvr98WNqTD2rE7GTFagP9cQmMQBKlLWzjyS=w203-h270-k-no
//   https://lh5.googleusercontent.com/p/AF1QipM4XmcxMaesHNCowwH56kGB484qghQowdJQwHHQ=w203-h270-k-no
//   https://lh5.googleusercontent.com/p/AF1QipPjUSsgCWDE6Zo8grlIXN1UHDKBqPu2IWGN1mSp=w203-h152-k-no
// }

// mkQueue(1).addAll(
//   promises.map(({ i, k, q }) => async jobIndex => {
//     if (pinyinToCountry[k][i]) {
//       console.log({ m: "skipping", k, q, i })
//       return
//     }
//     const images = await google.scrape(q, 5)
//     console.log({ images, k, q, i })
//     pinyinToCountry[k][i] = images
//     fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-countries.json', JSON.stringify(pinyinToCountry, null, 2))
//   })
// )

mapper = (v, k) => {
  const ru = require('./scripts/lib/purplecultureSimpleEnToSimpleRu').convertToRuTable[k]

  if (!ru) { throw new Error(k) }

  const print = (v_) => {
    if (v_.length <= 0) { return null }
    const mark = v_[0].marked
    const findHSK = n => v_.filter(x => x.hsk == n)

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
      ["5000",  "5000", v_.filter(x => x.freq <= 5000 && x.hsk === null)],
      ["Other", "other", v_.filter(x => x.freq > 5000 && x.hsk === null)],
    ].map(printRow).filter(x => x != null)

    let image = pinyinToImageForTable[k][v_[0].number]
    image = `<img src="file:///home/srghma/.local/share/Anki2/User 1/collection.media/mnemonic-places/${encodeURIComponent(image.dir)}/${encodeURIComponent(image.filename)}" alt="${image.filename.replace(/\.jpg/, '')}"></a>`

    let head = mark
    // head = nodeWith('a', { href: `https://www.google.com/search?tbm=isch&q=${linkContent.split(' ').map(encodeURIComponent).join('+')}`, target: "_blank" }, head)
    head = nodeWith('span', { class: "marked" }, head)

    return [head, ...printedValues, image].join('\n')
  }

  const find = n => v.filter(x => x.number == n)

  return [
    k,
    ru,
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
