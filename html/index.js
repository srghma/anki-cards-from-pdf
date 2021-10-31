#!/usr/bin/env node
'use strict';

const express = require('express')
const path = require('path')
const serveStatic = require('serve-static')
const R = require('ramda')
const isHanzi = require('../scripts/lib/isHanzi').isHanzi


const dbPath = `/home/srghma/projects/anki-cards-from-pdf/html/ru-pinyin`

let ruPinyinArray = require('fs').readFileSync(dbPath).toString().split(/―{4,}|-{4,}/).map(R.trim)

let ruPinyinObjectCache = null

const arrayOfValuesToObject = ({ arrayOfKeysField, valueField, array }) => {
  const buffer = {}
  const duplicateKeys = []

  array.forEach(arrayElement => {
    arrayElement[arrayOfKeysField].forEach(key => {
      if (buffer.hasOwnProperty(key)) { duplicateKeys.push(key) }
      buffer[key] = arrayElement[valueField]
    })
  })

  if (duplicateKeys.length > 0) { throw new Error(`duplicateKeys: ${JSON.stringify(R.uniq(duplicateKeys))}`) }

  return buffer
}

function recomputeCacheAndThrowIfDuplicate(ruPinyinArray_) {
  const hanziThatAreNotKeys = ["𣥠","𣡦","𠤬","𠦍","𠤕","𥎨","𠤗","𠨮"]

  ruPinyinObjectCache = arrayOfValuesToObject({
    arrayOfKeysField: "hanzi",
    valueField: "text",
    array: ruPinyinArray_.map(text => ({
      text,
      hanzi: R.uniq([...text].filter(isHanzi).filter(key => !hanziThatAreNotKeys.includes(key))),
    }))
  })
}

recomputeCacheAndThrowIfDuplicate(ruPinyinArray)

// console.log(ruPinyinObjectCache)

// const sqlite3 = require('sqlite3')
// const sqlite = require('sqlite')

// this is a top-level await
;(async () => {
  // // open the database
  // const db = await sqlite.open({
  //   filename: '/tmp/database.db',
  //   driver: sqlite3.Database
  // })

  // await db.migrate({
  //   force: true,
  //   migrationsPath: path.join(__dirname, '..', 'migrations')
  // })

  const app = express()
  app.use(express.json())

  app.get('/hanzi-info', (req, res) => {
    // console.log(req.query)
    const text = ruPinyinObjectCache[req.query.hanzi]
    if (text === '') { throw new Error() }
    res.send(text || '')
  })

  let hanziInfoWriteMutex = false
  app.post('/hanzi-info', async (req, res) => {
    console.log(req.body)

    const oldText = R.trim(req.body.oldText)
    const newText = R.trim(req.body.newText)

    if (oldText === newText) {
      throw new Error('nothing to do')
    }

    if (hanziInfoWriteMutex) {
      throw new Error('mutex')
    }
    hanziInfoWriteMutex = true

    let addToEnd = true
    let ruPinyinArray_ = ruPinyinArray.map(text => {
      text = R.trim(text)

      if (text === oldText) {
        text = newText
        addToEnd = false
      }

      return text
    })

    if (addToEnd) {
      ruPinyinArray_.push(newText)
    }

    ruPinyinArray_ = ruPinyinArray_.filter(Boolean).sort()

    recomputeCacheAndThrowIfDuplicate(ruPinyinArray_)

    ruPinyinArray = ruPinyinArray_

    await require('fs/promises').writeFile(dbPath, ruPinyinArray.join('\n\n----\n\n') + '\n')

    hanziInfoWriteMutex = false

    res.send({ message: "Saved" })
  })

  app.use(serveStatic(path.join(__dirname)))
  app.use(serveStatic(path.join(__dirname, '..', 'fonts')))
  app.use(serveStatic('/home/srghma/.local/share/Anki2/User 1/collection.media'))
  app.listen(34567)

  console.log("Listening")
})();


// html_ = `
// <!DOCTYPE HTML>
// <html>
//  <head>
//   <meta charset="utf-8">
//   <title>${epub.metadata.title}</title>
//   <meta name="referrer" content="no-referrer">
//   ${css.map(x => `<link rel="stylesheet" href="${x}">`).join('\n')}
//   <link rel="stylesheet" href="style.css">
//   <script src="https://cdn.jsdelivr.net/npm/canvas-drawing-board@latest/dist/canvas-drawing-board.js"></script>
//   <script defer src="bundle.js"></script>
//  </head>
//  <body>
//   <div id="container">
//     <div id="body">
//       <div>${toc}</div>
//       ${htmlContent}
//     </div>
//     <footer>
//       <div id="app" style="position: relative; width: 100%; height: 600px"></div>
//       <div id="currentSentence"></div>
//       <div id="currentSentenceTraditional"></div>
//       <div class="controllers">
//         <audio controls id="tts-audio" />
//         <div class="buttons">
//           <button id="pleco">Pleco</button>
//         </div>
//       </div>
//     </footer>
//   </div>
//  </body>
// </html>
// `
