const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const isHanzi = require('./scripts/lib/isHanzi').isHanzi

content = fs.readFileSync('/home/srghma/Downloads/The-Origin-of-Chinese-Characters-An-Illustrated-History-and-Word-Guide-by-Kihoon-Lee-_z-lib.org_.txt').toString()

content_ = content.split('\n\n\n').map(x => x.trim()).filter(x => x != '')

hanzi = R.uniq([...content].filter(isHanzi))

h = hanzi.map(h => {
  sentences = content_.filter(s => s.includes(h))
  sentences = sentences.map(x => x.replace(new RegExp(h, "g"), "<b>" + h + "</b>").trim().replace(/\s+/g, ' '))

  return {
    h,
    sentences
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(h);
