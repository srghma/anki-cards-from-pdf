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

function parse(epub) {
  return new Promise((resolve, reject) => {
    epub.on("error", function(error) {
      console.log("ERROR\n-----")
      throw error
    })

    epub.on("end", function(error){
      if (error) { reject({ on: "end", error }) }
      else { resolve() }
    })

    epub.parse()
  })
}

function getChapter(epub, id) {
  return new Promise((resolve, reject) => {
    epub.getChapter(id, function(error, data){
      if(error){
        reject(error)
        return
      }
      resolve(data)
    })
  })
}

function getFile(epub, id) {
  return new Promise((resolve, reject) => {
    epub.getFile(id, function(error, data){
      if(error){
        reject(error)
        return
      }
      resolve(data)
    })
  })
}

function getImage(epub, id) {
  return new Promise((resolve, reject) => {
    epub.getImage(id, function(error, data, mimeType){
      if(error){
        reject(error)
        return
      }
      resolve({ data, mimeType })
    })
  })
}

var EPub = require("epub")
var epub = new EPub("Elon Musk el empresario que anticipa el futuro.epub", "/imagewebroot/", "/articlewebroot/")

const parseResult = await parse(epub)

console.log(parseResult)
console.log("METADATA:\n")
console.log(epub.metadata)

console.log("\nSPINE:\n")
console.log(epub.flow)

console.log("\nTOC:\n")
console.log(epub.toc)

// data = await getFile(epub, epub.spine.contents[2].id)

dir = 'elon-musk'
output = `/home/srghma/projects/anki-cards-from-pdf/html/spanish/${dir}`

R.toPairs(epub.manifest).forEach(async ([id, data]) => {
  if (data['media-type'] !== 'image/jpeg') { return }
  const image = await getImage(epub, id)
  const outputPath = `${output}/${data.href.replace(/(OEBPS|OPS)\//g, '')}`
  await (require('mkdirp'))(require('path').dirname(outputPath))
  // console.log(path)
  await require('fs/promises').writeFile(outputPath, image.data)
})

// https://www.sitepoint.com/removing-useless-nodes-from-the-dom/
function clean(node)
{
  for(var n = 0; n < node.childNodes.length; n ++) {
    var child = node.childNodes[n];
    if (
      child.nodeType === 8
      ||
      (child.nodeType === 3 && !/\S/.test(child.nodeValue))
    )
    {
      node.removeChild(child);
      n--;
    }
    else if(child.nodeType === 1) {
      clean(child);
    }
  }
}

// data = epub.flow[2]
html = epub.flow.map(async (data) => {
  if (data['media-type'] !== 'application/xhtml+xml') { return }
  let epubFile = await getFile(epub, data.id)
  epubFile = epubFile.toString()

  const outputPath = `${output}/${data.href.replace(/(OEBPS|OPS)\//g, '')}`.replace('.xhtml', '.html')
  await (require('mkdirp'))(require('path').dirname(outputPath))

  mydom = new JSDOM(epubFile)

  clean(mydom.window.document.body)

  // console.log(outputPath)
  // console.log(epubFile)

  const html = mydom.window.document.body.innerHTML

  return { ...data, html }
})

html = await Promise.all(html)

css = R.values(epub.manifest).map(async (data) => {
  if (data['media-type'] !== 'text/css') { return }
  let epubFile = await getFile(epub, data.id)
  css = epubFile.toString()
  return { ...data, css }
})
css = await Promise.all(css)
css = css.filter(Boolean)
css.forEach(async data => {
  const outputPath = `${output}/${data.href.replace(/(OEBPS|OPS)\//g, '')}`
  await (require('mkdirp'))(require('path').dirname(outputPath))
  // console.log(data.css)
  console.log(outputPath)
  await require('fs/promises').writeFile(outputPath, data.css)
})

// toc = await getFile(epub, 'ncx')
// toc = toc.toString()
// dom.window.document.body.innerHTML = toc
// dom.window.document.body.querySelector('navmap').outerHTML

function wrapNode(tag, value) { return `<${tag}>${value}</${tag}>` }

