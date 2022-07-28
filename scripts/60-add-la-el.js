const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const removeHTML = require('./scripts/lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./scripts/lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./scripts/lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);

var tokenizer = require( 'wink-tokenizer' );
var myTokenizer = tokenizer();

inputOrig = await readStreamArray(fs.createReadStream('./my spanish verbs 1000 (sentences).txt').pipe(csv({ separator: "\t", headers: "id es".split(' ') })))
spanishdal = await readStreamArray(fs.createReadStream('./node_modules/spanishdal/data/sdal.csv').pipe(csv({ separator: ";", headers: "word".split(' ') })))
// spanishdal = require('spanishdal/data/sdal.json')
spanishdal = spanishdal.map(x => x.word.split('_')).map(([word, type]) => ({ word, type })).filter(x => x.type === "N").map(x => x.word)

// rosaenlg_gender_es = require('rosaenlg-gender-es')
spanish_words = require('spanish-words')

// type of speach tokenizer
spanishdal = spanishdal.map(word => ({ word, ...spanish_words.getWordInfo(word) }))
spanishdal = spanishdal.map(({ word, gender, plural }) => [{ word, gender, plural: false }, { word: plural, gender, plural: true }]).flat()
spanishdal = R.fromPairs(spanishdal.map(({ word, gender, plural }) => [word, { gender, plural }]))

// spanishdal.filter(x => x.gender !== "M" && x.gender !== "F")

input = inputOrig.map(({ id, es }) => ({ id, es: myTokenizer.tokenize(es) }))

input = input.map(({ id, es }) => ({ id, es: es.map(({ value, tag }) => {
  const v = spanishdal[spanishdal.toLowerCase()]
  if (v) {
    let x = null

    if (v.plural === false) {
      if (v.gender === 'F') {
        x = 'la'
      } else if (v.gender === 'M') {
        x = 'el'
      } else if (v.gender === 'N') {
        x = 'la/el'
      } else {
        throw new Error('')
      }
    } else {
      if (v.gender === 'F') {
        x = 'las'
      } else if (v.gender === 'M') {
        x = 'los'
      } else if (v.gender === 'N') {
        x = 'las/los'
      } else {
        throw new Error('')
      }
    }

    return { value: `${x} ${value}`, tag }
  }
  return { value, tag }
}) }))

input = input.map(({ id, es }) => ({
  id,
  es: es.reduce(
    (previousValue, { value, tag }) => {
      if (tag === 'punctuation') {
        return previousValue + value
      } else {
        return `${previousValue} ${value}`
      }
    },
    ''
  )
}))

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('./my spanish verbs 1000 (sentences).txt', s)
})(input);
