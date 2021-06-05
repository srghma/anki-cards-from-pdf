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

inputOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: "kanji marked numbered html chapter en".split(' ') })))
input = inputOrig

colorize = ch => `<span onclick="window.showKanjiIframe('${ch}')">${ch}</span>`
colorizes = s => s.split('').map(ch => isHanzi(ch) ? colorize(ch) : ch).join('')

link = (ch, t) => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${t}</a>`

html = input.map(x => {
  return [
    [`p`, link(x.kanji, "-")],
    [`sim`, colorizes(x.kanji)],
    ["marks", x.marked],
    ["en", x.en],
  ].map(([kl, x]) => String.raw`<td class="${kl}">${x}</td>`)
})

html_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>Hua ma</title>
  <link rel="stylesheet" href="main.css">
  <style>
  .tone1 { color: #a3a3ff; }
  .tone2 { color: lightgreen; }
  .tone3 { color: #ff00ff; }
  .tone4 { color: #ff7b7b; }
  </style>
  <script src="dict-myscripts.js"></script>
 </head>
 <body class="nightMode">
  <table border="1" class="mytable">
   ${html.map(x => String.raw`<tr>${x.join('')}</tr>`).join('\n')}
  </table>
</div>
</div>
 </body>
</html>
`

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/sherlock.html', html_)
