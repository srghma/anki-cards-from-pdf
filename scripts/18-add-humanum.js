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
const humanum = require('./scripts/lib/humanum').humanum
const mkQueue = require('./scripts/lib/mkQueue').mkQueue

humanumcache = JSON.parse("[" + fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/humanumcache.json').toString().replace(/}{/g, "},{") + "]")

already_existing_kanji = R.uniq(humanumcache.map(x => x.kanji))

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))
stripHtml = x => require('string-strip-html').stripHtml(x).result.replace(/^\s+/, '').replace(/\n\n+/g, '\n\n').replace(/\n/g, '<br>')
input = input.map(x => ({
  kanji:                        x.kanji,
  humanum_full_description_en:  stripHtml(x._82),
  humanum_short_description_en: stripHtml(x._83),
  humanum_full_description:     stripHtml(x._84),
  humanum_short_description:    stripHtml(x._85),
  // humanum_img_url:              x._86,
})).filter(x => x.humanum_full_description || x.humanum_short_description)
;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input);

input = input.filter(x => !x.humanum_full_description_en)
input = input.filter(x => !x.humanum_full_description)
input = input.filter(x => !x.humanum_short_description)
input = input.filter(x => !already_existing_kanji.includes(x.kanji))

// > input.length
// 23804


// await mymapper(input[0])

queueSize = 15
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })

promises = input.map((x, inputIndex) => async jobIndex => {
  const kanji = x['kanji']
  console.log({ m: "doing", jobIndex, inputIndex, kanji })
  const dom = doms[jobIndex]
  if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }
  if (!dom) { throw new Error('dom') }

  let humanum_image_and_explanation = null

  try {
    humanum_image_and_explanation = await humanum(dom, kanji)

    if (humanum_image_and_explanation.res === "not_in_db") {
      fs.appendFileSync('humanumcache-not-in-db.json', JSON.stringify({ kanji, res: "not_in_db" }))
      return
    }

    if (humanum_image_and_explanation.res === "no_explainShapeTable") {
      fs.appendFileSync('humanumcache-not-in-db.json', JSON.stringify({ kanji, origText: humanum_image_and_explanation.origText, res: "no_explainShapeTable" }))
      return
    }

    console.log({ kanji, humanum_image_and_explanation })
  } catch (e) {
    console.error({ kanji, e })
    return
  }

  // let sinopsis_en = null
  // try {
  //   if (sinopsis) {
  //     sinopsis_en = await translate.translate(sinopsis, 'en')
  //     sinopsis_en = sinopsis_en[0]
  //   }
  // } catch (e) {
  //   console.error({ kanji, e })
  // }

  // let explanation_en = null
  // try {
  //   if (explanation) {
  //     explanation_en = await translate.translate(explanation, 'en')
  //     explanation_en = explanation_en[0]
  //   }
  // } catch (e) {
  //   console.error({ kanji, e })
  // }

  fs.appendFileSync('humanumcache.json', JSON.stringify({
    kanji,
    origText:    humanum_image_and_explanation.origText,
    image:       humanum_image_and_explanation.image,
    explanation: humanum_image_and_explanation.explanation,
    sinopsis:    humanum_image_and_explanation.sinopsis,
    // explanation_en,
    // sinopsis_en,
  }))

  console.log({
    inputIndex,
    length:      input.length,
    explanation: humanum_image_and_explanation.explanation,
    sinopsis:    humanum_image_and_explanation.sinopsis,
  })
})
mkQueue(queueSize).addAll(promises)

// humanumcache = humanumcache.filter(x => x.humanum_image_and_explanation)
// humanumcache = R.uniqBy(x => x.kanji, humanumcache)

function removePrefix(str, prefix) {
  const hasPrefix = str.indexOf(prefix) === 0;
  return hasPrefix ? str.substr(prefix.length) : str.toString();
}

output = humanumcache.filter(x => !x.res).map(x => {
  const stripHtml = x => require('string-strip-html').stripHtml(x).result.replace(/^\s+/, '').replace(/\n\n+/g, '\n\n').replace(/\n/g, '<br>')
  return {
    kanji:       x.kanji,
    image:       x.image,
    explanation: stripHtml(removePrefix(x.explanation || '', '<span style="background:#c90;color:#ffffff">&nbsp;Elaboration:</span> ').replace(/<\/?br>$/, '')),
    sinopsis:    stripHtml(removePrefix(x.sinopsis,          '<span style="background:#c90;color:#fff">&nbsp; Synopsis&nbsp;&nbsp;:</span> ').replace(/<\/?br>$/, '')),
    // explanation_en: removePrefix(x.explanation_en, '<span style="background:#c90;color:#ffffff">Elaboration:</span> ').replace(/<\/?br>$/, ''),
    // sinopsis_en:    removePrefix(x.sinopsis_en,    '<span style="background:#c90;color:#fff">Synopsis:</span> ').replace(/<\/?br>$/, ''),
  }
})

// tr = R.concat(output.map(x => ({ text: x.explanation, type: "explanation", kanji: x.kanji })).filter(R.prop('text')), output.map(x => ({ text: x.sinopsis, type: "sinopsis", kanji: x.kanji })).filter(R.prop('text')))

output_ = []
promises = output.map((x, inputIndex) => async jobIndex => {
  try {
    const kanji = x['kanji']
    console.log({ m: "doing", jobIndex, inputIndex, kanji })
    if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }

    let explanation_en = null
    if (x.explanation.trim()) {
      explanation_en = await require('./scripts/lib/google_translate_with_cache').google_translate_with_cache(x.explanation, { to: 'ru' })
      console.log({ explanation: x.explanation, explanation_en })
    }

    let sinopsis_en = null
    if (x.sinopsis.trim()) {
      sinopsis_en = await require('./scripts/lib/google_translate_with_cache').google_translate_with_cache(x.sinopsis, { to: 'ru' })
      console.log({ sinopsis: x.sinopsis, sinopsis_en })
    }

    output_.push({
      ...x,
      explanation_en,
      sinopsis_en,
    })
  } catch (e) {
    console.error(e)
    require('./scripts/lib/google_translate_with_cache').google_translate_sync()
  }
})
mkQueue(10).addAll(promises)
output.length
output_.length

require('./scripts/lib/google_translate_with_cache').google_translate_sync()

// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/tr-temp1.txt', tr1)
// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/tr-temp2.txt', tr2)

// tr1.length
// tr2.length
// output.length

// x = R.zipWith((x, y) => ({ explanation_ru: x, sinopsis_ru: y }), tr1, tr2)
// x = R.zipWith((x, y) => ({ ...x, ...y }), x, output)

// output_ = R.zipWith((x, y) => ({ explanation_ru: x, sinopsis_ru: y }), tr[0], tr[1])

// tr.length
// output[0]
// tr[0]
// output[output.length - 2]
// tr[tr.length - 2]

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
