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
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const escapeRegExp = require('./scripts/lib/escapeRegExp').escapeRegExp

inputOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/my spanish verbs 1000.txt').pipe(csv({ separator: "\t", headers: "verb".split(' ') })))
input = inputOrig.map(x => x.verb)
console.log('input = ' + JSON.stringify(input))

output_ = {}
stop_ = false
;(async function() {
  function partition(list = [], n = 1) {
    const range = ({from = 0, to, step = 1, length = Math.ceil((to - from) / step)}) => Array.from({length}, (_, i) => from + i * step)
    const isPositiveInteger = Number.isSafeInteger(n) && n > 0;
    if (!isPositiveInteger) {
      throw new RangeError('n must be a positive integer');
    }
    const q = Math.floor( list.length / n );
    const r = list.length % n;
    let i   ; // denotes the offset of the start of the slice
    let j   ; // denotes the zero-relative partition number
    let len ; // denotes the computed length of the slice
    const partitions = [];
    for ( i=0, j=0, len=0; i < list.length; i+=len, ++j ) {
      len = j < r ? q+1 : q ;
      partitions.push(range({ from: i, to: i+len })) ;
    }
    return partitions;
  }
  // partition([1,2,3,4,5,6,7,8,9,10], 3)
  // partition([1,2,3,4,5,6,7,8,9,10,11], 3)
  // partition([1,2,3,4,5,6,7,8,9,10,11,12], 3)
  // partition([1,2,3,4,5,6,7,8,9,10,11,12,13], 3)
  // partition([1,2,3,4,5,6,7,8,9,10,11,12,13], 1)
  function req(i) {
    return fetch(`https://es.bab.la/ejemplos/espanol/${i}`, { "headers": { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", "accept-language": "es-ES,es;q=0.9", "cache-control": "no-cache", "pragma": "no-cache", "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"102\", \"Google Chrome\";v=\"102\"", "sec-ch-ua-mobile": "?0", "sec-ch-ua-platform": "\"Linux\"", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "cross-site", "sec-fetch-user": "?1", "upgrade-insecure-requests": "1" }, "referrer": "https://www.google.com/", "referrerPolicy": "origin", "body": null, "method": "GET", "mode": "cors", "credentials": "include" })
  }
  partition(input, 4).forEach(async (indexes, partitionIndex) => {
    for (const index of indexes) {
      const debug = { partitionIndex, index, l: input.length }
      const element = input[index].trim()
      if (stop_) {
        console.log({ m: "stopping", element, index })
        break
      }
      const ret = output_[element]
      console.log({ element, ret, ...debug })
      if (ret) {
        console.log({ m: "already processed", element, ret, ...debug })
        continue
      }
      try {
        let res = await req(element)
        res = await res.text()
        // console.log(res)
        const parser = new DOMParser();
        const doc = parser.parseFromString(res, "text/html");
        res = doc.querySelector('div.sense-group').querySelectorAll('span.cs-source > span:nth-child(2)')
        res = Array.from(res).map(x => x.textContent)
        console.log({ element, res, ...debug })
        if (res.length === 0) {
          output_[element] = res
        }
      } catch (e) {
        console.error({ element, e, ...debug })
        // output_[element] = null
      }
    }
  })
})();

Object.entries(output_).forEach(([key, value]) => {
  if (value.length === 0) {
    delete output_[key]
  } else {
    output_[key] = Array.from(new Set(value))
  }
})

Object.keys(output_).length

(function(console){
console.save = function(data, filename){
    if(!data) {
        console.error('Console.save: No data')
        return;
    }
    if(!filename) filename = 'console.json'
    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4)
    }
    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')
    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
 }
})(console)
// https://stackoverflow.com/questions/11849562/how-to-save-the-output-of-a-console-logobject-to-a-file
console.save(JSON.stringify(output_, null, 1))
