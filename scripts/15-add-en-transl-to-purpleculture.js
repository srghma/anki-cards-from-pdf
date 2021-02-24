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
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

async function mymapper(x) {
  const kanji = x['kanji']
  if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }

  const sentence = x['_48']

  if (sentence == '') { return }

  if (!RA.isNonEmptyString(sentence)) { throw new Error('sentence') }

  let translation = null
  try {
    translation = await translate.translate(sentence, 'ru')
    console.log({ sentence, translation })
  } catch (e) {
    console.error(e)
    return
  }

  return {
    kanji,
    translation,
  }
}

output = []

;(async function(input){
  for (let i = 0; i < input.length; i++) {
    const res = await mymapper(input[i])

    if (res) {
      fs.appendFileSync('purplecache.json', JSON.stringify(res))
      output.push(res)
      console.log({ i, l: input.length })
    }
  };
})(input);

output_ = output.filter(R.identity).map(x => {
  return {
    kanji:       x.kanji,
    translation: x.translation[0],
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
