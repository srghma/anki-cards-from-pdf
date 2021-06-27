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
dabkrs_210426__orig = fs.readFileSync('/home/srghma/Downloads/dabkrs_210426').toString().split('\n')
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
})

output_ = output_.map(x => ({ ...x, ...(x.translation), translation: null }))

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

link = (ch, t) => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${t}</a>`

html = output_.filter(x => x.hsk > 0 || (x.ru && (x.english || '').length > 0 && x.gRank_Word < 7000)).map(x => {
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
    ["ru", colorizes(x.ru.replace(/\[m\d\]/g, '').split('[/m]').map(R.trim).filter(R.identity).filter(x => !x.startsWith('[ex]') || !x.startsWith('[*]')).map(fixTransl).join('<br>'))],
  ].map(([kl, x]) => String.raw`<td class="${kl}">${x}</td>`)
})

html_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Hua ma</title>
  <link rel="stylesheet" href="main.css">
  <style>
  .hsk-1, .hsk-2, .hsk-3, .hsk-4, .hsk-5, .hsk-6 { background-color: red; }
  .mytable tr > *:nth-child(1) { width: 1%; white-space: nowrap; }
  .mytable tr > *:nth-child(2) { width: 1%; white-space: nowrap; }
  .mytable tr > *:nth-child(3) { width: 1%; white-space: nowrap; }
  .mytable tr > *:nth-child(4) { width: 1%; white-space: nowrap; }
  .tone1 { color: #a3a3ff; }
  .tone2 { color: lightgreen; }
  .tone3 { color: #ff00ff; }
  .tone4 { color: #ff7b7b; }
  </style>
  <script src="dict-myscripts.js"></script>
 </head>
 <body class="nightMode">
  <table border="1" class="mytable">
   ${html.map(x => String.raw`<tr>${x.join('')}</tr>`).join('\n')}
  </table>
</div>
</div>
 </body>
</html>
`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/dict.html', html_)
