const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
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
allKanji = R.groupBy(R.prop('withoutMark'), R.sortBy(R.prop('withoutMark'), allKanji))

nodeWith = R.curryN(3, (nodeName, props, content) => {
  if (props) {
    if (Array.isArray(props)) {
      props = props.join(' ')
    } else {
      props = R.toPairs(props)

      props = props.map(([k, v]) => {
        if (Array.isArray(v)) { v = v.join(' ') }
        return `${k}="${v}"`
      }).join(' ')
    }

    if (props.length == 0) {
      props = null
    }
  }

  return `<${nodeName}${props ? ' ' + props : ''}>${content}</${nodeName}>`
})

mapper = (v, k) => {
  const ru = require('./scripts/lib/purplecultureSimpleEnToSimpleRu').convertToRuTable[k]

  if (!ru) { throw new Error(k) }

  const print = (v_) => {
    if (v_.length <= 0) { return null }

    const mark = v_[0].marked

    const findHSK = n => v_.filter(x => x.hsk == n)

    const print = ([k, class_, v]) => {
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
    ].map(print).filter(x => x != null)

    const head = nodeWith('span', { class: "marked" }, mark)

    return [head, ...printedValues].join('\n')
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

allKanji_ = R.values(R.mapObjIndexed(mapper, allKanji))

fileContent = `<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Table</title>
  <style>
tr:nth-child(even) {background: #CCC; }
tr:nth-child(odd) {background: #FFF; }
.row-other { display: none; }
  </style>
 </head><body><table>
   <tr>
    ${["", "", "", "1, ˉ", "2, ˊ", "3, ˇ", "4, ˋ", "5, ."].map(nodeWith('th', null)).join('\n')}
   </tr>
   ${allKanji_.map(R.map(x => x ? nodeWith('td', null, x) : '')).map(nodeWith('tr', null)).join('\n')}
  </table>
 </body>
</html>`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/table.html', fileContent)
