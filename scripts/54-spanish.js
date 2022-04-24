const fetch = require('node-fetch')
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
const TongWen = require('./scripts/lib/TongWen').TongWen
{ etimologias } = require('./scripts/lib/etimologiasdechile')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});

// await etimologias(dom, 'nomofilo')

input = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/esp.txt`).pipe(csv({ separator: "\t", headers: "id en es".split(' ') })))
input = input.map(x => ({ id: x.id, es: R.uniq(x.es.split(' ').map(x => x.replace(/\W/g, '').toLowerCase()).filter(x => x)) }))
input = input.map(x => x.es.map(word => ({ word, id: x.id }))).flat()
input = R.groupBy(R.prop('word'), input)
input = R.map(R.map(R.prop('id')), input)
input = RA.omitBy((val, key) => !!Number(key) || key.length <= 2 || key.includes('epub') || key.includes('title') || key.includes('idpage') || key.includes('classright'), input)
input = R.toPairs(input).map(([word, ids]) => ({ word, ids }))

async function mapper(output, x, inputIndex, dom) {
  word = x['word']
  if(!word) { throw new Error('') }
  let transl = null
  try {
    transl = await require('./scripts/lib/etimologiasdechile').etimologias_with_cache(dom, word)
    // console.log({ word, transl })
  } catch (e) {
    console.error({ word, e })
    return
  }
  output.push({
    x,
    transl,
  })
}
output = []
mkQueue(queueSize).addAll(input.map((x, inputIndex) => async jobIndex => { await mapper(output, x, inputIndex, doms[jobIndex]) }))

// output_ = output.filter(x => !x.transl)
output_ = output.filter(x => x.transl)
output_ = output_.map(x => ({ ...x.x, etimology: x.transl.etimology }))

// output_ = output_.map(x => ({ ...x, etimology: removeHTML(dom, x.etimology) }))
// output_ = output_.map(x => ({ ...x, etimology: require('html-to-text').convert(x.etimology) }))

// require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["key", "value"].map(x => ({ id: x, title: x })) }).writeRecords(output_).then(() => { console.log('...Done') })
require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["word", "etimology"].map(x => ({ id: x, title: x })) }).writeRecords(output_).then(() => { console.log('...Done') })

// =GOOGLETRANSL(text, "es", "ru")
translations = await readStreamArray(fs.createReadStream(`/home/srghma/Downloads/output - output (1).csv`).pipe(csv({ separator: ",", headers: "w ru noth es".split(' ') })))
translations = translations.map(x => [x.w, x.ru])
translations = R.fromPairs(translations); null

output__ = output_.map(x => ({ ...x, ru: translations[x.word] }))

output__.filter(x => !x.ru)

output__ = output__.map(x => x.ids.map(id => ({ id, ...x }))).flat()
output__ = R.groupBy(R.prop('id'), output__); null
output__ = R.mapObjIndexed(R.map(R.prop('ru')), output__); null
output__ = R.mapObjIndexed(xs => xs.join('\n<hr/>\n'), output__); null
output__ = R.toPairs(output__)
output__ = output__.map(([key, value]) => ({ key, value }))

require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["key", "value"].map(x => ({ id: x, title: x })) }).writeRecords(output__).then(() => { console.log('...Done') })

// function deleteRequireCache(module) { delete require.cache[require.resolve(module)] }
// deleteRequireCache('./scripts/lib/google_translate_with_cache')

// async function mapper(output, x, inputIndex, dom) {
//   etimology = x['etimology']
//   if(!etimology) { throw new Error('') }
//   let google_translate = null
//   try {
//     google_translate = await require('./scripts/lib/google_translate_with_cache').google_translate_with_cache(etimology, { from: 'es', to: 'ru' })
//     // console.log({ etimology, google_translate })
//   } catch (e) {
//     console.error({ e, x })
//     // return
//   }
//   output.push({
//     ...x,
//     google_translate,
//   })
// }
// google_translate_output = []
// mkQueue(queueSize).addAll(output_.slice(0, 1).map((x, inputIndex) => async jobIndex => { await mapper(google_translate_output, x, inputIndex, doms[jobIndex]) }))

/////////////////////////////////////////////

req_options = {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors"
}

myfetch = async (dom, url) => {
  let r = await fetch(url, req_options)
  let t = await r.text()
  // JSDOM.reconfigureWindow(dom.window, { url: url })
  // JSDOM.reconfigureWindow(dom.window, { location: url })
  // JSDOM.reconfigureWindow(dom.global.window, { url: url })
  // dom.window.location.href = url
  // dom.global.location.href = url
  dom.window.document.body.innerHTML = t
}

await myfetch(dom, `http://etimologias.dechile.net/PIE/`)

