const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const removeHTML = require('./scripts/lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./scripts/lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
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
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const escapeRegExp = require('./scripts/lib/escapeRegExp').escapeRegExp
const XLSX = require('xlsx')
dictionary = require('chinese-dictionary')

const toNumberOrNull = str => { if (!str) { return null }; var num = parseFloat(str); if (isFinite(num)) { return num; } else { return null; }; }
const checkSameLength = (x, y) => { if (x.length != y.length) { throw new Error(`x.length (${x.length}) != y.length (${y.length})`) } }
const zipOrThrowIfNotSameLength = (x, y) => { checkSameLength(x, y); return R.zip(x, y); }
function splitDictOnEntries(dict) {
  const buffer = []
  let curr = []
  const dictLength = dict.length
  dict.forEach((dictElement, dictElementIndex) => {
    if (dictElement === '_') { return } // omit, prob some mistake in dict
    if (dictElement === '') {
      if (curr.length !== 0) { buffer.push(curr) }
      curr = []
      return
    }
    curr.push(dictElement)
    const isLast = dictElementIndex === (dictLength - 1)
    if (isLast && dictElement !== '') {
      if (curr.length !== 0) { buffer.push(curr) }
    }
  })
  return buffer
}
withoutComments = x => x.filter(x => !x.startsWith('#'))
comments = x => x.filter(x => x.startsWith('#'))
dabkrs_210426__orig = fs.readFileSync('/home/srghma/Downloads/dabkrs_210627').toString().split('\n')
dabkrs_210426_split = splitDictOnEntries(withoutComments(dabkrs_210426__orig.map(R.trim))).filter(R.identity)
toRecord = xs => {
  const buffer = {}
  xs.forEach(x => {
    const l = x.length
    let ch = null
    let pinyin = null
    let ru = null
    if (l == 2) {
      ch = x[0]
      ru = x[1]
    }
    else if (l == 3) {
      {
        ch = x[0]
        pinyin = x[1]
        ru = x[2]
      }
    }
    else {
      console.log(x);
      throw new Error(l);
    }
    buffer[ch] = { pinyin, ru }
  })
  return buffer
}
void (dabkrs_210426_record = toRecord(dabkrs_210426_split))

void (workbook = XLSX.readFile('/home/srghma/Downloads/big-table.xlsx'))
void (worksheet = workbook.Sheets[workbook.SheetNames[0]])
gigasheet = XLSX.utils.sheet_to_json(worksheet, { header: [
  'gPlecoHeadword',
  'gPlecoPinyin',
  'gRank_Word',
  'gFreq_Word',
  'Simplified',
  'Traditional',
  'jRank_Char',
  'dRank',
  'jPercentile_Char',
  'uUnicodeHex',
  'kTotalStrokes',
  'gNumChars',
  'HSK',
  'yRank',
] }).slice(6)

gigasheet_ = gigasheet.filter(x => x.Simplified.length !== 1)
gigasheet_ = gigasheet_.map(x => {
  let ru_simpl = dabkrs_210426_record[x.Simplified]
  ru_simpl = ru_simpl && ru_simpl.ru
  let ru_trad = dabkrs_210426_record[x.Traditional]
  ru_trad = ru_trad && ru_trad.ru
  return ({
    ...x,
    ru: ru_simpl || ru_trad,
  })
})

// gigasheet_.filter(x => !x.ru)

await dictionary.init()

output = []
promises = gigasheet_.map((x, index) => async jobIndex => {
  try {
    const translation = await dictionary.query(x.Simplified)
    output.push({
      ...x,
      translation,
    })
  } catch (e) {
    console.log(e)
  }
})
await mkQueue(10).addAll(promises)

// output.filter(x => x.translation.length > 1)

output_ = R.sortBy(x => x.gPlecoPinyin.toLowerCase(), output)
output_ = output_.map(x => {
  let translation = x.translation
  translation = translation.filter(y => y.simplified === x.Simplified)
  translation = R.sortBy(x => x.english.length, translation)
  return {
    ...x,
    translation: translation[translation.length - 1]
  }
}).map(x => ({ ...x, ...(x.translation), translation: null }))

replaces = [
  // { search: '[m]',    replace: '<div>' },
  // { search: '[m1]',   replace: '<div>' },
  // { search: '[m2]',   replace: '<div>' },
  // { search: '[m3]',   replace: '<div>' },
  // { search: '[m4]',   replace: '<div>' },
  // { search: '[m5]',   replace: '<div>' },
  // { search: '[m6]',   replace: '<div>' },
  // { search: '[m7]',   replace: '<div>' },
  // { search: '[m8]',   replace: '<div>' },
  // { search: '[m9]',   replace: '<div>' },
  // { search: '[m10]',  replace: '<div>' },
  // { search: '[/m]',   replace: '</div>' },
  { search: '[b]',    replace: '<strong>' },
  { search: '[/b]',   replace: '</strong>' },
  { search: '[i]',    replace: '<i>' },
  { search: '[/i]',   replace: '</i>' },
  { search: '[p]',    replace: '<span class="paragraph">' },
  { search: '[/p]',   replace: '</span>' },
  { search: '{-}',    replace: '-' },
  { search: '[ref]',  replace: '<span class="reference">' },
  { search: '[/ref]', replace: '</span>' },
  { search: '[*]',    replace: '' },
  { search: '[/*]',   replace: '' },
  { search: '[ex]',   replace: '<span class="example-item">' },
  { search: '[/ex]',  replace: '</span>' },
  { search: '[c]',    replace: '' },
  { search: '[/c]',   replace: '' },
]

function fixTransl(t) {
  replaces.forEach(({ search, replace }) => {
    t = t.replace(new RegExp(escapeRegExp(search), 'g'), replace)
  })
  return t
}

// inputOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))
// input = inputOrig.map(x => ({
//   kanji: x.kanji,
//   purpleculture_orig: x._1,
//   opposite: x._17.trim(),
//   chinese_junda_freq_ierogliph_number: toNumberOrNull(x._27),
//   google_ru: x._30,
//   google_en: x._31,
//   sherlock_index: toNumberOrNull(x._21),
//   harry_1_index: toNumberOrNull(x._89),
//   noah_index: toNumberOrNull(x._90),
//   bkrs_pinyin: x._94.split(', '),
//   bkrs_transl: x._95,
// }))
// toFreqAndGoogle = R.fromPairs(input.map(x => [x.kanji, x]))

colorize = ch => `<span onclick="window.showKanjiIframe('${ch}')">${ch}</span>`
colorizes = s => s.split('').map(ch => isHanzi(ch) ? colorize(ch) : ch).join('')

link = (ch, t) => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${encodeURIComponent(ch)}">${t}</a>`

groupByAndToArray = (byFn, key, val, input) => R.toPairs(R.groupBy(byFn, input)).map(x => ({ [key]: x[0], [val]: x[1] }))

tOrig = fs.readFileSync('./table-with-tabs.txt').toString()
tOrigLines = tOrig.split('\n')
splitLine = line => R.split('\t', line).flat().flat()
sections_ = tOrigLines.filter(R.identity).map(line => ({ sectionLetter: line.trim()[0], pinyins: splitLine(line) }))
toSectionId = x => x.replace(/ü/g, 'v')

html = output_.filter(x => x.hsk > 0 || (x.ru && (x.english || '').length > 0 && x.gRank_Word < 10000))
html = R.sortBy(x => x.pinyinNumbers.toLowerCase(), html)
html = html.map(x => {
  ms = R.zip(x.pinyinMarks.split(' '), x.toneMarks).map(([x, t]) => String.raw`<span class="tone${t}">${x}</span>`).join(' ')
  ms = [
    ms,
    link(x.Simplified, 'simp'),
    x.Traditional == x.Simplified ? null : link(x.Traditional, 'trad'),
  ].filter(R.identity).join('<br>')

  const hsk = x.hsk > 0 ? x.hsk : ''
  // const sim = colorizes(x.Simplified)
  const sim = x.Simplified
  const trad = x.Traditional == x.Simplified ? '' : x.Traditional
  const marks = ms
  const en = x.english.join(`<br>`)
  const ru = x.ru.replace(/\[m\d\]/g, '').split('[/m]').map(R.trim).filter(R.identity).filter(x => !x.startsWith('[ex]') && !x.startsWith('[*]')).map(fixTransl).join('<br>')

  const front = `

<div class="hsk">${hsk}</div>
<div class="my-pinyin-hanzi">
<div class="sim">${sim}</div>
<div class="trad">${trad}</div>
<div class="marks">${marks}</div>
</div>
<div class="en">${en}</div>
<div class="ru">${ru}</div>
`
  const marked = x.pinyinMarks.split(' ')[0].toLowerCase()
  const sectionLetter = x.pinyinNumbers.split(' ')[0].toLowerCase().replace(/\d/, '')
  return { front, marked, sectionLetter, hsk: x.hsk > 0 ? x.hsk : null, gRank_Word: x.gRank_Word }
})

// trace = x => { console.log(x); return x }
// html = groupByAndToArray(R.prop('sectionLetter'), "sectionLetter", "pinyins", html).map(x => ({ sectionLetter: x.sectionLetter, pinyins: groupByAndToArray(R.prop('marked'), "marked", "front", x.pinyins).map(x => ({ marked: x.marked, front: R.sortBy(x => x.hsk || 9999, x.front).map(x => x.front).join('<hr>') })) }))
//
// // html[0].pinyins
//
// html_ = `
// <!DOCTYPE HTML>
// <html>
//  <head>
//   <meta charset="utf-8">
//   <title>Hua ma</title>
//   <link rel="stylesheet" href="main.css">
//   <style>
// .hsk-1, .hsk-2, .hsk-3, .hsk-4, .hsk-5, .hsk-6 { background-color: red; }
// .mytable tr > *:nth-child(1) { width: 1%; white-space: nowrap; }
// .mytable tr > *:nth-child(2) { width: 1%; white-space: nowrap; }
// .mytable tr > *:nth-child(3) { width: 1%; white-space: nowrap; }
// .mytable tr > *:nth-child(4) { width: 1%; white-space: nowrap; }
// .tone1 { color: #a3a3ff; }
// .tone2 { color: lightgreen; }
// .tone3 { color: #ff00ff; }
// .tone4 { color: #ff7b7b; }
//
// .pinyin__containers { display: flex; }
// .pinyin__root_container { display: none; }
// .pinyin__root_container--show { display: block; }
// .pinyin__container { flex-grow: 1; flex-basis: 0; }
//   </style>
//   <script src="dict-myscripts.js"></script>
//  </head>
//  <body id="ruby" class="nightMode my-pinyin-hanzi_container--front trainchinese-container--hide-hanzi purpleculture_pinyin--front">
//   <div class="table-container">
//     <table border="1">
//     ${sections_.map(x => String.raw`<tr>` + x.pinyins.map(x => x ? String.raw`<a onclick="window.showRootContainer('${x}')" href="#${x}">${x}</a>` : '').map(x => String.raw`<td>${x}</td>`).join('') + String.raw`</tr>`).join('\n')}
//     </table>
//   </div>
// ${
// html.map(({ sectionLetter, pinyins }) => {
//   return String.raw`
// <div id="pinyin__root_container__${sectionLetter}" class="pinyin__root_container">
// <h1><a id="${sectionLetter}"></a>${sectionLetter}</h1>
// <div class="pinyin__containers">
// ${
// pinyins.map(pinyin => {
// return String.raw`
// <div class="pinyin__container">
// <div class="pinyin__header">${pinyin.marked}</div>
// <div class="pinyin__item">${pinyin.front}</div>
// </div>`
// }).join('\n')
// }
// </div>
// </div>
// `
// }).join('\n')
// }
// </div>
// </div>
// <script src="myscripts.js"></script>
//  </body>
// </html>`
//
// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/dict-show-6000-transl.html', html_)

////////////////////

colorize = ch => `<span onclick="window.showKanjiIframe('${ch}')">${ch}</span>`
colorizes = s => s.split('').map(ch => isHanzi(ch) ? colorize(ch) : ch).join('')

link = (ch, t) => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${t}</a>`

tOrig = fs.readFileSync('./table-with-tabs.txt').toString()
tOrigLines = tOrig.split('\n')
tOrigLines = tOrigLines.map(x => x.split('\t')).flat().flat().filter(x => x)
tOrigLines__ = tOrigLines.map(x => x.replace(/(l|n)ü/g, '$1u:').replace(/ü/g, 'u'))
// html = output_.filter(x => x.hsk > 0 || (x.ru && (x.english || '').length > 0 && x.gRank_Word < 15000))
html = output_.filter(x => x.hsk > 0)
html = R.sortBy(x => {
  const xx = x.pinyinNumbers.toLowerCase().split(' ').map(pinyinAndNumber => {
    let pinyin = pinyinAndNumber.replace(/\d+/g, '')
    const number = pinyinAndNumber.replace(/\D+/g, '')

    if (pinyin === 'r') { pinyin = 'er' }

    const pinyinIndex = tOrigLines__.indexOf(pinyin)
    if (pinyinIndex === -1) { throw new Error(pinyin) }
    return [pinyinIndex, number]
  })
  return xx
}, html)

html = html.map(x => {
  ms = R.zip(x.pinyinMarks.split(' '), x.toneMarks).map(([x, t]) => String.raw`<span class="tone${t}">${x}</span>`).join(' ')

  ms = [
    ms,
    link(x.Simplified, 'simp'),
    x.Traditional == x.Simplified ? null : link(x.Traditional, 'trad'),
  ].filter(R.identity).join('<br>')

  return [
    [`hsk`, x.hsk > 0 ? x.hsk : ''],
    [`sim`, colorizes(x.Simplified)],
    // [`sim ${x.hsk > 0 ? `hsk-${x.hsk}` : ""}`, x.Simplified],
    ["trad", x.Traditional == x.Simplified ? '' : colorizes(x.Traditional)],
    ["marks", ms],
    ["en", colorizes(x.english.join(`<br>`))],
    ["ru", colorizes(x.ru.replace(/\[m\d\]/g, '').split('[/m]').map(R.trim).filter(R.identity).filter(x => !x.startsWith('[ex]') && !x.startsWith('[*]')).map(fixTransl).join('<br>').replace(/[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/gu, ''))],
  ].map(([kl, x]) => String.raw`<td class="${kl}">${x}</td>`)
})

html_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Hua ma</title>
  <link rel="stylesheet" href="main.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300&display=swap" rel="stylesheet">
  <style>
  .hsk-1, .hsk-2, .hsk-3, .hsk-4, .hsk-5, .hsk-6 { background-color: red; }
  .mytable tr > *:nth-child(1) { width: 1%; white-space: nowrap; }
  .mytable tr > *:nth-child(2) { width: 1%; white-space: nowrap; font-size: 27px; font-family: 'Noto Sans SC', sans-serif; }
  .mytable tr > *:nth-child(3) { width: 1%; white-space: nowrap; font-size: 27px; font-family: 'Noto Sans SC', sans-serif; }
  .mytable tr > *:nth-child(4) { width: 1%; white-space: nowrap; }

  table { page-break-inside:auto }
  tr    { page-break-inside:avoid; page-break-after:auto }
  thead { display:table-header-group }
  tfoot { display:table-footer-group }

  .marks a { color: black; }
  .tone1 { color: #0000ff; }
  .tone2 { color: green; }
  .tone3 { color: #ff00ff; }
  .tone4 { color: #ff0000; }
  .reference { display: none; }

  .nightMode .marks a { color: white; }
  .nightMode .tone1 { color: #a3a3ff; }
  .nightMode .tone2 { color: lightgreen; }
  .nightMode .tone3 { color: #ff00ff; }
  .nightMode .tone4 { color: #ff7b7b; }
  </style>
  <script src="dict-myscripts.js"></script>
 </head>
 <body class="nonightMode">
  <table border="1" class="mytable">
   ${html.map(x => String.raw`<tr>${x.join('')}</tr>`).join('\n')}
  </table>
</div>
</div>
 </body>
</html>
`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/dict-hsk.html', html_)

