const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
// const dom = new JSDOM(``);
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const timeoutPromise = require('./scripts/lib/timeoutPromise').timeoutPromise

/////////////////
const zitools_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/zitools_cache.json'
let zitools_cache = {}
if (fs.existsSync(zitools_with_cache_path)) { zitools_cache = JSON.parse(fs.readFileSync(zitools_with_cache_path).toString()) }; null

input = Object.keys(JSON.parse(require('fs').readFileSync('/home/srghma/projects/srghma-chinese/files/anki.json').toString())); null
input_without_already = R.difference(input, Object.keys(zitools_cache))
console.log("\ninput = JSON.parse('" + JSON.stringify(input_without_already.slice(-1000, -1)) + "')")

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

output = {}
stop_ = false

req_options = {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "ru,en-US;q=0.9,en;q=0.8",
    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"102\", \"Google Chrome\";v=\"102\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  },
  "referrer": "https://zi.tools/zi/%E9%9F%B3",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
}

async function req(str) {
  let r = await fetch(`https://zi.tools/api/zi/${encodeURIComponent(str)}`, req_options)
  if (r.status === 404) { return false }
  let t = await r.json()
  return t
}

// input.forEach(async currentInput => {
  for (let i = 0; i < input.length; i++) {
    const kanji = input[i].trim()
    if (stop_) {
      console.log({ m: "stopping", kanji, i })
      break
    }
    if (output.hasOwnProperty(kanji)) {
      console.log({ m: "already processed", kanji, i, ret: output[kanji] })
      continue
    }
    let res = null
    try {
      res = await req(kanji)
    } catch (e) {
      console.error({ kanji, i, e })
      output[kanji] = null
      continue
    }
    console.log({ kanji, res, i, l: input.length })
    output[kanji] = res
  }
// })

console.save(output, 'zitools')

// mv "/home/srghma/projects/anki-cards-from-pdf/zitools_cache.json" "/home/srghma/projects/anki-cards-from-pdf/zitools_old_cache.json"
// jq  '. * input' "/home/srghma/Downloads/zitools (1)" "/home/srghma/projects/anki-cards-from-pdf/zitools_old_cache.json" > "/home/srghma/projects/anki-cards-from-pdf/zitools_cache.json"
// jq 'keys | length' "/home/srghma/Downloads/zitools (1)"
// jq 'keys | length' "/home/srghma/projects/anki-cards-from-pdf/zitools_old_cache.json"
// jq 'keys | length' "/home/srghma/projects/anki-cards-from-pdf/zitools_cache.json"
