const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

newkanji = Object.fromEntries([
  '/home/srghma/Downloads/In-Search-of-Hua-Ma-by-John-Pasden_-Jared-Turner-_z-lib.org__1.txt',
  '/home/srghma/Downloads/Journey_to_the_Center_of_the_Earth_Mandarin_Companion_Graded_Readers_1.txt',
  '/home/srghma/Downloads/Sherlock_Holmes_and_the_Case_of_the_Curly_Haired_Company_Mandarin.txt',
  '/home/srghma/Downloads/The_Monkey’s_Paw_Mandarin_Companion_Graded_Readers_Level_1__Simplified.txt',
].map(f => {
  content = fs.readFileSync(f).toString()
  content = R.uniq(content.split('').filter(s => isHanzi(s)))

  return [f, content]
}))

knownkanji = input.map(x => x.kanji)
knownkanji.length
R.uniq(knownkanji).length

// function checkDuplicateKeys(arr) {
//   const counts = {}
//   return arr.filter((item) => {
//     counts[item] = counts[item] || 1
//     if (counts[item]++ === 2) return true
//   })
// }

// checkDuplicateKeys(knownkanji)

knownkanji = R.uniq(knownkanji)

R.map(R.filter(x => {
  // console.log(x)
  return !knownkanji.includes(x)
}), newkanji)
