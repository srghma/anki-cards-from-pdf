const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')

content = fs.readFileSync('/home/srghma/Downloads/The_Origin_of_Chinese_Characters_An_Illustrated_History_and_Word.txt').toString()

content_ = content.split('\n\n\n').map(x => x.trim()).filter(x => x != '')

function isHanzi(ch) {
  const REGEX_JAPANESE = /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
  const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;

  const isSpecialChar = "。？！".includes(ch)
  const isJapanese = REGEX_JAPANESE.test(ch)
  const isChinese = REGEX_CHINESE.test(ch)
  const isHanzi = !isSpecialChar && (isJapanese || isChinese)

  return isHanzi
}

hanzi = content.split('').filter(isHanzi)
hanzi = [...new Set(hanzi)]

h = hanzi.map(h => {
  sentences = content_.filter(s => s.includes(h))

  sentences = sentences.map(s => {
    if (s.length > 1500) {
      return s.split('\n\n').map(x => x.trim()).filter(x => x != '').filter(s => s.includes(h))
    } else {
      return s
    }
  }).flat()

  sentences = sentences.map(x => x.trim()).join('\n\n--------------------\n\n').replace(h, "<b>" + h + "</b>")

  return {
    h,
    sentences
  }
})

await require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/Chinese Grammar Wiki2.txt', header:  ["h", "sentences"].map(x => ({ id: x, title: x })) }).writeRecords(h)