function addSentences(html) {
  dom.window.document.body.innerHTML = html;

  const elementNodeId = 1
  const textNodeId = 3

  // console.log(dom.window.document.body.innerHTML)

  // (function prettify(parent) {
  //   parent.childNodes.forEach(child => {
  //     if (child.nodeType === textNodeId) {
  //       child.nodeValue = child.nodeValue.trim()
  //     }
  //     else if(child.nodeType === elementNodeId) {
  //       prettify(child);
  //     }
  //   })
  // })(dom.window.document.body)

  function splitSentencesOnSentences(text) {
    var splitRetain = require('split-retain')
    return splitRetain(text, /(\.|,|;)/g)
  }
  // splitSentencesOnSentences('w1 w2')        // [ 'w1 w2' ]
  // splitSentencesOnSentences('w1 w2. w3 w4') // [ 'w1 w2.', ' w3 w4' ]

  (function splitOnSentencesAndWords(document, parent) {
    Array.from(parent.childNodes).forEach(child => {
      if (child.nodeType === textNodeId) {
        let text = child.nodeValue.trim()
        // console.log(text)
        // text = require("nodejieba").cut(text)
        // text = require("hanzi").segment(text)

        let sentences = splitSentencesOnSentences(text)
        // let sentences = text
        // console.log(sentences)

        sentences = sentences.map(x => {
          sentenceElement = document.createElement('sentence')
          sentenceElement.innerHTML = x
          return sentenceElement
        })

        child.replaceWith(...sentences)
        // parent.replaceChild(sentencesElement, child)
      }
      else if(child.nodeType === elementNodeId) {
        splitOnSentencesAndWords(document, child);
      }
    })
  })(dom.window.document, dom.window.document.body)

  // console.log(dom.window.document.body.innerHTML)

  return dom.window.document.body.innerHTML
}

// addSentences(html[8].html)
// addSentences("<div> 在经济大衰退袭来的20世纪30年代，约书亚陷入了金融危机。他无法偿还用来购买设备的银行贷款，导致5 000亩土地被查封。“从那时起，父亲不再相信银行，并且不再存钱。”斯科特·霍尔德曼说。他后来获得了和父亲同一所按摩学校的按摩师学位，并成为世界顶尖的脊柱病治疗专家。1934年，失去农场的约书亚开始四处漂泊，而几十年后自己的孙子也重复着这种生活。斯科特身高6英尺3英寸(约1.9米)，在成为一名按摩师之前，做过诸如建筑工人和牛仔竞技表演者等各种工作。</div>")

// htmlContent = html.map(x => ({
//   ...x,
//   html: x.html,
// }))

fixImagesSrc = x => {
  x = x.replace(/src="\.\.\/Images/ig, 'src="IMAGES')
  x = x.replace(/xlink\:href="\.\.\/Images/ig, 'xlink:href="IMAGES')
  x = x.replace(/src="Images/ig, 'src="IMAGES')
  x = x.replace(/xlink\:href="Images/ig, 'xlink:href="IMAGES')
  x = x.replace(/\.\.\/Text\/chapter\d\d\.xhtml#/g, '#')
  return x
}

htmlContent = html.map(x => ({
  ...x,
  htmlWithSentences: `<chapter>${fixImagesSrc(addSentences(x.html))}</chapter>`,
}))

cssHrefs = css.map(x => x.href.replace(/(OEBPS|OPS)\//g, ''))

fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/spanish/${dir}.json`, JSON.stringify({ title: epub.metadata.title, css: cssHrefs, toc: htmlContent.map(x => x.title).filter(Boolean), htmlContent: htmlContent.map(x => x.htmlWithSentences).join('\n') }))
htmlContent.forEach(({ title, htmlWithSentences }, index) => {
  fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/spanish/${dir}--${index + 1}.json`, JSON.stringify({ title: `${index + 1} | ${title}`, toc: [], css: cssHrefs, htmlContent: htmlWithSentences }))
})

dom.window.document.body.innerHTML = htmlContent.map(x => x.htmlWithSentences).join('\n')
elonMuskWords = R.uniq(Array.from(dom.window.document.body.querySelectorAll('sentence')).map(x => x.textContent).join(' ').toLowerCase().replace(/[?\.\-\—¿,;\:\d\)\(»«~_!@#$%^&*()\[\]\\\/,.?":;{}|<>=+\-`\'\”\“¡]/gi, ' ').split(' ').filter(x => x).sort()).filter(x => x.length > 2)

// html_ = `
// <!DOCTYPE HTML>
// <html>
//  <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title></title>
//   <meta name="referrer" content="no-referrer">
//   <link rel="stylesheet" href="list-of-sentences-common.css">
//   <script defer src="list-of-sentences-common.js"></script>
//  </head>
//  <body>
//   <div id="container">
//     <div id="body">
//     </div>
//     <footer>
//       <div id="currentSentence"></div>
//       <div class="controllers">
//         <audio controls id="tts-audio"></audio>
//       </div>
//     </footer>
//   </div>
//  </body>
// </html>
// `
// fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/spanish-don-quijote/index.html`, html_)

// --debug
// require("child_process").execSync('./node_modules/.bin/browserify html/spanish-don-quijote/main.js -o html/spanish-don-quijote/bundle.js')

// file = fs.readFileSync(`etimologias_cache--urls.json`).toString()
// file = fs.readFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/spanish-don-quijote.html`).toString()
// mydom = new JSDOM(file)
// clean(mydom.window.document.body)

// // colorize = ch => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${ch}</a>`
// colorize = ch => `<a target="_blank" href="/h.html#${ch}">${ch}</a>`
// colorizes = s => [...s].map(ch => isHanzi(ch) ? colorize(ch) : ch).join('')

// fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/spanish-don-quijote.html`, colorizes(mydom.serialize()))
