#!/usr/bin/env node
'use strict';

const express = require('express')
const path = require('path')
const serveStatic = require('serve-static')
const R = require('ramda')
const isHanzi = require('../scripts/lib/isHanzi').isHanzi
const splitBySeparator = require('../scripts/lib/splitBySeparator').splitBySeparator
const TongWen = require('../scripts/lib/TongWen').TongWen
const hanzi = require("hanzi");
//Initiate
hanzi.start();

// const { JSDOM } = jsdom;
// const dom = new JSDOM(``);

require("child_process").execSync(`${__dirname}/../node_modules/.bin/browserify ${__dirname}/list-of-sentences-common.js -o ${__dirname}/list-of-sentences-common-bundle.js`)

function recomputeCacheAndThrowIfDuplicate(ruPinyinArray) {
  const hanziThatAreNotKeys = ["𣥠","𣡦","𠤬","𠦍","𠤕","𥎨","𠤗","𠨮"]

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

  return arrayOfValuesToObject({
    arrayOfKeysField: "hanzi",
    valueField: "text",
    array: ruPinyinArray.map(text => ({
      text,
      hanzi: R.uniq([...(removeLinks(text))].filter(isHanzi).filter(key => !hanziThatAreNotKeys.includes(key))),
    }))
  })
}

const removeLinks = x => x.replace(/<link>[^<]*<\/link>/g, '')

const db = (function () {
  const dbPath = `${__dirname}/ru-pinyin`

  return {
    getKeys: () => {
      let ruPinyinArray = require('fs').readFileSync(dbPath).toString().split(/―{4,}|-{4,}/).map(R.trim)
      let ruPinyinObjectCache = recomputeCacheAndThrowIfDuplicate(ruPinyinArray)
      return Object.keys(ruPinyinObjectCache)
    },
    getHanziInfo: (hanzi) => {
      let ruPinyinArray = require('fs').readFileSync(dbPath).toString().split(/―{4,}|-{4,}/).map(R.trim)
      let ruPinyinObjectCache = recomputeCacheAndThrowIfDuplicate(ruPinyinArray)
      const text = ruPinyinObjectCache[hanzi]
      return text
    },
    setInstead: async ({ oldText, newText }) => {
      let ruPinyinArray = require('fs').readFileSync(dbPath).toString().split(/―{4,}|-{4,}/).map(R.trim)

      const getHanziStr = text => {
        return R.uniq([...text].filter(isHanzi)).sort().join('')
      }

      const oldTextHanzi = getHanziStr(oldText)

      let success = false
      if (oldText === '') {
        ruPinyinArray.push(newText)
        success = true
      } else {
        ruPinyinArray = ruPinyinArray.map(text => {
          text = R.trim(text)
          const textHanzi = getHanziStr(text)

          if (textHanzi === oldTextHanzi) {
            text = newText
            success = true
          }

          return text
        })
      }

      if (!success) {
        throw new Error(`oldText is not found. reload`)
      }

      const removeTrailingWhitespace = x => x.split('\n').map(x => x.trim()).join('\n').trim()

      ruPinyinArray = ruPinyinArray.filter(Boolean).sort().map(removeTrailingWhitespace)

      recomputeCacheAndThrowIfDuplicate(ruPinyinArray)

      await require('fs/promises').writeFile(dbPath, ruPinyinArray.join('\n\n----\n\n') + '\n')
    },
  }
})();

