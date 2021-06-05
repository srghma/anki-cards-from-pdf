const readStreamArray = require('./lib/readStreamArray').readStreamArray
const removeHTML = require('./lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./lib/isHanzi').isHanzi
const mkQueue = require('./lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const nodeWith = require('./lib/nodeWith').nodeWith
const toNumberOrNull = str => { if (!str) { return null }; var num = parseFloat(str); if (isFinite(num)) { return num; } else { return null; }; }
const checkSameLength = (x, y) => { if (x.length != y.length) { throw new Error(`x.length (${x.length}) != y.length (${y.length})`) } }
const zipOrThrowIfNotSameLength = (x, y) => { checkSameLength(x, y); return R.zip(x, y); }

// dictionary = await require('harlaw').toArray('/home/srghma/Downloads/dabkrs_v86_5/5parts/大БКРС_v86_1.dsl')

// d = '/home/srghma/Downloads/dabkrs_v86_5/大БКРС_v86.dsl'
// d = '/home/srghma/Downloads/dabkrs_v86_5/5parts/大БКРС_v86_1.dsl'

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

// bruks_v86__orig = fs.readFileSync('/home/srghma/Downloads/bruks_v86/bruks_v86.dsl', 'utf-16le').toString().split('\n')
dabkrs_210426__orig = fs.readFileSync('/home/srghma/Downloads/dabkrs_210426').toString().split('\n')
bkrs_v86__orig = fs.readFileSync('/home/srghma/Downloads/dabkrs_v86_1/大БКРС_v86.dsl', 'utf-16le').toString().split('\n')

// dabkrs_210426__orig.length
// bkrs_v86__orig.length

// comments(dabkrs_210426__orig)
// comments(bkrs_v86__orig)

dabkrs_210426_split = splitDictOnEntries(withoutComments(dabkrs_210426__orig.map(R.trim))).filter(R.identity)
// bkrs_v86 = splitDictOnEntries(withoutComments(bkrs_v86__orig.map(R.trim))).filter(R.identity)

// R.uniq(dabkrs_210426.map(x => x.length))
// R.uniq(bkrs_v86.map(x => x.length))

// dabkrs_210426.filter(x => x.length === 2)
// bkrs_v86.filter(x => x.length === 2)

toRecords = xs => xs.map(x => {
  const l = x.length
  if (l == 2) { return { ch: x[0], pinyin: null, ru: x[1] } }
  else if (l == 3) { return { ch: x[0], pinyin: x[1], ru: x[2] } }
  else { console.log(x); throw new Error(l); }
})

dabkrs_210426 = toRecords(dabkrs_210426_split.filter(x => x[0].length === 1))
// bkrs_v86 = toRecords(bkrs_v86.filter(x => x[0].length === 1))

// ch1 = dabkrs_210426.map(R.prop('ch'))
// ch2 = bkrs_v86.map(R.prop('ch'))

// dict = R.mapObjIndexed(R.uniq, R.mergeWith(R.concat, R.groupBy(R.prop('ch'), dabkrs_210426), R.groupBy(R.prop('ch'), bkrs_v86)))
/////
// dabkrs_210426_ = R.groupBy(R.prop('ch'), dabkrs_210426)
// dabkrs_210426_ = R.mapObjIndexed(x => { if (x.length !== 1) { throw new Error(x) } else { return x[0] }  }, dabkrs_210426_)

// R.toPairs(dabkrs_210426).filter(x => x[1].length !== 1)

// pairs_1 = dabkrs_210426.filter(x => !'αδγ'.includes(x.ch)).filter(x => !x.pinyin)
// pairs = pairs_1.filter(x => !x.ru.startsWith('[m1][p]яп.')).map(x => ({ ch: x.ch, ru: x.ru.replace(/\[[^\]]+\]/g, '') })).filter(x => (x.ru.startsWith('см.') || x.ru.startsWith('вм. ') || x.ru.startsWith('сокр. ') || x.ru.startsWith('variant of'))).map(x => ({ ch: x.ch, ru: x.ru.replace('см.', '').replace('вм. ', '').replace('сокр. ', '').replace('variant of', '').replace('\\', '').trim()[0] })).filter(x => !'〻⺍'.includes(x.ch)).map(x => x.ch + x.ru).join('\n')

pairs = "狥徇 譌讹 髩鬓 騗骗 霛灵 歗啸 竢俟 銕铁 倸睬 倐倏 捄救 穅糠 裠裙 獧狷 趂趁 岅阪 蘐萱 蕿萱 萲萱 幑徽 廼乃 娬妩 崐昆 灧灩 芲花 宼寇 覻觑 覰觑 鞉鼗 飃飘 甎砖 亁乾 垻坝 凟渎 賔宾 珎珍 緐繁 聼听 悳德 藼萱 㑂仿 㑅作 㓛功 㕛友 㘳丘 㚸媤 㠪五 㫫显 㯽槟 㶜渊 㻄宝 䥖钿 䳉鸩 蘿萝 㒯烨 猠山 曢瞭 ⿔龟 卛率 囶国 壡睿 綘缝 觽觿 邎遥 伨徇 㴠涵 叏夬 嚰麽 﨑崎 溂剌 㗐嗑 鏍镙 ⽪皮 㑡卿 㓇沃 㒬尪 㖬嗖 㚑灵 㛋奶 㙖瑀 㙿蚁 霴叇 囕咥 㺯弄 鶑莺 鷪莺 ⽕火 綗絅 閗斗 軅軈 㶪炋 鿠鿟 幉褋 覍弁".split(' ')

pairs = R.fromPairs(pairs.map(x => [[x[0], x[1]], [x[1], x[0]]]).flat())

// ;(function(input){
//   let header = R.uniq(R.map(R.keys, input).flat())
//   console.log({ header })
//   header = header.map(x => ({ id: x, title: x }))
//   const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
//   fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
// })(input.map(x => ({ kanji: x.kanji, asdf: R.uniq((x._17 + (pairs[x.kanji] || '')).split('')).join('') })).filter(x => x.asdf));

// { ch: '覰', pinyin: null, ru: '[m1][c][i]вм.[/c] [/i]觑[/m]' },
// { ch: '鞉', pinyin: null, ru: '[m1][p]вм.[/p] 鼗[/m]' },
// '[m1][p]вм.[/p] ()[/m]'

output = dabkrs_210426.filter(x => !'αδγ'.includes(x.ch))
output = output.map(x => {
  let pinyin = x.pinyin
  if (!pinyin) {
    const pairKanji = pairs[x.ch]
    if (pairKanji) {
      const pair = output.find(x => x.ch === pairKanji)
      if (pair) {
        pinyin = pair.pinyin
      }
    }
  }
  if (pinyin) {
    pinyin = pinyin.trim().split(' ').map(x => x.replace(',', '').replace(';', '')).filter(R.identity)
  }
  let ru = x.ru
  ru = ru.replace(/\[m\d\]/g, '').split('[/m]').map(R.trim).filter(R.identity).map(fixTransl)
  return {
    ch: x.ch,
    pinyin,
    ru,
    // ruOrig: x.ru,
  }
})

output = output.map(x => {
  let pinyin = x.pinyin || []
  if (pinyin.length === 0) {
    const ru = x.ru.filter(x => x.startsWith('[c green]')).map(x => x.replace('[c green]', '').trim()).filter(R.identity)
    if (ru.length > 0) { pinyin = ru }
  }
  return {
    ch: x.ch,
    pinyin,
    ru: x.ru.map(x => {
      // if (x.startsWith('[c green]')) {
      //   return `<span class="green">` + x.replace('[c green]') + `</span>`
      // }
      // if (x.startsWith('[c red]')) {
      //   return `<span class="red">` + x.replace('[c red]') + `</span>`
      // }
      // if (x.startsWith('[c brown]')) {
      //   return `<span class="red">` + x.replace('[c red]') + `</span>`
      // }
      return x.replace(/\[c (\w+)\]/g, '').replace(/\\\[/g, '').replace(/\\\]/g, '')
    }),
  }
})

output = output.map(x => ({ ch: x.ch, pinyin: x.pinyin.join(', '), ru: x.ru.map(x => `<div>${x}</div>`).join('') }))
// output.filter(x => x.pinyin.length <= 0)

// output = R.groupBy(R.prop('ch'), output)
// R.values(output).filter(x => x.length !== 1)
// output = R.omit('α δ γ'.split(' '), output)

// await require('harlaw').toJson(d, `/home/srghma/Downloads/dabkrs_v86_5/output.json`, require('harlaw').noMarkupSettings)

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output);
