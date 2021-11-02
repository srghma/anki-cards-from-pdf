#!/usr/bin/env node
'use strict';

const express = require('express')
const path = require('path')
const serveStatic = require('serve-static')
const R = require('ramda')
const isHanzi = require('../scripts/lib/isHanzi').isHanzi
const splitBySeparator = require('../scripts/lib/splitBySeparator').splitBySeparator
const TongWen = require('../scripts/lib/TongWen').TongWen

require("child_process").execSync('./node_modules/.bin/browserify html/list-of-sentences-common.js -o html/list-of-sentences-common-bundle.js')

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

  function render(html) {
    return `<!DOCTYPE HTML>
    <html>
     <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${html.title}</title>
      <meta name="referrer" content="no-referrer">
      ${html.css.map(x => `<link rel="stylesheet" href="${x}">`).join('\n')}
      <link rel="stylesheet" href="index.css">
      <link rel="stylesheet" href="../list-of-sentences-common.css">
      <script src="https://cdn.jsdelivr.net/npm/canvas-drawing-board@latest/dist/canvas-drawing-board.js"></script>
      <script defer src="../list-of-sentences-common-bundle.js"></script>
     </head>
     <body>
      <div id="container">
        <div id="body">
          ${html.body}
        </div>
        <footer>
          <div id="app" style="position: relative; width: 100%; height: 300px"></div>
          <div id="currentSentence"></div>
          <div id="currentSentenceTraditional"></div>
          <div class="controllers">
            <audio controls id="tts-audio"></audio>
            <div class="buttons">
              <button id="clear-canvas">Clear</button>
              <button id="pleco">Pleco</button>
            </div>
          </div>
        </footer>
      </div>
     </body>
    </html>
    `
  }

  app.get('/elon-musk/index.html', (req, res) => {
    const knownHanzi = Object.keys(ruPinyinObjectCache)
    let html = require('./elon-musk/index.json')

    let htmlContent = html.htmlContent

    const body = `
    <div><ul>${html.toc.map(x => '<li>' + x + '</li>').join('\n')}</ul></div>
    ${htmlContent}
    `

    res.header('Content-Type', 'text/html').send(render({
      title: html.title,
      css: html.css,
      body
    }))
  })

  const files = await require('fs/promises').readdir(`${__dirname}/peppa`)
  files.filter(x => x.endsWith('.json')).forEach(basename => { // xxxx.json
    // console.log(basename)
    // let basename = require('path').basename(filePath) // xxxx.json
    let absolutePath = `${__dirname}/peppa/${basename}`
    let name = require('path').parse(basename).name // xxxx

    app.get(`/peppa/${name}.html`, (req, res) => {
      const setOfKnownHanzi = new Set(Object.keys(ruPinyinObjectCache))
      let html = require(absolutePath)
      const body = `
      <div>${html.map(subtitle => {
        let separators = "？！，。。《》"
        separators = [...separators]

        subtitle = subtitle.split('\n').map(subtitle => {
          subtitle = [...subtitle]
          // console.log(subtitle)
          subtitle = splitBySeparator(x => separators.includes(x), subtitle)
          // console.log(subtitle)

          subtitle = subtitle.map(text => {
            const colorizer = ch => {
              const isKnown = setOfKnownHanzi.has(ch)
              return isKnown ? `<span class="known-hanzi">${ch}</span>` : ch
            }

            text = [...text].map(ch => isHanzi(ch) ? colorizer(ch) : ch).join('')

            return '<sentence>' + text + '</sentence>'
          }).join('')
          return subtitle
        }).join('<br>')

        return '<div class="subtitle">' + subtitle + '</div>'
      }).join('\n')}</div>
      `
      res.header('Content-Type', 'text/html').send(render({
        title: name,
        css: [],
        body
      }))
    })
  })

  app.get('/list-of-known-hanzi', (req, res) => {
    res.send(Object.keys(ruPinyinObjectCache))
  })

  app.get('/hanzi-info', (req, res) => {
    // console.log(req.query)
    const text = ruPinyinObjectCache[req.query.hanzi]
    if (text === '') { throw new Error() }
    res.send(text || '')
  })

  let hanziInfoWriteMutex = false
  app.post('/hanzi-info', async (req, res) => {
    // console.log(req.body)

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

    const removeTrailingWhitespace = x => x.split('\n').map(x => x.trim()).join('\n').trim()

    ruPinyinArray_ = ruPinyinArray_.filter(Boolean).sort().map(removeTrailingWhitespace)

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
