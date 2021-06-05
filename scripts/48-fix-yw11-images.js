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

const output_imagetexts__path = '/home/srghma/projects/anki-cards-from-pdf/image-texts.json'
output_imagetexts = JSON.parse(fs.readFileSync(output_imagetexts__path).toString()); null

files = fs.readdirSync('/home/srghma/.local/share/Anki2/User 1/collection.media/')
files = files.filter(x => x.includes('yw11-zixing-zi') && x.includes('.png'))

R.toPairs(output_imagetexts).filter(x => x[1].length <= 0).map(R.prop(0)).forEach(x => {
  console.log(x)
  delete output_imagetexts[x]
})

output_imagetexts = R.toPairs(output_imagetexts).filter(x => x[1].length > 0).map(x => ({ k: x[0], d: x[1][0].description }))

function fixAuto(d) {
  d = d.trim().split('\n').map(x => x.trim()).filter(R.identity)
  const buff = []
  let nextJoin = false
  d.forEach(d => {
    let doJoin = false
    if (nextJoin) {
      doJoin = true
      nextJoin = false
    }
    // console.log({ d, buff })
    if (R.any(s => d.startsWith(s), ['会意字', '形声字', '象形字']) && !d.endsWith('。')) {
      nextJoin = true
    }
    // console.log({ doJoin })
    if (doJoin && buff.length > 0) {
      // console.log('joining')
      buff[buff.length - 1] = buff[buff.length - 1] + d
    } else {
      buff.push(d)
    }
  })
  return buff.join('\n')
}

// fixAuto(output_imagetexts[0].d)
// d = d.trim().split('\n')
// d = d[0]

output_imagetexts = output_imagetexts.map(x => ({ k: x.k, d: fixAuto(x.d) }))

// output_imagetexts = R.uniq(output_imagetexts.map(x => x.d))

fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/output_imagetexts.txt', R.uniq(output_imagetexts.map(x => x.d)).join('\n-------------\n'))

x = fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/output_imagetexts.txt').toString().split('-------------')

x.length
R.uniq(output_imagetexts.map(x => x.d)).length

mapping = R.zipObj(R.uniq(output_imagetexts.map(x => x.d)), x); null

output_imagetexts_fixed = output_imagetexts.map(x => {
  let d = x.d
  d = mapping[d]
  if (!d) { throw new Error(x.k) }
  d = d.trim()
  return { k: x.k, d }
})

// docx = require("docx")
// { Document, Packer, Paragraph, TextRun } = docx

// doc = new Document({
//   sections: output_imagetexts_fixed.map(x => ({
//     properties: {},
//     children: x.d.split('\n').map(x =>
//       new Paragraph({ children: [ new TextRun(x) ] })
//     ).concat([new Paragraph({ children: [ new TextRun('------------------------------------') ] })])
//   }))
// })

// Packer.toBuffer(doc).then((buffer) => {
//   fs.writeFileSync("images-text.docx", buffer)
// })


transl = fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/image-text.html').toString()
transl = transl.replace(/<script[^>]*>(?:(?!<\/script>)[^])*<\/script>/g, "")
transl = transl.replace(/<style[^>]*>(?:(?!<\/style>)[^])*<\/style>/g, "")
transl = removeHTML(dom, transl)
transl_ = transl.split('\n').map(R.trim).join('\n').replace(/\n+/g, '\n').split('------------------------------------').map(R.trim)
transl_ = R.init(transl_)


transl_.length
output_imagetexts_fixed.length

R.last(transl_)
R.last(output_imagetexts_fixed)

output_imagetexts_fixed_ = R.zipWith(R.merge, transl_.map(x => ({ ru: x })), output_imagetexts_fixed)

inputOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

input = inputOrig.map(x => ({
  kanji: x.kanji,
  yw11: x._91,
})).filter(x => x.yw11).map(x => ({
  ...x,
  // yw11_without_image: x.yw11.replace(/<img src="yw11-zixing-zi\d+\.png" alt="[^"]+">/g, ''),
  yw11_image: (Array.from(x.yw11.matchAll(/<img src="(.*?)"/g)) || []).map(x => x[1])[0]
})).filter(x => x.yw11_image).filter(x => x.yw11_image.endsWith('.png')).map(x => {
  const yw11_image = x.yw11_image.replace(/yw11-zixing-zi/, '').replace(/\.png/, '')
  const yw11 = x.yw11.replace(/<a href="https:\/\/images\.yw11\.com\/zixing\/zi\d+.png" target="_blank"><img src="yw11-zixing-zi\d+\.png" alt="[^"]+"><\/a>/g, '')
  const src = `yw11-zixing-zi${yw11_image}.png`
  const link = `https://images.yw11.com/zixing/zi${yw11_image}.png`
  const tr = output_imagetexts_fixed_.find(x => x.k === src)
  // console.log(tr)
  if (!tr) {
    console.log(src)
    return null
  }
  return {
    kanji: x.kanji,
    yw11,
    yw11_image_html: `<a href="${link}" target="_blank"><img src="${src}"></a>`,
    ru: tr.ru.replace(/\n/g, '<br>'),
    d: tr.d.replace(/\n/g, '<br>') // + `<p><a href="https://www.deepl.com/translator#zh/en/${encodeURIComponent(tr.d)}" target="_blank">(DeepL)</a></p>`,
  }
}).filter(R.identity)

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input);

R.uniq(input.map(x => x.yw11_images.length))
input.length
input.filter(x => x.yw11_without_image !== x.yw11).length

input.map(x => ({}))

// output_imagetexts.length
// x.length
// output_imagetexts_ = R.mapObjIndexed(output_imagetexts)


// imgWithDescr = R.map(R.over(R.lensProp('d'), x => x, imgWithDescr))

// imgWithDescr = R.map(x => [`<img src="/home/srghma/.local/share/Anki2/User 1/collection.media/${x.k}">`, x.d.replace(/\n/g, '<br>')], output_imagetexts)
// imgWithDescr = R.map(R.map(x => String.raw`<td>${x}</td>`), imgWithDescr)

// html_ = `
// <!DOCTYPE HTML>
// <html>
//  <head>
//   <meta charset="utf-8">
//   <title>Hua ma</title>
//   <link rel="stylesheet" href="main.css">
//   <style>
//   .tone1 { color: #a3a3ff; }
//   .tone2 { color: lightgreen; }
//   .tone3 { color: #ff00ff; }
//   .tone4 { color: #ff7b7b; }
//   </style>
//   <script src="dict-myscripts.js"></script>
//  </head>
//  <body class="nightMode">
//   <table border="1" class="mytable">
//    ${imgWithDescr.map(x => String.raw`<tr>${x.join('')}</tr>`).join('\n')}
//   </table>
// </div>
// </div>
//  </body>
// </html>
// `

// fs.writeFileSync('/home/srghma/projects/anki-cards-from-pdf/html/imageandfixedtext.html', html_)
