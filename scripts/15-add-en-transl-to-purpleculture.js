const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

const queueSize = 5
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })

output = []
promises = input.map((x, inputIndex) => async jobIndex => {
  const kanji = x['kanji']
  console.log({ m: "doing", inputIndex, jobIndex, kanji })
  const dom = doms[jobIndex]
  if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }
  if (!dom) { throw new Error('dom') }
  let translation = null
  try {
    translation = await require('./scripts/lib/purplecultre_dictionary').purplecultre_dictionary_with_cache(dom, kanji)
    console.log({ m: "finished", inputIndex, kanji })
  } catch (e) {
    console.error({ m: "error", inputIndex, kanji, e })
    return
  }
  if (translation) {
    console.log({ jobIndex, l: input.length })
    output.push({ kanji, translation })
  }
})

await mkQueue(queueSize).addAll(promises)

output_ = output.filter(R.identity).map(x => {
  const removeIf = (x) => x && x.remove()

  let translation = x.translation
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
  englishs = mapWithForEachToArray(dom.window.document.body.querySelectorAll('span.en'), x => x.textContent)

  dom.window.document.body.querySelectorAll('.pinyin').forEach(e => e.remove())
  dom.window.document.body.querySelectorAll('span.en').forEach(e => e.remove())

  if (pinyinsText.length !== pinyinsHTML.length || pinyinsHTML.length !== englishs.length) { throw new Error('adf') }

  pinyinWithHtml = R.zipWith((pinyinsHTML, englishs) => ({ pinyinsHTML, englishs }), pinyinsHTML, englishs)
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
    // orig_transl: x.translation,
    translation,
    hsk,
    examples: examples.join('<br>'),
    tree,
    img,
    pinyinWithHtml,
    pinyinWithoutMarks,
  }
})

const google_translate_cache = {}
async function google_translate_with_cache(input, to) {
  if (!google_translate_cache[to]) { google_translate_cache[to] = {} }
  const google_translate_cache_to = google_translate_cache[to]
  const x = google_translate_cache_to[input]
  if (x) { return x }
  const translation = await translate.translate(input, to)
  google_translate_cache_to[input] = translation
  return translation
}

output__ = []
promises = output_.map((x, index) => async jobIndex => {
  if (x.pinyinWithHtml.length == 0) {
    output__.push(x)
    return
  }

  let translationInput = x.pinyinWithHtml.map(x => x.englishs).join('\n')
  translation = await google_translate_with_cache(translationInput, 'ru')
  translation = translation[0].split('\n')
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

await mkQueue(10).addAll(promises)

output___ = output__.map(x => {
  pinyinWithHtml = x.pinyinWithHtml.map(x => {
    img_src = require('any-ascii')(x.pinyinsText)

    return `
<div class="my-pinyin-image-container pinyin-mnemonic-${img_src}"><span></span><img></img></div>
<div class="my-pinyin-tone">${x.pinyinsHTML}</div>
<div class="my-pinyin-english">${x.englishs}</div>
<div class="my-pinyin-ru">${x.ru}</div>
`
  }).join('<br>')

  translation = x.translation
    .replace(new RegExp('<b>English Definition: </b>', 'g'), '')
    .replace(new RegExp('style="line-height:1.6"', 'g'), '')
    .replace(new RegExp('id="sen0"', 'g'), '')
    .replace(new RegExp(`<ruby class="mainsc">${x.kanji}</ruby>`, 'g'), '')
    .replace(new RegExp(` class="d-flex"`, 'g'), '')
    .replace(new RegExp(`<br><br>`, 'g'), '')
    .replace(/<li class="pt-2">[^<]*<\/li>/g, '')
    .replace(/<ul style="[^"]*"><\/ul>/g, '')

  return {
    kanji:              x.kanji,
    translation,
    hsk:                x.hsk,
    examples:           x.examples,
    tree:               x.tree,
    img:                x.img,
    pinyinWithHtml,
    // pinyinWithoutMarks: x.pinyinWithoutMarks,
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output___);
