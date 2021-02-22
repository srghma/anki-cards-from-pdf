const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const convertToRuTable = require('./scripts/lib/processPurpleculture').convertToRuTable

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/chinese pinyin mnemonics - Sheet1.tsv').pipe(csv({ separator: "\t", headers: [] })))

convertToRuTable__ = R.pipe(
  R.map(x => ([ x.numbered.replace(/\d/, ''), x.ru.replace('⁵', '').replace('⁴', '').replace('³', '').replace('²', '').replace('¹', '') ])),
  R.uniq,
  R.fromPairs,
)(convertToRuTable)

input_ = input.map(x => {
  return R.map(xval => {
    if (convertToRuTable__[xval]) {
      const ret = xval + " | " + convertToRuTable__[xval]
      delete convertToRuTable__[xval]
      return ret
    }

    return xval
  }, x)
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input_);

Object.entries(convertToRuTable__).map(([k, v]) => console.log(k + " | " + v))
