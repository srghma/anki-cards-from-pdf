// ./node_modules/.bin/babel-node --config-file ./babel.config.js scripts/40-pdf-with-sounds-for-notes.js
const R = require('ramda')
const PDFDocument = require('pdfkit');
const fs = require('fs');
// import React from 'react'
// import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'
// import ReactPDF from '@react-pdf/renderer'

const tOrig = fs.readFileSync('./table-with-tabs.txt').toString()
const tOrigLines = tOrig.split('\n')
const splitLine = line => R.split('\t', line).flat().flat()
const sections = tOrigLines.filter(R.identity).map(line => ({ sectionLetter: line.trim()[0], pinyins: splitLine(line).filter(R.identity) }))

// Create a document
const doc = new PDFDocument({
  bufferPages: true,
  size: 'A3',
  layout: 'landscape',
  margins: { top: 0, left: 0, bottom: 0, right: 0 },
});
const { outline } = doc;

// Pipe its output somewhere, like to a file or HTTP response
// See below for browser usage
doc.pipe(fs.createWriteStream(`${process.cwd()}/chinese-table-of-sounds.pdf`));

// doc.page.layout = 'landscape'
// doc.page.margins = { top: 0, left: 0, bottom: 0, right: 0 }
// const A3Size = [841.89, 1190.55]
// doc.page.width = A3Size[0]
// doc.page.height = A3Size[1]
// doc.page.size = 'A3'
// console.log(doc.page)

let x = tOrigLines.map(splitLine)
x = x.slice(0, x.length - 1)
let l = Math.max(...R.map(R.prop('length'), x))
let rowToLength = R.range(0, l).map(i => {
  const x1 = x.map(R.prop(i))
  const x2 = x1.map(R.prop('length'))
  const x3 = Math.max(...x2)
  return x3
  // return {
  //   x1,
  //   x2,
  //   x3
  // }
})
tOrigLines.map(splitLine).forEach((line, lineIndex) => {
  doc.addNamedDestination('root');
  line.forEach((pinyin, pinyinIndex) => {
    const prevRowsLengths = rowToLength.slice(0, pinyinIndex)
    const indentationChars = R.sum(prevRowsLengths) + prevRowsLengths.length
    const top = 30 * lineIndex
    const right = indentationChars * 6.5
    console.log({
      top,
      right,
      pinyin,
      prevRowsLengths,
      indentationChars,
    })
    doc
      .font('fonts/PalatinoBold.ttf')
      .fontSize(13)
      .text(pinyin, right, top, {
        goTo: pinyin
      });
  })
})


const addPageOptions = {
  size: 'A4',
  layout: 'portrait',
  margins: { top: 0, left: 0, bottom: 0, right: 0 }
}
doc.addPage(addPageOptions)

sections.forEach(({ sectionLetter, pinyins }, sIndex) => {
  const top = outline.addItem(sectionLetter);

  pinyins.forEach((pinyin, pinyinIndex) => {
    doc.addNamedDestination(pinyin);

    doc
      .font('fonts/PalatinoBold.ttf')
      .fontSize(13)
      .text(pinyin, 10, 10, {
        goTo: "root"
      });

    const types = "ˉ ´ ˉ `".split(' ')

    types.forEach((type, pinyinIndex) => {
      doc
        .font('fonts/PalatinoBold.ttf')
        .fontSize(20)
        .text(type, 70 + 150 * pinyinIndex, 30, {
          goTo: "root"
        });
    })

    // const isFirstPage = pinyinIndex == 0
    const isSLastPage = sIndex == sections.length - 1
    const isLastPage = pinyinIndex == pinyins.length - 1

    top.addItem(pinyin);

    if (!(isSLastPage && isLastPage)) {
      doc.addPage(addPageOptions)
    }
  })
})
doc.flushPages()
doc.end();
