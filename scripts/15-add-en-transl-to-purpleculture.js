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
const Queue = require('promise-queue')

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

async function mymapper(x) {
  const kanji = x['kanji']
  if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }
  let translation = null
  try {
    translation = await require('./scripts/lib/purplecultre_dictionary').purplecultre_dictionary_with_cache(dom, kanji)
    console.log({ kanji, translation })
  } catch (e) {
    console.error({ kanji, e })
    return
  }
  return {
    kanji,
    translation,
  }
}

queue = new Queue(3, Infinity)
output = []
input.forEach((x, index) => {
  queue.add(async function() {
    const res = await mymapper(x)
    if (res) {
      console.log({ index, l: input.length })
      output.push(res)
    }
  })
})

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
