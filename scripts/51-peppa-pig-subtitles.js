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
  return filesAbsPath.filter(x => x.endsWith('.vtt')).map(file => {
    let x = require('fs').readFileSync(file).toString() // .replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)
    x = require('subtitles-parser-vtt').fromVtt(x, 's')
    // console.log(x)
    // x = x.map(x => {
    //   // if (x.length !== 2) { throw new Error(x) }
    //   let [time, ...sentense] = x
    //   // console.log(x)
    //   // time = time.split('-->')[0].trim().replace(',', '.')
    //   // console.log(time)
    //   // const date = new Date("1970-01-01 " + time)
    //   return [time, sentense.join('<br>')]
    // })
    return { file: file.replace(`${dirPath}/`, '').replace('.vtt', ''), x }
  })
}
subCh = await readdirFullPath("/home/srghma/Downloads")
subCh = R.groupBy(
  x => {
    x = R.init(x.file.split('.')).join('.')
    x = R.takeLast("n0-7tCMSM4s".length, x)
    return x
  },
  subCh
)
subCh = R.map(
  R.map(
    ({ file, x }) => {
      return { file: R.last(file.split('.')), x: R.map(x => x.text, x) }
    }
  ),
  subCh
)

// R.toPairs(subCh).map(x => x[1].map(x => x.file))

fulldir = "/home/srghma/projects/anki-cards-from-pdf/html/peppa"
const mkdirp = require('mkdirp')
await mkdirp(fulldir)

R.toPairs(subCh).map(([name, data]) => {
  // console.log(data)
  let chSubs = data.find(x => x.file === 'zh-Hans' || x.file === 'zh-Hant')
  chSubs = R.prop('x', chSubs)

  if (!chSubs) {
    chSubs = data.find(x => x.file === 'zh-HK')
    chSubs = R.prop('x', chSubs)

    if (chSubs) {
      chSubs = chSubs.map(x => {
        x = x.split('\n')
        if (x.length === 2) {
          return x[0]
        } else if (x.length === 3) {
          return R.init(x).join('\n')
        }
        else {
          throw new Error(x)
        }

      })
    }
  }

  if (!chSubs) { throw new Error('chSubs') }

  // let everything = data.find(x => x.file === 'zh-CN')
  // everything = R.prop('x', everything)

  // let englishSubs = data.find(x => x.file === 'en-GB' || x.file === 'en')
  // englishSubs = R.prop('x', englishSubs)
  // if (englishSubs) {
  //   if (englishSubs.length !== chSubs.length) {
  //     console.log({ englishSubs, chSubs, everything })
  //     throw new Error(`englishSubs.length !== chSubs.length: ${englishSubs.length} !== ${chSubs.length}`)
  //   }
  // } else {
  //   if (everything) { throw new Error('everything') }
  // }

  // let pinyinSubs = data.find(x => x.file === 'zh-SG')
  // pinyinSubs = R.prop('x', pinyinSubs)
  // if (pinyinSubs) {
  //   if (pinyinSubs.length !== chSubs.length) {
  //     throw new Error(`pinyinSubs.length !== chSubs.length: ${pinyinSubs.length} !== ${chSubs.length}`)
  //   }
  // }

  // englishSubs = englishSubs || R.repeat(undefined, chSubs.length)

  // pinyinSubs = pinyinSubs || R.repeat(undefined, chSubs.length)

  // data = []
  // chSubs.forEach((chSub, index) => {
  //   // console.log(chSub)
  //   // console.log(englishSubs)
  //   // console.log(pinyinSubs)
  //   const englishSub = englishSubs[index]
  //   console.log({ chSub, englishSub, index })
  //   if (englishSubs && !englishSub) { throw new Error('englishSubs') }
  //   const pinyinSub = pinyinSubs[index]
  //   if (pinyinSubs && !pinyinSub) { throw new Error('pinyinSubs') }
  //   data.push({ chSub, englishSub, pinyinSub })
  // })

  fs.writeFileSync(`${fulldir}/${name}.json`, JSON.stringify(chSubs, undefined, 2))
  // return chSubs
})

// colorize = ch => `<span onclick="window.showKanjiIframe('${ch}')">${ch}</span>`
// colorizes = s => [...s].map(ch => isHanzi(ch) ? colorize(ch) : ch).join('')
// link = (ch, t) => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${t}</a>`

// subCh.forEach(({ file, x }, epIndex) => {
//   epIndex = epIndex + 1

//   const html = x.map((x) => {
//     xWithoutHtml = require('string-strip-html').stripHtml(x.text).result.replace(/^\s+/g, '').replace(/\n/g, ' ')

//     return [
//       [`p`, link(xWithoutHtml, "-")],
//       [`date`, x.startTime],
//       [`sim`, colorizes(x.text).replace(/\n/g, '<br>')],
//       [`pinyin`, require("chinese-to-pinyin")(xWithoutHtml, { keepRest: true })],
//     ].map(([kl, x]) => String.raw`<td class="${kl}">${x}</td>`)
//   })

//   html_ = `<!DOCTYPE HTML>
// <html>
//   <head>
//   <base href="..">
//   <meta charset="utf-8">
//   <title>Longest day, ep ${epIndex}</title>
//   <link rel="stylesheet" href="main.css">
//   <style>
//   .tone1 { color: #a3a3ff; }
//   .tone2 { color: lightgreen; }
//   .tone3 { color: #ff00ff; }
//   .tone4 { color: #ff7b7b; }
//   .date { width: 1%; }
//   </style>
//   <script src="dict-myscripts.js"></script>
//   </head>
//   <body class="nightMode">
//   <table border="1" class="mytable" style="width: 100%;">
//     ${html.map(x => String.raw`<tr>${x.join('')}</tr>`).join('\n')}
//   </table>
//   </body>
// </html>`

//   fs.writeFileSync(`${fulldir}/${file}.html`, html_)
// })
