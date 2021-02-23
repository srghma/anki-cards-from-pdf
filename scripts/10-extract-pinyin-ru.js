const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const convertToRuTable = require('./scripts/lib/processPurpleculture').convertToRuTable
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: [ "id", "p_e_m", "p_e_n", "p_r_m", "p_r_n", "h", "ruby" ] })))

const dom = new JSDOM(``);

// text = input[0].ruby
// rubyToDifferentPinyin('ru', 'marked', text)
// rubyToDifferentPinyin('ru', 'numbered', text)
// rubyToDifferentPinyin('en', 'marked', text)
// rubyToDifferentPinyin('en', 'numbered', text)
// rubyToDifferentPinyin('en', 'cased', text)

input = input.map(x => {
  return {
    id: x.id,
    ruby: x.ruby,
  }
})

input.forEach(x => {
  x.ru_marked = rubyToDifferentPinyin('ru', 'marked', x.ruby)
  x.ru_numbered = rubyToDifferentPinyin('ru', 'numbered', x.ruby)
  x.en_marked = rubyToDifferentPinyin('en', 'marked', x.ruby)
  x.en_numbered = rubyToDifferentPinyin('en', 'numbered', x.ruby)
  x.en_cased = rubyToDifferentPinyin('en', 'cased', x.ruby)

  delete x.ruby
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input);
