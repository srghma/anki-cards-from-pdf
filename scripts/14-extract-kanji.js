const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);

// input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

content = fixRadicalToKanji(fs.readFileSync('/home/srghma/Downloads/In-Search-of-Hua-Ma-by-John-Pasden_-Jared-Turner-_z-lib.org__1.txt').toString())

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

content = content.split('----------------------------------')

content = R.zipObj(ch, content)

content = R.map(x => x.replace(/(。|？|！)\s*”/g, "$1”\n"), content)
content = R.map(x => x.replace(/(。|？|！)\s*[^”]/g, "$1\n"), content)
content = R.map(x => x.split('\n').map(x => x.replace(/\s+/g, ' ').trim()), content)
content = Object.entries(content).map(([key, val]) => val.map(v => ({ sentence: v, chapter: key }))).flat()
content = content.filter(x => x.sentence.length > 1)

const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

async function mymapper(x) {
  const sentence = x.sentence
  if (!RA.isNonEmptyString(sentence)) { throw new Error('sentence') }
  const chapter = x.chapter
  if (!RA.isNonEmptyString(chapter)) { throw new Error('chapter') }

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
    chapter,
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
  const ruby = require('./scripts/lib/processPurpleculture').processPurpleculture(x.purpleculternumbered)
  return {
    ru_marked:   rubyToDifferentPinyin(dom, 'ru', 'marked', ruby),
    ru_numbered: rubyToDifferentPinyin(dom, 'ru', 'numbered', ruby),
    en_marked:   rubyToDifferentPinyin(dom, 'en', 'marked', ruby),
    en_numbered: rubyToDifferentPinyin(dom, 'en', 'numbered', ruby),
    en_cased:    rubyToDifferentPinyin(dom, 'en', 'cased', ruby),
    hanzi:       x.sentence.replace(/\s+/g, ' ').trim(),
    ruby,
    english:     x.translation[0],
    chapter:     x.chapter.replace(/\s+/g, ' ').trim(),
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
