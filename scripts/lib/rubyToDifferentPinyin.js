const convertToRuTable = require('./processPurpleculture').convertToRuTable

function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

function rubyToDifferentPinyin(dom, type, subtype, text) {
  text = text.replace(/<span class="singlebk">/g, 'SPACEHERERERE<span class="singlebk">')
  text = text.split('').filter(x => !isHanzi(x)).join('')

  dom.window.document.body.innerHTML = text

  removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-vowel'))
  removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-consonant'))
  removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-location'))
  removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-human'))
  removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-numbered'))
  removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-bopomofo'))
  removeAllNodes(dom.window.document.querySelectorAll('.tooltips-ipa'))

  if (type == 'ru') { removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-marked')) }
  if (type == 'en') { removeAllNodes(dom.window.document.querySelectorAll('span.pinyin-ru')) }

  let s = dom.window.document.body.textContent.trim().replace(/ /g, '')

  // console.log(s)

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

exports.rubyToDifferentPinyin = rubyToDifferentPinyin
