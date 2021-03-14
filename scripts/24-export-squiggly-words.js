keywords = `报纸      - n. newspaper
处理      - v. to handle, to deal with
案子      - n. (criminal or legal) case
跟...一样 - phrase the same as...
有意思    - adj. interesting
头发      - n. hair
从来没有  - phrase to have never (done something)
一定      - adv. surely, certainly
卷发      - n. curly hair
好像      - v. to seem that
相信      - v. to believe
奇怪      - adj. strange
跟...有关 - phrase about..., related to...
认真      - adj. earnest, serious
茶馆      - n. teahouse
老板      - n. boss
饭店      - n. restaurant
味道      - n. scent, flavor
伤口      - n. wound, cut
刀        - n. knife
应该      - aux. should, ought to
总是      - adv. always
聪明      - adj. smart
广告      - n. advertisement
需要      - v. to need
助理      - n. assistant
百        - num. hundred
面试      - v. to interview
记        - v. to make a note, to write down
刚才      - tn. just now
生意      - n. business
为了      - prep. in order to, for the purpose of
拍照      - vo. to take a photo
照片      - n. photograph
地下室    - n. basement, underground room
洗照片    - zhàopiàn vo. to develop photographs
不错      - adj. pretty good, not bad
希望      - v. to wish, to hope
开始      - v. to start
不一定    - adv. not necessarily
后来      - tn. afterwards
同意      - v. to agree (with)
试        - v. to try
难过      - adj. sad, upset
桌子      - n. table, desk
椅子      - n. chair
找到      - vc. to find
漂亮      - adj. pretty
一点也    - phrase (not) at all
上班      - vo. to go to work
放心      - vo. to relax, to rest assured
平常      - adv.; adj. ordinarily; ordinary
再说      - conj. and besides
一直      - adv. all along, continuously
越来越... -  adv. more and more...
想法      - n. idea, way of thinking
发现      - v. to discover
生气      - adj.; v. angry; to get angry
没用      - adj. useless
机会      - n. opportunity
大叫      - v. to yell, to loudly cry out
好笑      - adj. funny
笑        - v. to laugh at (someone)
不好意思  - adj. embarrassed, "I'm sorry, but..."
真相      - n. the true situation
睡觉      - vo. to sleep
外滩      - n. the Bund (in Shanghai)
等        - v. to wait
石头      - n. rock, stone
地面      - n. the ground
敲        - v. to knock
鞋        - n. shoe
书店      - n. book store
银行      - n. bank
记得      - v. to remember
枪        - n. gun
警察      - n. police officer, the police
灯        - n. a light
箱子      - n. box, crate
空的      - adj. empty
小心      - v. to be careful
黄金      - n. gold
抓住      - vc. to catch
开枪      - vo. to fire a gun
紧张      - adj. nervous
灯光      - n. lamplight
打开      - vc. to open
问路      - vo. to ask the way
目的      - n. purpose, motive
地道      - n. tunnel`
keywords = keywords.split('\n').map(x => x.split(' - ').map(x => x.trim()))

const fetch = require('node-fetch')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const easypronunciation_chinese = require('./scripts/lib/easypronunciation_chinese').easypronunciation_chinese
const processPurpleculture = require('./scripts/lib/processPurpleculture').processPurpleculture
const removeHTML = require('./scripts/lib/removeHTML').removeHTML

selectedWords = R.uniq(require('/home/srghma/projects/anki-cards-from-pdf/from-pdf-tmp.json').map(x => fixRadicalToKanji(x.annotation_text).split('').filter(isHanzi).join('')))

translation = await translate.translate(selectedWords.join('\n'), 'en')
translation = translation[0].split('\n').filter(x => x !== '')

if (translation.length !== selectedWords.length) { throw new Error('not equal length') }

sentencesDeck = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: "hanzi english ruby".split(" ") })))

selectedWordsWithTr = R.zip(selectedWords, translation)
selectedWordsWithTr = R.merge(R.fromPairs(selectedWordsWithTr), R.fromPairs(keywords))
selectedWordsWithTr = R.values(R.mapObjIndexed((translation, word) => ({ word, translation, decks: sentencesDeck.filter(x => x.hanzi.includes(word)) }), selectedWordsWithTr))

function printDeckItem(deck) {
  return `<div class="context__deck"><span class="context__decks__hanzi">${deck.hanzi}</span><span class="context__decks__english">${deck.english}</span></div>`
}

// ierogliphs = R.uniq(selectedWords.map(x => x.split('')).flat())
// ierogliphs = ierogliphs.map(i => ({ i, words: selectedWordsWithTr.filter(x => x.word.includes(i)) }))
// ierogliphs = ierogliphs.map(({ i, words }) => {
//   const contextes = words.map((x) => {
//     return `<div class="context"><span class="context__word">${x.word}</span><span class="context__translation">${x.translation}</span><span class="context__decks">\n${x.decks.slice(0, 3).map(printDeckItem).join('\n')}\n</span></div>`
//   })
//   return {
//     i,
//     words: `<div class="contextes">${contextes.join('\n')}</div>`,
//   }
// })

