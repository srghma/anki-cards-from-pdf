#!/usr/bin/env node
'use strict';

const express = require('express')
const path = require('path')
const serveStatic = require('serve-static')
const R = require('ramda')
const isHanzi = require('../scripts/lib/isHanzi')

var arrayOfValuesToObject = ({ arrayOfKeysField, valueField, array }) => {
  const buffer = {}
  array.forEach(arrayElement => {
    arrayElement[arrayOfKeysField].forEach(key => {
      if (buffer.hasOwnProperty(key)) { throw new Error(key) }
      buffer[key] = arrayElement[key]
    })
  })
}

var hanziToJson = async (object) => {
  const json = object.values().forEach(text => {
    const hanzi = R.uniq([...text].filter(isHanzi)).sort()
  })

}

var ruPinyinObject = arrayOfValuesToObject({
  arrayOfKeysField: "hanzi",
  valueField: "text",
  array: require('./ru-pinyin.json')
})

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

  app.get('/h', (req, res) => {
    console.log(req.query)
    res.send('asdfadf')
  })

  app.use(serveStatic(path.join(__dirname)))
  app.use(serveStatic(path.join(__dirname, '..', 'fonts')))
  app.use(serveStatic('/home/srghma/.local/share/Anki2/User 1/collection.media'))
  app.listen(34567)
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
