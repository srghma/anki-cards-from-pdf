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

// input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

content = fixRadicalToKanji(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/scripts/16-pimsleur.txt').toString())
content = content.split('Lesson').map(x => x.split('\n').map(x => x.trim()).filter(x => x != ''))

content = content.map(x => {
  const h = x.shift()
  return { lesson: h, content: x }
})

content = content.map(x => x.content.map(v => {
  let speaker = null

  if (v[0] == '-') {
    v = v.replace(/^- /, '')
    speaker = "B"
  } else {
    speaker = "A"
  }

  return { sentence: v, lesson: x.lesson, speaker }
})).flat()

async function mymapper(x) {
  const sentence = x.sentence
  if (!RA.isNonEmptyString(sentence)) { throw new Error('sentence') }
  const lesson = x.lesson
  if (!RA.isNonEmptyString(lesson)) { throw new Error('lesson') }
  const speaker = x.speaker
  if (!RA.isNonEmptyString(speaker)) { throw new Error('speaker') }

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
    lesson,
    speaker,
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
    lesson:      x.lesson.replace(/\s+/g, ' ').trim() + ' (' + x.speaker + ')',
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