async function mymapper(x) {
  const sentence = removeHTML(dom, x.word)
  let purpleculture_raw = null
  try {
    purpleculture_raw = await require('./scripts/lib/purplecultre_pinyin_converter').purplecultre_pinyin_converter_with_cache(dom, sentence)
    console.log({ sentence, purpleculture_raw })
  } catch (e) {
    console.error({ e, x })
    return
  }

  let trainchinese = null
  try {
    trainchinese = await require('./scripts/lib/trainchinese').trainchinese_with_cache(dom, sentence)
    console.log({ sentence, trainchinese })
  } catch (e) {
    console.error({ e, x })
    return
  }

  let purplecultre_dictionary = null
  try {
    purplecultre_dictionary = await require('./scripts/lib/purplecultre_dictionary').purplecultre_dictionary_with_cache(dom, sentence)
    console.log({ sentence, purplecultre_dictionary })
  } catch (e) {
    console.error({ e, x })
    return
  }

  return {
    ...x,
    purpleculture_raw,
    purplecultre_dictionary,
    trainchinese,
  }
}

output = []
;(async function(input){
  for (let i = 0; i < input.length; i++) {
    const res = await mymapper(input[i])
    if (res) {
      output.push(res)
    }
    console.log({ i, l: input.length })
  };
})(selectedWordsWithTr);

ipwordscache_path = '/home/srghma/projects/anki-cards-from-pdf/ipacache.json'
ipwordscache = JSON.parse(require('fs').readFileSync(ipwordscache_path))
console.log(output.map(x => x.word).filter(x => ipwordscache[x] == null).join('\n'))

kanji = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

output_ = output.map(x => {
  dom.window.document.body.innerHTML = x.purplecultre_dictionary
  let purplecultre_dictionary_en = dom.window.document.querySelector('.en')

  if (purplecultre_dictionary_en) {
    purplecultre_dictionary_en = purplecultre_dictionary_en.textContent.trim()
    purplecultre_dictionary_en = purplecultre_dictionary_en.replace(/Classifiers: \S+/g, '')
    if (purplecultre_dictionary_en.startsWith('old variant of')) { purplecultre_dictionary_en = null }
  }

  // const asdfasdf = x.trainchinese.map(x => x.ch)
  // console.log({
  //   w: x.word,
  //   wl: x.word.length,
  //   // trainchinese: x.trainchinese,
  //   x: asdfasdf,
  //   xl: asdfasdf.map(x => x.length),
  //   y: asdfasdf.filter(y => y.length == x.word.length)
  // })

  let trainchinese = x.trainchinese.filter(x => x).filter(y => y.ch == x.word).map(x => {
    const pinyin = '<span class="trainchinese-pinyin">' + x.pinyin + '</span>'
    const type = '<span class="trainchinese-type">' + x.type + '</span>'
    const transl_____ = '<span class="trainchinese-transl">' + x.transl + '</span>'

    const res = pinyin + ': (' + type + ') ' + transl_____
    return res
  })

  let english = [ x.translation, purplecultre_dictionary_en, ...trainchinese ].filter(R.identity).join('\n<br>\n')

  // custom translation
  if (x.word.length == 1) {
    const kanjiElemWithTr = kanji.find(kanjiElem => kanjiElem.kanji == x.word)
    if (!kanjiElemWithTr) { throw new Error('asdfasdf') }
    english = kanjiElemWithTr._54 + '<br>' + kanjiElemWithTr._55
  }

  const ruby = require('./scripts/lib/processPurpleculture').processPurpleculture(ipwordscache, x.purpleculture_raw)

  return {
    // ...x,
    // sentence_without_html
    // en_cased:    rubyToDifferentPinyin(dom, 'en', 'cased', ruby),
    hanzi:         x.word.replace(/\s+/g, ' ').trim(),
    english,
    article_title: `<span class="context__decks">\n${x.decks.slice(0, 3).map(printDeckItem).join('\n')}\n</span>`.replace(new RegExp(x.word, "g"), `<b>${x.word}</b>`),
    ruby,
    ruby_raw:      x.purpleculture_raw,
    ru_marked:     rubyToDifferentPinyin(dom, 'ru', 'marked', ruby),
    ru_numbered:   rubyToDifferentPinyin(dom, 'ru', 'numbered', ruby),
    en_marked:     rubyToDifferentPinyin(dom, 'en', 'marked', ruby),
    en_numbered:   rubyToDifferentPinyin(dom, 'en', 'numbered', ruby),
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
