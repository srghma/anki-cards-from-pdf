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
const processPurpleculture = require('./scripts/lib/processPurpleculture').processPurpleculture

// input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/00 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

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
  if (!RA.isNonEmptyString(sentence)) { console.error(x); throw new Error('sentence') }
  dom.window.document.body.innerHTML = sentence
  const sentence_without_html = dom.window.document.body.textContent.trim().replace(/ /g, '')

  if (!RA.isNonEmptyString(sentence_without_html)) {
    console.error(x);
    return
  }

  // if (!RA.isNonEmptyString(sentence_without_html)) { console.error(x); throw new Error('sentence_without_html') }

  const lesson = x.lesson
  if (!RA.isNonEmptyString(lesson)) { console.error(x); throw new Error('lesson') }
  const speaker = x.speaker
  if (!RA.isNonEmptyString(speaker)) { console.error(x); throw new Error('speaker') }

  let translation = null
  try {
    translation = await translate.translate(sentence_without_html, 'en')
    // console.log({ sentence_without_html, translation })
  } catch (e) {
    console.error({ sentence, e })
    return
  }

  let purpleculture_raw = null
  try {
    purpleculture_raw = await require('./scripts/lib/purpleculter_get').purpleculter_get(dom, sentence_without_html)
    // console.log({ sentence_without_html, purpleculture_raw })
  } catch (e) {
    console.error({ sentence, e })
    return
  }

  return {
    sentence,
    sentence_without_html,
    lesson,
    speaker,
    purpleculture_raw,
    translation,
  }
}

// output = []
// ;(async function(input){
//   for (let i = 0; i < input.length; i++) {
//     const res = await mymapper(input[i])
//     if (res) {
//       fs.appendFileSync('huamapinyincache.json', JSON.stringify(res))
//       output.push(res)
//       console.log({ i, l: input.length })
//     }
//   };
// })(content);

// output = JSON.parse("[" + fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/huamapinyincache.json').toString().replace(/}{/g, "},{") + "]")
// output = output.filter(x => x.sentence)
// output = output.filter(x => x.purpleculture_raw)
// output = R.uniqBy(x => x.sentence, output)

ipwordscache_path = '/home/srghma/projects/anki-cards-from-pdf/ipacache.json'
ipwordscache = JSON.parse(fs.readFileSync(ipwordscache_path))

words = R.uniq(input.map(x => {
  const raw = x._6
  if (!RA.isNonEmptyString(raw)) { console.error(x); throw new Error('raw') }
  return raw.match(/class="tooltips">([^<]+)<\/div>/g).map(str => str.split('').filter(isHanzi).join('')).filter(R.identity)
}).flat())
unknownwords = words.filter(w => !ipwordscache[w])
console.log(unknownwords.join('\n'))

output_ = input.map(x => {
  const ruby = processPurpleculture(ipwordscache, x._6)
  return {
    // sentence
    // sentence_without_html
    // hanzi:       x.sentence.replace(/\s+/g, ' ').trim(),
    ru_marked:   rubyToDifferentPinyin(dom, 'ru', 'marked', ruby),
    ru_numbered: rubyToDifferentPinyin(dom, 'ru', 'numbered', ruby),
    en_marked:   rubyToDifferentPinyin(dom, 'en', 'marked', ruby),
    en_numbered: rubyToDifferentPinyin(dom, 'en', 'numbered', ruby),
    // en_cased:    rubyToDifferentPinyin(dom, 'en', 'cased', ruby),
    ruby,
    purpleculture_raw: x.purpleculture_raw,
    // english:     x.translation[0],
    // lesson:      x.lesson.replace(/\s+/g, ' ').trim() + ' (' + x.speaker + ')',
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