links = Array.from(dom.window.document.body.querySelector('.menu').querySelectorAll('a')).map(x => `http://etimologias.dechile.net` + x.href.trim())

output = []
promises = links.map((x, index) => async jobIndex => {
  let dom = doms[jobIndex]
  await myfetch(dom, x)
  let links = Array.from(dom.window.document.body.querySelector('.menu').querySelectorAll('a')).map(x => `http://etimologias.dechile.net` + x.href.trim())
  output.push(links)
})
await mkQueue(queueSize).addAll(promises)

links = R.uniq([...links, ...output.flat()])

output = []
promises = links.map((x, index) => async jobIndex => {
  let dom = doms[jobIndex]
  await myfetch(dom, x)
  let links = Array.from(dom.window.document.body.querySelector('tbody').querySelectorAll('a')).map(x => `http://etimologias.dechile.net` + x.href.trim())
  output.push(links)
})
await mkQueue(queueSize).addAll(promises)

names = R.uniq([...links, ...output.flat()])
names = names.map(x => x.replace(`http://etimologias.dechile.net/?`, ''))
names = names.filter(x => !R.startsWith('http://etimologias.dechile.net', x))
names = names.sort()
names = R.uniq(names)
names = R.remove(0, 2, names)
console.log(JSON.stringify(names, '  '))
fs.writeFileSync('/tmp/names.json', JSON.stringify(names, '  '))

output = []
promises = names.map((x, index) => async jobIndex => {
  let dom = doms[jobIndex]
  let link = `http://etimologias.dechile.net/?${x}`
  await myfetch(dom, link)
  let html = dom.window.document.body.querySelector('div.container').innerHTML
  output.push([x, html])
})
await mkQueue(queueSize).addAll(promises)

x = output.map(([k, v]) => [k.replace(`http://etimologias.dechile.net/?`, ''), v.trim()])
x = x.filter(([k, v]) => !R.startsWith(`http://etimologias.dechile.net/PIE/`, k))
x = x.map(([k, v]) => [k, R.head(R.split('<p align="center">\n<!-- Modified Eti-inline -->', v))])
x = x.map(([k, v]) => [k, v.trim()])
x = R.fromPairs(x); null
x['discriminacio.n']

////////

htmlContent = html.map(x => '<chapter>' + addSentences(x.html) + '</chapter>').join('\n').replace(/src="\.\.\/Images/g, 'src="Images').replace(/\.\.\/Text\/chapter\d\d\.xhtml#/g, '#')

html_ = {
  title: epub.metadata.title,
  css: css.map(x => x.href.replace('OEBPS/', '')),
  toc: html.map(x => x.title).filter(Boolean),
  htmlContent,
}
// html_ = `
// <!DOCTYPE HTML>
// <html>
//  <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>${epub.metadata.title}</title>
//   <meta name="referrer" content="no-referrer">
//   ${html_.css.map(x => `<link rel="stylesheet" href="${x}">`).join('\n')}
//   <link rel="stylesheet" href="style.css">
//   <script src="https://cdn.jsdelivr.net/npm/canvas-drawing-board@latest/dist/canvas-drawing-board.js"></script>
//   <script defer src="bundle.js"></script>
//  </head>
//  <body>
//   <div id="container">
//     <div id="body">
//       <div><ul>${html_.toc.map(x => '<li>' + x + '</li>').join('\n')}</ul></div>
//       ${html_.htmlContent}
//     </div>
//     <footer>
//       <div id="app" style="position: relative; width: 100%; height: 300px"></div>
//       <div id="currentSentence"></div>
//       <div id="currentSentenceTraditional"></div>
//       <div class="controllers">
//         <audio controls id="tts-audio"></audio>
//         <div class="buttons">
//           <button id="clear-canvas">Clear</button>
//           <button id="pleco">Pleco</button>
//         </div>
//       </div>
//     </footer>
//   </div>
//  </body>
// </html>
// `
fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/elon-musk/index.json`, JSON.stringify(html_))

// --debug
require("child_process").execSync('./node_modules/.bin/browserify html/elon-musk/main.js -o html/elon-musk/bundle.js')

// file = fs.readFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/elon-musk.html`).toString()
// mydom = new JSDOM(file)
// clean(mydom.window.document.body)

// // colorize = ch => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${ch}</a>`
// colorize = ch => `<a target="_blank" href="/h.html#${ch}">${ch}</a>`
// colorizes = s => [...s].map(ch => isHanzi(ch) ? colorize(ch) : ch).join('')

// fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/elon-musk.html`, colorizes(mydom.serialize()))
