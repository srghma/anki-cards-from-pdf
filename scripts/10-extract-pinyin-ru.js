const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const convertToRuTable = require('./scripts/lib/processPurpleculture').convertToRuTable

function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

function isHanzi(ch) {
  const REGEX_JAPANESE = /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
  const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;

  const isSpecialChar = "。？！，".includes(ch)
  const isJapanese = REGEX_JAPANESE.test(ch)
  const isChinese = REGEX_CHINESE.test(ch)
  const isHanzi = !isSpecialChar && (isJapanese || isChinese)

  return isHanzi
}

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: [ "id", "p_e_m", "p_e_n", "p_r_m", "p_r_n", "h", "ruby" ] })))

const dom = new JSDOM(``);

function exWithRemoving(type, subtype, text) {
  text = text.replace(/<span class="singlebk">/g, 'SPACEHERERERE<span class="singlebk">')
  text = text.split('').filter(x => !isHanzi(x)).join('')

  dom.window.document.body.innerHTML = text

  if (type == 'ru') { removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-marked')) }
  if (type == 'en') { removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-ru')) }

  let s = dom.window.document.body.textContent.trim().replace(/ /g, '')

  console.log(s)

  s = s.replace(/SPACEHERERERE/g, ' ').replace(/\ +/g, ' ').trim()

  if (type == 'ru') {
    if (subtype == 'marked') {
      s = s
          .replace(/¹/g, '-')
          .replace(/²/g, 'ˊ')
          .replace(/³/g, 'ˇ')
          .replace(/⁴/g, 'ˋ')
          .replace(/⁵/g, '')
    }
    if (subtype == 'numbered') {
      s = s
          .replace(/¹/g, '1')
          .replace(/²/g, '2')
          .replace(/³/g, '3')
          .replace(/⁴/g, '4')
          .replace(/⁵/g, '')
    }
  }

  if (type == 'en') {
    if (subtype == 'marked') { }
    if (subtype == 'numbered') {
      // yīgè xīngqīwǔ de· shàngwǔ ， tiānqì hěnhǎo 。

      const convertToRuTable_ = R.pipe(
        R.sortBy(x => x.marked.length),
        R.reverse
      )(convertToRuTable)

      for (let { numbered, marked } of convertToRuTable_) {
        // `<span class="pinyin-numbered">${numbered}</span>`
        const regexpr = new RegExp(marked, 'g')
        s = s.replace(regexpr, numbered)
      }
    }
    if (subtype == 'cased') {
      // yīgè xīngqīwǔ de· shàngwǔ ， tiānqì hěnhǎo 。

      const convertToRuTable_ = R.pipe(
        R.sortBy(x => x.marked.length),
        R.reverse
      )(convertToRuTable)

      for (let { marked, cased } of convertToRuTable_) {
        // `<span class="pinyin-numbered">${numbered}</span>`
        const regexpr = new RegExp(marked, 'g')
        s = s.replace(regexpr, cased)
      }
    }
  }

  return s
}

// text = input[0].ruby
// exWithRemoving('ru', 'marked', text)
// exWithRemoving('ru', 'numbered', text)
// exWithRemoving('en', 'marked', text)
// exWithRemoving('en', 'numbered', text)
// exWithRemoving('en', 'cased', text)

input = input.map(x => {
  return {
    id: x.id,
    ruby: x.ruby,
  }
})

input.forEach(x => {
  x.ru_marked = exWithRemoving('ru', 'marked', x.ruby)
  x.ru_numbered = exWithRemoving('ru', 'numbered', x.ruby)
  x.en_marked = exWithRemoving('en', 'marked', x.ruby)
  x.en_numbered = exWithRemoving('en', 'numbered', x.ruby)
  x.en_cased = exWithRemoving('en', 'cased', x.ruby)

  delete x.ruby
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input);
