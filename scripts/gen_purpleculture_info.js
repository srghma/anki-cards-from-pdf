const readStreamArray = require('./lib/readStreamArray').readStreamArray
const removeHTML = require('./lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./lib/isHanzi').isHanzi
const mkQueue = require('./lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const nodeWith = require('./lib/nodeWith').nodeWith
toNumberOrNull = str => { if (!str) { return null }; var num = parseFloat(str); if (isFinite(num)) { return num; } else { return null; }; }
checkSameLength = (x, y) => { if (x.length != y.length) { throw new Error(`x.length (${x.length}) != y.length (${y.length})`) } }
zipOrThrowIfNotSameLength = (x, y) => { checkSameLength(x, y); return R.zip(x, y); }

async function gen_purpleculture_info(input) {
  const queueSize = 1
  doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
  output = []
  promises = input.map(({ kanji, purpleculture_dictionary_orig_transl }, inputIndex) => async jobIndex => {
    if (purpleculture_dictionary_orig_transl) {
      output.push({ kanji, translation: purpleculture_dictionary_orig_transl })
      return
    }

    // console.log({ m: "doing", inputIndex, jobIndex, kanji })
    const dom = doms[jobIndex]
    if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }
    if (!dom) { throw new Error('dom') }
    let translation = null
    try {
      translation = await require('./lib/purpleculture_dictionary').purpleculture_dictionary_with_cache(dom, kanji)
    } catch (e) {
      console.error({ m: "error", inputIndex, kanji, e })
      return
    }
    if (translation) {
      // console.log({ m: "finished", jobIndex, inputIndex, length: input.length })
      output.push({ kanji, translation })
    }
  })
  await mkQueue(queueSize).addAll(promises)

  output_ = output.filter(R.identity).map(x => {
    const removeIf = (x) => x && x.remove()
    let translation = x.translation
      .replace(/\/mp3\//g, 'allsetlearning-')
      .replace(/(href|src)="\//g, '$1="https://www.purpleculture.net/')
      .replace(/<div class="swordlist"><b>More: <\/b>.*?<\/div>/g, '')
      .replace(/<div><b>Example Words: <\/b><\/div>/g, '')
      .replace(/<div><b>English Definition: <\/b><\/div>/g, '')
      .replace(/<b>Pinyin: <\/b>/g, '')
      .replace(new RegExp('<div><b>Character Formation:</b></div>', 'g'), '')
      .replace(new RegExp('href="javascript:"', 'g'), '')
      .replace(new RegExp('title="loading..."', 'g'), '')
      .replace(new RegExp('title="Loading..."', 'g'), '')

    img = translation.match(/<br><img src="(.*?)" alt="Stroke order image for.*?>/)
    img = img && img[1]

    dom.window.document.body.innerHTML = translation

    const hskNode = dom.window.document.body.querySelector('label.hskbadge')
    const hsk = hskNode && hskNode.textContent.trim().replace(/HSK /, '')
    if (hskNode) { hskNode.remove() }

    const examples = mapWithForEachToArray(dom.window.document.body.querySelectorAll('.swordlist'), x => x.innerHTML)
    dom.window.document.body.querySelectorAll('.swordlist').forEach(e => e.remove())

    const treeNode = dom.window.document.body.querySelector('.tree')
    const tree = treeNode && treeNode.outerHTML
    if (treeNode) { treeNode.remove() }

    // elements.forEach(e => { e.remove() })
    // dom.window.document.body.querySelectorAll('.swordlist')

    pinyinsHTML = mapWithForEachToArray(dom.window.document.body.querySelectorAll('.pinyin'), x => x.outerHTML)
    pinyinsText = mapWithForEachToArray(dom.window.document.body.querySelectorAll('.pinyin'), x => x.textContent.trim())
    english = mapWithForEachToArray(dom.window.document.body.querySelectorAll('span.en'), x => x.textContent)

    dom.window.document.body.querySelectorAll('.pinyin').forEach(e => e.remove())
    dom.window.document.body.querySelectorAll('span.en').forEach(e => e.remove())

    if (pinyinsText.length !== pinyinsHTML.length || pinyinsHTML.length !== english.length) { throw new Error('adf') }

    pinyinWithHtml = R.zipWith((pinyinsHTML, english) => ({ pinyinsHTML, english }), pinyinsHTML, english)
    pinyinWithHtml = R.zipWith((obj, pinyinsText) => ({ ...obj, pinyinsText }), pinyinWithHtml, pinyinsText)

    pinyinWithoutMarks = R.uniq(pinyinsText.map(require('any-ascii')))

    removeIf(dom.window.document.body.querySelector('#char_ani_block'))
    removeIf(dom.window.document.body.querySelector('.charstr'))
    removeIf(dom.window.document.body.querySelector('#stroke_tool'))
    dom.window.document.body.querySelectorAll('.btn-group').forEach(e => e.remove())

    translation = dom.window.document.body.innerHTML
      .replace(/<br><img src=".*?" alt="Stroke order image for.*?>/g, '')
      .replace(new RegExp('<div class="py-2"><b>Step by Step Stroke Sequence:</b></div>', 'g'), '')
      .replace(new RegExp('<div style="line-height: 1.6;"></div>', 'g'), '')
      .replace(new RegExp('<div class="clearBoth"></div>', 'g'), '')

    return {
      kanji: x.kanji,
      purpleculture_dictionary_orig_transl: x.translation,
      translation,
      hsk,
      examples: examples.join('<br>'),
      tree,
      img,
      pinyinWithHtml,
      pinyinWithoutMarks,
    }
  })

  output__ = []
  promises = output_.map((x, index) => async jobIndex => {
    if (x.pinyinWithHtml.length == 0) {
      output__.push(x)
      return
    }
    const dom = doms[jobIndex]
    let translationInput = x.pinyinWithHtml.map(x => x.english).map(x => x || '++++++++').join('\n')

    if (!translationInput) { return }

    translationInput = removeHTML(dom, translationInput)

    translation = await require('./lib/google_translate_with_cache').google_translate_with_cache(translationInput, { to: 'ru' })
    // translation = translation[0]
    translation = translation.split('\n')
    translation = translation.map(x => x.trim())
    translation = translation.filter(x => x != '')
    if (translation.length !== x.pinyinWithHtml.length) {
      console.log({
        m: 'error',
        ru_translation: translation,
        ...x
      })
      output__.push(x)
      return
      // throw new Error(`${translation.length} != ${x.pinyinWithHtml.length}`)
    }
    const pinyinWithHtml = R.zipWith((pinyinWithHtmlEl, ru) => ({ ...pinyinWithHtmlEl, ru }), x.pinyinWithHtml, translation)
    // console.log({ m: 'finished', index, from: output_.length })
    output__.push({
      ...x,
      pinyinWithHtml,
    })
  })
  await mkQueue(queueSize).addAll(promises)

  require('./lib/google_translate_with_cache').google_translate_sync()

  // R.fromPairs(R.sortBy((x) => x[1], R.toPairs(pinyin)))
  // errors.sort()

  // R.fromPairs([...convertToRuTable_, ].map(x => [x, pinyin_[x]]))

  output___ = output__.map(x => {
    const markHelp = x => {
      if (!x) { return '' }
      x = removeHTML(dom, x)
      x = x.trim().replace(/\[(\w+)\]/g, '<span class="purpleculture-english__pinyin-info">[$1]</span>')
      x = x.split('').map(x => {
        if (isHanzi(x)) { return `<span class="purpleculture-english__pinyin-info">${x}</span>` }
        return x
      }).join('')
      return x
    }

    // max is 5 - Math.max(...output____.map(x => x.sounds.length))
    let pinyinWithHtml = x.pinyinWithHtml.map((pinyinWithHtmlElem, i) => {
      const pinyinWithNumber = purplecultureMarkedToNumbered(x, pinyinWithHtmlElem.pinyinsText)
      const pinyin = pinyinWithNumber.replace(/\d+/g, '')
      const pinyinNumber = pinyinWithNumber.replace(/\D+/g, '')
      const sound = `allsetlearning-${pinyinWithNumber}.mp3`
      // <div class="my-pinyin-sound">[sound:${sound}]</div>
      const translation = `
        <div class="my-pinyin-image-container pinyin-${pinyin} pinyin-number-${pinyinNumber}"><span></span><img><img></div>
        <div class="my-pinyin-tone">${pinyinWithHtmlElem.pinyinsHTML}</div>
        <div class="my-pinyin-english">${markHelp(pinyinWithHtmlElem.english)}</div>
        <div class="my-pinyin-ru">${markHelp(pinyinWithHtmlElem.ru)}</div>
        `.replace(/>\s+</g, '><').trim()

      return { [`translation${i}`]: translation, [`sound${i}`]: `[sound:${sound}]` }
    })

    // pinyinWithHtml = pinyinWithHtml.join('<br>')
    const info = x.translation
      .replace(new RegExp('<b>English Definition: </b>', 'g'), '')
      .replace(new RegExp('style="line-height:1.6"', 'g'), '')
      .replace(/id="sen\d"/g, '')
      .replace(/<ruby class="[^"]+">[^<]+<\/ruby>/g, '')
      .replace(new RegExp(` class="d-flex"`, 'g'), '')
      .replace(new RegExp(`<br><br>`, 'g'), '')
      .replace(/<(\w+) >/g, '<$1>')
      .replace(new RegExp(`<div></div>`, 'g'), '')
      .replace(/<li class="pt-2">[^<]*<\/li>/g, '')
      .replace(/<ul style="[^"]*"><\/ul>/g, '')

    return {
      kanji:              x.kanji,
      purpleculture_dictionary_orig_transl: x.purpleculture_dictionary_orig_transl,
      info,
      hsk:                x.hsk,
      examples:           x.examples,
      tree:               x.tree,
      img:                x.img && `<img src="${x.img}">`,
      ...(R.mergeAll(pinyinWithHtml))
    }
  })

  return output___
}


exports.gen_purpleculture_info = gen_purpleculture_info
