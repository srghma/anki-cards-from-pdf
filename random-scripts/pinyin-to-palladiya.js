const csv = require('csv-parser')
const fs = require('fs')
const pinyinConvert = require('pinyin-convert')

let results = [];
let headers = [ "sentence", "pinyin" ]
fs.createReadStream('/home/srghma/Downloads/Chinese Grammar Wiki.txt').pipe(csv({ separator: '\t', headers })).on('data', (data) => results.push(data)).on('end', () => { console.log(results); })

let res = results.map(x => ({ sentence: x['sentence'], pinyin: pinyinConvert(x['pinyin']) }))

let res2 = null

Promise.all(
  res
  .map(x =>
    x['pinyin']
    .then(p => ({ sentence: x['sentence'], p })
      )
    )
  )
  .then(x => { res2 = x })

let convertToRuTable = [];
fs.createReadStream('/home/srghma/projects/anki-cards-from-pdf/pinyin-to-ru-by-kfcd').pipe(csv({ separator: '\t', headers: ["1", "2", '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] })).on('data', (data) => convertToRuTable.push(data)).on('end', () => { console.log(convertToRuTable); })

convertToRuTable = convertToRuTable.map(x => ({ from: x['1'], to: x['10'] })).sort((a, b) => a.from.length - b.from.length).reverse()


res3 = res2.map(x => {
  let p = x['p']

  for (const { from, to } of convertToRuTable) {
    p = p.replace(new RegExp(from, 'i'), to)
  }

  return {
    sentence: x['sentence'],
    before: x['p'],
    after: p
  }
})

require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/Chinese Grammar Wiki2.txt', header:  ["sentence", "before", "after"].map(x => ({ id: x, title: x })) }).writeRecords(res3).then(() => { console.log('Done') })