;(async () => {
  /////////////////////////////////////////
  let allPeppaFiles = await require('fs/promises').readdir(`${__dirname}/peppa`)
  allPeppaFiles = allPeppaFiles.filter(x => x.endsWith('.json')).map(basename => { // xxxx.json
    // console.log(basename)
    // let basename = require('path').basename(filePath) // xxxx.json
    let absolutePath = `${__dirname}/peppa/${basename}`
    let name = require('path').parse(basename).name // xxxx

    const url = `/peppa/${name}.html`

    const allHtmlFilesOfCurrent = allPeppaFiles.filter(x => x.endsWith('.html') && x.startsWith(name)).map(x => x.replace('.html', '').replace(`${name}.`, ''))
    // console.log({ allHtmlFilesOfCurrent, name })

    // let englishFilename = allHtmlFilesOfCurrent.find(x => x === 'en-GB' || x === 'en')
    // let everythingFilename = allHtmlFilesOfCurrent.find(x => x === 'zh-CN' || x === 'zh-HK')

    // console.log({
    //   englishFilename,
    //   everythingFilename,
    //   name
    // })

    return {
      allHtmlFilesOfCurrent,
      name,
      basename,
      absolutePath,
      url,
    }
  })

  /////////////////////////////////////////

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
            <audio controls id="baidu-tts-audio"></audio>
            <audio controls id="google-tts-audio"></audio>
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

  let harariContent = await require('fs/promises').readFile('/home/srghma/Downloads/未来简史-by-哈拉瑞Yuval-Noah-Harari_-林俊宏-_z-lib.org_.txt')
  harariContent = harariContent.toString()

  let hskContent = await require('fs/promises').readFile('/home/srghma/Downloads/hsk')
  hskContent = hskContent.toString()
  // console.log(hskContent)

  app.get('/elon-musk/unknown-hanzi', async (req, res) => {
    const setOfKnownHanzi = db.getKeys()

    let allPeppaFiles_ = Promise.all(allPeppaFiles.map(async x => {
      const hanzi = await require('fs/promises').readFile(x.absolutePath)
      return {
        ...x,
        hanzi,
      }
    }))

    allPeppaFiles_ = await allPeppaFiles_

    allPeppaFiles_ = allPeppaFiles_.map(x => {
      return {
        ...x,
        hanzi: R.uniq([...(x.hanzi.toString())].filter(isHanzi)),
      }
    })

    let allPeppaHanzi = allPeppaFiles_.map(x => x.hanzi).flat()
    // allPeppaHanzi = R.uniq(allPeppaHanzi)

    let allElonHanzi = require('./elon-musk/index.json').htmlContent
    allElonHanzi = [...allElonHanzi].filter(isHanzi)
    // allElonHanzi = R.uniq(allElonHanzi)

    let allHarariHanzi = [...harariContent].filter(isHanzi)
    // allHarariHanzi = R.uniq(allHarariHanzi)

    let allHskHanzi = [...hskContent].filter(isHanzi)
    // allHskHanzi = R.uniq(allHskHanzi)
    // console.log(allHarariHanzi)

    // const hanzi = R.difference(allElonHanzi, R.uniq([...setOfKnownHanzi, ...allPeppaHanzi]))

    let allHanzi = R.difference(R.uniq([
      ...allHskHanzi,
      ...allElonHanzi,
      ...allPeppaHanzi,
      ...allHarariHanzi
    ]), setOfKnownHanzi)

    let allHanziWithPinyin = allHanzi.map(x => {
      return {
        x,
        p: ((hanzi.getPinyin(x) || [])[0] || '').toLowerCase()
      }
    })

    // console.log(allHanziWithPinyin)
    allHanziWithPinyin = R.groupBy(R.prop('p'), allHanziWithPinyin)
    allHanziWithPinyin = R.toPairs(allHanziWithPinyin)
    allHanziWithPinyin = R.sortBy(R.prop(0), allHanziWithPinyin)

    const html = `<!DOCTYPE HTML>
    <html>
     <body>
     <ul>
      ${allHanzi.length}
      ${allHanziWithPinyin.map(([p, hanzis]) => {
        hanzis = hanzis.map(({ x }) => `<a target="_blank" href="/h.html#${x}">${x}</a>`)
        return `<p>${p}</p>${hanzis}`
      }).join('<br>')}
      </ul>
     </body>
    </html>
    `
    res.header('Content-Type', 'text/html').send(html)
  })

  app.get('/elon-musk/index.html', (req, res) => {
    // const knownHanzi = db.getKeys()
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

  app.get(`/peppa`, async (req, res) => {
    const allKnown = db.getKeys()

    let allPeppaFiles_ = Promise.all(allPeppaFiles.map(async x => {
      const hanzi = await require('fs/promises').readFile(x.absolutePath)
      return {
        ...x,
        hanzi,
      }
    }))

    allPeppaFiles_ = await allPeppaFiles_

    allPeppaFiles_ = allPeppaFiles_.map(x => {
      return {
        ...x,
        hanzi: R.uniq([...(x.hanzi.toString())].filter(isHanzi)),
      }
    })

    const links = allPeppaFiles_.map(x => {
      const allHtmlFilesOfCurrent = x.allHtmlFilesOfCurrent.map(enOrZh => `<a target="_blank" href="/peppa/${x.name}.${enOrZh}.html">${enOrZh}</a>`).join('&nbsp;&nbsp;&nbsp;')

      const hanzi = R.difference(x.hanzi, allKnown)

      return `<li><a target="_blank" href="${x.url}">${x.name}</a>&nbsp;&nbsp;&nbsp;(${allHtmlFilesOfCurrent})&nbsp;&nbsp;&nbsp;${hanzi.map(x => `<a target="_blank" href="/h.html#${x}">${x}</a>`)}</li>`
    }).join('\n')

    let allPeppaHanzi = allPeppaFiles_.map(x => {
      return x.hanzi
    }).flat()
    allPeppaHanzi = R.uniq(allPeppaHanzi)

    const html = `<!DOCTYPE HTML>
    <html>
     <body>
     <ul>
      ${R.difference(allPeppaHanzi, allKnown).length}
      <br>
      ${links}
      </ul>
     </body>
    </html>
    `
    res.header('Content-Type', 'text/html').send(html)
  })

  allPeppaFiles.map(({ basename, absolutePath, name, url }) => {
    app.get(url, (req, res) => {
      const setOfKnownHanzi = new Set(db.getKeys())
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
    res.send(db.getKeys())
  })

  app.get('/hanzi-info', (req, res) => {
    // console.log(req.query)
    const text = db.getHanziInfo(req.query.hanzi)
    if (text === '') { throw new Error() }
    res.send(text || '')
  })

  let hanziInfoWriteMutex = false
  app.post('/hanzi-info', async (req, res) => {
    // console.log(req.body)

    const oldText = R.trim(req.body.oldText)
    const newText = R.trim(req.body.newText)

    if (oldText === newText) {
      res.send({ error: "(Server) Nothing to do" })
      return
    }

    if (hanziInfoWriteMutex) {
      res.send({ error: "(Server) Mutex" })
      return
    }

    hanziInfoWriteMutex = true
    try {
      await db.setInstead({ oldText, newText })
    } catch (error) {
      res.send({ error: `(Server) ${error.message}` })
      return
    } finally {
      hanziInfoWriteMutex = false
    }

    res.send({ message: "(Server) Saved" })
  })

  app.use(serveStatic(path.join(__dirname)))
  app.use(serveStatic(path.join(__dirname, '..', 'fonts')))
  app.use(serveStatic('/home/srghma/.local/share/Anki2/user2/collection.media'))
  app.listen(34567)

  console.log("Listening")
})();
