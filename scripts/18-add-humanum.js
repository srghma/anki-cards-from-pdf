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

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

async function mymapper(x) {
  const kanji = x.kanji
  if (!RA.isNonEmptyString(kanji)) { console.error(x); throw new Error('kanji') }

  let humanum_image_and_explanation = null
  let image = null
  let sinopsis = null
  let explanation = null

  try {
    humanum_image_and_explanation = await humanum(dom, kanji)
    console.log({ kanji, humanum_image_and_explanation })

    image       = humanum_image_and_explanation.image
    sinopsis    = humanum_image_and_explanation.sinopsis
    explanation = humanum_image_and_explanation.explanation
  } catch (e) {
    console.error({ kanji, e })
    return
  }

  image       = image && ("http://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/" + image)
  sinopsis    = sinopsis && sinopsis.replace(/href="search\.php\?word/g, 'href="http://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=').trim()
  explanation = explanation && explanation.replace(/href="search\.php\?word/g, 'href="http://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=').trim()

  let sinopsis_en = null
  try {
    if (sinopsis) {
      sinopsis_en = await translate.translate(sinopsis, 'en')
      sinopsis_en = sinopsis_en[0]
    }
  } catch (e) {
    console.error({ kanji, e })
  }

  let explanation_en = null
  try {
    if (explanation) {
      explanation_en = await translate.translate(explanation, 'en')
      explanation_en = explanation_en[0]
    }
  } catch (e) {
    console.error({ kanji, e })
  }

  return {
    kanji,
    image,
    explanation,
    sinopsis,
    explanation_en,
    sinopsis_en,
  }
}

// await mymapper(input[0])

output = []
;(async function(input){
  for (let i = 0; i < input.length; i++) {
    const res = await mymapper(input[i])
    if (res) {
      fs.appendFileSync('humanumcache.json', JSON.stringify(res))
      output.push(res)
      console.log({ i, l: input.length })
    }
  };
})(input);

// output = JSON.parse("[" + fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/humanumcache.json').toString().replace(/}{/g, "},{") + "]")
// output = output.filter(x => x.kanji)
// output = output.filter(x => x.humanum_image_and_explanation)
// output = R.uniqBy(x => x.kanji, output)

function removePrefix(str, prefix) {
  const hasPrefix = str.indexOf(prefix) === 0;
  return hasPrefix ? str.substr(prefix.length) : str.toString();
}

output_ = output.map(x => {
  return {
    kanji:          x.kanji,
    image:          x.image,
    explanation:    removePrefix(x.explanation,    '<span style="background:#c90;color:#ffffff">&nbsp;Elaboration:</span> ').replace(/<\/?br>$/, ''),
    sinopsis:       removePrefix(x.sinopsis,       '<span style="background:#c90;color:#fff">&nbsp; Synopsis&nbsp;&nbsp;:</span> ').replace(/<\/?br>$/, ''),
    explanation_en: removePrefix(x.explanation_en, '<span style="background:#c90;color:#ffffff">Elaboration:</span> ').replace(/<\/?br>$/, ''),
    sinopsis_en:    removePrefix(x.sinopsis_en,    '<span style="background:#c90;color:#fff">Synopsis:</span> ').replace(/<\/?br>$/, ''),
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
