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

require('hanzi').start()
require("nodejieba").load()

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

var epub = new EPub("elon-musk.epub", "/imagewebroot/", "/articlewebroot/")

const parseResult = await parse(epub)

console.log(parseResult)
console.log("METADATA:\n")
console.log(epub.metadata)

console.log("\nSPINE:\n")
console.log(epub.flow)

console.log("\nTOC:\n")
console.log(epub.toc)

data = await getFile(epub, epub.spine.contents[2].id)

image = await getImage(epub, 'x001.jpg')

output = '/home/srghma/projects/anki-cards-from-pdf/html/elon-musk'

// R.toPairs(epub.manifest).forEach(async ([id, data]) => {
//   if (data['media-type'] !== 'image/jpeg') { return }
//   const image = await getImage(epub, id)
//   const outputPath = `${output}/${data.href.replace('OEBPS/', '')}`
//   await (require('mkdirp'))(require('path').dirname(outputPath))
//   // console.log(path)
//   await require('fs/promises').writeFile(outputPath, image.data)
// })

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

  const outputPath = `${output}/${data.href.replace('OEBPS/', '')}`.replace('.xhtml', '.html')
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
  const outputPath = `${output}/${data.href.replace('OEBPS/', '')}`
  await (require('mkdirp'))(require('path').dirname(outputPath))
  console.log(outputPath, data.css)
  await require('fs/promises').writeFile(outputPath, data.css)
})

// toc = await getFile(epub, 'ncx')
// toc = toc.toString()
// dom.window.document.body.innerHTML = toc
// dom.window.document.body.querySelector('navmap').outerHTML

toc = html.map(x => x.title).filter(Boolean).map(x => '<li>' + x + '</li>').join('\n')
toc = '<ul>' + toc + '</ul>'

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

  function wrapNode(tag, value) { return `<${tag}>${value}</${tag}>` }

  function splitOnSentences(text) {
    let sentences = []
    let currentSentence = []
    text.forEach(({ allHanzi, word }, index) => {
      // const word_ = allHanzi ? wrapNode('word', word) : word
      currentSentence.push(word)
      if ('。？！'.includes(word) || index === text.length - 1) {
        // console.log(currentSentence)
        sentences.push(currentSentence.join(''))
        currentSentence = []
      }
    })
    return sentences
  }

  (function splitOnSentencesAndWords(document, parent) {
    Array.from(parent.childNodes).forEach(child => {
      if (child.nodeType === textNodeId) {
        let text = child.nodeValue.trim()
        // text = require("nodejieba").cut(text)
        // text = require("hanzi").segment(text)
        text = [...text]
        text = text.map(word => {
          const allHanzi = R.all(isHanzi, [...word])
          return { allHanzi, word }
        })

        let sentences = splitOnSentences(text)
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

htmlContent = html.map(x => '<chapter>' + addSentences(x.html) + '</chapter>').join('\n').replace(/src="\.\.\/Images/g, 'src="Images').replace(/\.\.\/Text\/chapter\d\d\.xhtml#/g, '#')

html_ = `
<!DOCTYPE HTML>
<html>
 <head>
  <meta charset="utf-8">
  <title>${epub.metadata.title}</title>
  ${css.map(x => `<link rel="stylesheet" href="${x.href.replace('OEBPS/', '')}">`).join('\n')}
  <link rel="stylesheet" href="style.css">
 </head>
 <body class="nightMode Site">
  <div class="content Site-content">
    <div>${toc}</div>
    ${htmlContent}
  </div>
  <div class="player">
    <button class="prev">Prev</button>
    <button class="replay">Replay</button>
    <button class="next">Next</button>
  </div>
</div>
</div>
 </body>
</html>
`
fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/elon-musk/index.html`, html_)

// file = fs.readFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/elon-musk.html`).toString()
// mydom = new JSDOM(file)
// clean(mydom.window.document.body)

// // colorize = ch => `<a target="_blank" href="plecoapi://x-callback-url/s?q=${ch}">${ch}</a>`
// colorize = ch => `<a target="_blank" href="/h.html#${ch}">${ch}</a>`
// colorizes = s => [...s].map(ch => isHanzi(ch) ? colorize(ch) : ch).join('')

// fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/elon-musk.html`, colorizes(mydom.serialize()))
