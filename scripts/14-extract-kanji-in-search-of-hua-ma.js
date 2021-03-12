const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
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

// input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

content = fixRadicalToKanji(fs.readFileSync('/home/srghma/Desktop/languages/chinese/In Search of Hua Ma by John Pasden, Jared Turner (z-lib.org).txt').toString())

ch = [
  "去⼭上找花",
  "看⻅了⼀个⽼太太",
  "到海南了？",
  "找花⻢",
  "头上有花的⻢",
  "⽼⼈",
  "⽼⼈知道了",
  "真的花⻢",
  "回⼭西",
  "妈妈很开⼼",
].map(fixRadicalToKanji)

// content = content.split('----------------------------------')

// content = R.zipObj(ch, content)

content = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
content = content.replace(/(。|？|！)\s*”/g, "$1”\n")
content = content.replace(/(。|？|！)\s*([^”])/g, "$1\n$2")
content = content.split('\n').map(x => x.replace(/\s+/g, ' ').trim())
content = content.filter(x => x.length > 1)

async function mymapper(x) {
  const sentence = x
  if (!RA.isNonEmptyString(sentence)) { throw new Error('sentence') }

  let translation = null
  try {
    translation = await translate.translate(sentence, 'en')
    console.log({ sentence, translation })
  } catch (e) {
    console.error(e)
    return
  }

  let purpleculternumbered = null
  try {
    purpleculternumbered = await require('./scripts/lib/purpleculter_get').purpleculter_get(dom, sentence)
    console.log({ sentence, purpleculternumbered })
  } catch (e) {
    console.error(e)
    return
  }

  return {
    sentence,
    purpleculternumbered,
    translation,
  }
}

output = []

;(async function(input){
  for (let i = 0; i < input.length; i++) {
    const res = await mymapper(input[i])
    fs.appendFileSync('huamapinyincache.json', JSON.stringify(res))
    output.push(res)
    console.log({ i, l: input.length })
  };
})(ch.map((x, index) => ({ sentence: x, chapter: 'chapter ' + (index + 1) })));

;(async function(input){
  for (let i = 0; i < input.length; i++) {
    const res = await mymapper(input[i])
    fs.appendFileSync('huamapinyincache.json', JSON.stringify(res))
    output.push(res)
    console.log({ i, l: input.length })
  };
})(content);

output_ = output.map(x => {
  const ruby = require('./scripts/lib/processPurpleculture').processPurpleculture(ipwordscache, x.purpleculternumbered)
  return {
    // sentence_without_html
    hanzi:       x.sentence.replace(/\s+/g, ' ').trim(),
    ruby,
    ru_marked:   rubyToDifferentPinyin(dom, 'ru', 'marked', ruby),
    ru_numbered: rubyToDifferentPinyin(dom, 'ru', 'numbered', ruby),
    en_marked:   rubyToDifferentPinyin(dom, 'en', 'marked', ruby),
    en_numbered: rubyToDifferentPinyin(dom, 'en', 'numbered', ruby),
    // en_cased:    rubyToDifferentPinyin(dom, 'en', 'cased', ruby),
    purpleculternumbered: x.purpleculternumbered,
    english:     x.translation[0],
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
