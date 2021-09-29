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
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const escapeRegExp = require('./scripts/lib/escapeRegExp').escapeRegExp

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))

  return filesAbsPath.map(file => {
    let x = require('fs').readFileSync(file).toString().replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)

  // console.log(x)

    x = x.map(x => {
      // if (x.length !== 2) { throw new Error(x) }

      let [time, ...sentense] = x
      // console.log(x)

      // time = time.split('-->')[0].trim().replace(',', '.')

      // console.log(time)

      // const date = new Date("1970-01-01 " + time)

      return [time, sentense.join('<br>')]
    })

    return x
  })
}
subEn = await readdirFullPath("/home/srghma/Downloads/Subtitlist.com-the-longest-day-in-changan-chang-an-shi-er-shi-chen_english_2061623/")
subCh = await readdirFullPath("/home/srghma/Downloads/a4k.net_1591754997/")

colorize = ch => `<span onclick="window.showKanjiIframe('${ch}')">${ch}</span>`
colorizes = s => s.split('').map(ch => isHanzi(ch) ? colorize(ch) : ch).join('')
link = (ch, t) => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${t}</a>`

subCh.forEach((epSentences, epIndex) => {
  epIndex = epIndex + 1

  const html = epSentences.map(([date, x]) => {
    xWithoutHtml = require('string-strip-html').stripHtml(x).result.replace(/^\s+/, '').replace(/\n/, ' ')

    return [
      [`p`, link(xWithoutHtml, "-")],
      [`date`, date],
      [`sim`, colorizes(x)],
      [`pinyin`, require("chinese-to-pinyin")(x, { keepRest: true })],
    ].map(([kl, x]) => String.raw`<td class="${kl}">${x}</td>`)
  })

  html_ = `<!DOCTYPE HTML>
<html>
  <head>
  <base href="..">
  <meta charset="utf-8">
  <title>Longest day, ep ${epIndex}</title>
  <link rel="stylesheet" href="main.css">
  <style>
  .tone1 { color: #a3a3ff; }
  .tone2 { color: lightgreen; }
  .tone3 { color: #ff00ff; }
  .tone4 { color: #ff7b7b; }
  .date { width: 1%; }
  </style>
  <script src="dict-myscripts.js"></script>
  </head>
  <body class="nightMode">
  <table border="1" class="mytable" style="width: 100%;">
    ${html.map(x => String.raw`<tr>${x.join('')}</tr>`).join('\n')}
  </table>
  </body>
</html>`

  fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/longestday/ch-${epIndex}.html`, html_)
})

subEn.forEach((epSentences, epIndex) => {
  epIndex = epIndex + 1

  const html = epSentences.map(([date, x]) => {
    return [
      [`date`, date],
      [`pinyin`, x],
    ].map(([kl, x]) => String.raw`<td class="${kl}">${x}</td>`)
  })

  html_ = `<!DOCTYPE HTML>
<html>
  <head>
  <base href="..">
  <meta charset="utf-8">
  <title>(en) Longest day, ep ${epIndex}</title>
  <link rel="stylesheet" href="main.css">
  <style>
  .tone1 { color: #a3a3ff; }
  .tone2 { color: lightgreen; }
  .tone3 { color: #ff00ff; }
  .tone4 { color: #ff7b7b; }
  .date { width: 1%; }
  </style>
  <script src="dict-myscripts.js"></script>
  </head>
  <body class="nightMode">
  <table border="1" class="mytable" style="width: 100%;">
    ${html.map(x => String.raw`<tr>${x.join('')}</tr>`).join('\n')}
  </table>
  </body>
</html>`

  fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/longestday/en-${epIndex}.html`, html_)
})

