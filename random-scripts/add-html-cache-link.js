const csv = require('csv-parser')
const fs = require('fs')

const REGEX_JAPANESE = /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;

let results = [];
let headers = [
  "kanji",
]
fs.createReadStream('/home/srghma/Downloads/Chinese Grammar Wiki.txt').pipe(csv({ separator: '\t', headers })).on('data', (data) => results.push(data)).on('end', () => { console.log(results); })

results_ = results.map((x) => {
  const links = x["kanji"].split('').filter(x => {
    if (['。', '？', '，'].includes(x)) { return false }

    return REGEX_JAPANESE.test(x) || REGEX_CHINESE.test(x)
  })

  return links
}).flat()

let unique = [...new Set(results_)]

console.log(unique.map(x => `<img src="${x}.html">`).join('\n'))

const createCsvWriter = require('csv-writer').createObjectCsvWriter
createCsvWriter({ path: '/home/srghma/Downloads/Chinese Grammar Wiki2.txt', header:  ["kanji", "links"].map(x => ({ id: x, title: x })) }).writeRecords(results_).then(() => { console.log('...Done') })
