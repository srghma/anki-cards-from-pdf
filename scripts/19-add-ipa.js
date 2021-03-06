const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const easypronunciation_chinese = require('./scripts/lib/easypronunciation_chinese').easypronunciation_chinese
const processPurpleculture = require('./scripts/lib/processPurpleculture').processPurpleculture

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Pimsleur.txt').pipe(csv({ separator: "\t", headers: [ "sentence" ] })))

words = R.uniq(output.map(x => {
  const raw = x['purpleculternumbered']
  if (!RA.isNonEmptyString(raw)) { console.error(x); throw new Error('raw') }
  return raw.match(/class="tooltips">([^<]+)<\/div>/g).map(str => str.split('').filter(isHanzi).join('')).filter(R.identity)
}).flat())

ipwordscache_path = '/home/srghma/projects/anki-cards-from-pdf/ipacache.json'
ipwordscache = {}
try {
  ipwordscache = JSON.parse(fs.readFileSync(ipwordscache_path).toString())
} catch (e) {
  console.log(e)
}

unknownwords = words.filter(w => !ipwordscache[w])
console.log(unknownwords.join('\n'))

async function mymapper(word) {
  if (!RA.isNonEmptyString(word)) { console.error(word); throw new Error('word') }

  if (ipwordscache[word]) { console.error('FOUND ' + word); return ipwordscache[word] }

  let easypronunciation_chinese_res = null

  try {
    easypronunciation_chinese_res = await easypronunciation_chinese(dom, word)
    console.log({ word, easypronunciation_chinese_res })
  } catch (e) {
    console.error({ word, e })
    return
  }

  if (easypronunciation_chinese_res.length > 0) { ipwordscache[word] = easypronunciation_chinese_res }

  fs.writeFileSync(ipwordscache_path, JSON.stringify(ipwordscache, null, 2))
}

;(async function(input){
  for (let i = 0; i < input.length; i++) {
    await mymapper(input[i])
  };
})(words);

output_ = input.map(x => {
  const raw = x['_8']
  if (!RA.isNonEmptyString(raw)) { console.error(x); throw new Error('raw') }
  return {
    sentence:                      x.sentence,
    easypronunciation_chinese_res: processPurpleculture(ipwordscache, raw),
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
