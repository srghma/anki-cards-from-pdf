const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: [ "id", "hanzi", "ruby" ] })))
