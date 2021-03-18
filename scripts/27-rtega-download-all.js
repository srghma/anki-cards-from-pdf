const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const csv = require('csv-parser')
const fs = require('fs')
const chineseToPinyin = require('chinese-to-pinyin')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const dom = new JSDOM(``);

const subpage = {
  51: 13,
  64: 10,
  48: 189,
}

async function rtega_get(subpage, start) {
  const r = await fetch(`http://rtega.be/chmn/index.php?start=${start}&subpage=${subpage}`, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "upgrade-insecure-requests": "1",
      "cookie": "allcharacters=1; chmnimages=0"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });
  const t = await r.text()
  return t
}

output = []
perPage = 20
promises = R.toPairs(subpage).map(x => R.range(1, x[1] + 1).map(page => ({ subpage: x[0], page }))).flat()
promises = promises.map(({ subpage, page }) => ({ subpage, start: (page - 1) * 20 }))
promises = promises.map(({ subpage, start }, inputIndex) => async jobIndex => {
  console.log({ m: "doing", inputIndex, jobIndex, subpage, start })
  let translation = null
  try {
    translation = await rtega_get(subpage, start)
  } catch (e) {
    console.error({ m: "error", inputIndex, subpage, start, e })
    return
  }
  if (translation) {
    console.log({ m: "finished", jobIndex, inputIndex, length: promises.length })
    output.push({ subpage, start, translation })
  }
})
await mkQueue(1).addAll(promises)

// output.forEach(({ subpage, start, translation }) => {
//   fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/.rtega-cache/${subpage}-${start}.html`, translation)
// }

output_ = output.map(x => {
  dom.window.document.body.innerHTML = x.translation
  return mapWithForEachToArray(dom.window.document.querySelectorAll('table tr'), node => node.outerHTML)
}).flat()

output__ = output_.map(x => {
  x = x
    .replace(/ id="[^"]+"/g, "")
    .replace(/ uid="[^"]+"/g, "")
    .replace(/ data-\w+="[^"]+"/g, "")
    .replace(/ target="[^"]*"/g, "")
    .replace(/ class="[^"]+"/g, "")
    .replace(/ style="[^"]+"/g, "")
    .replace(/ href=\"/g, " href=\"http://rtega.be/chmn/")
    .replace(/<font>([^<]+)<\/font>/g, "$1")
    .replace(/<font>([^<]+)<\/font>/g, "$1")
  x = "<table>" + x + "</table>"
  return x
})

output__ = output__.map(x => {
  dom.window.document.body.innerHTML = x

  const tds = dom.window.document.body.querySelectorAll('td')

  return {
    1: tds[0].textContent.trim(),
    2: tds[1].textContent.trim(),
    x,
  }
})

output__ = output__.map(x => {
  let ierogliphs = R.uniq((x['1'] + x['2']).replace(/[a-zA-Z]/g, '').split(''))
  return ierogliphs.map(ierogliph => ({ ierogliph, x: x.x }))
}).flat()

output__ = R.map(val => R.uniq(val.map(R.prop('x'))), R.groupBy(x => x.ierogliph, output__))

output__ = R.toPairs(output__).map(x => ({ i: x[0], o: x[1].join('\n<br>\n') }))

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output__);
