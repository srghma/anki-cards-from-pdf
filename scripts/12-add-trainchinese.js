const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

const dom = new JSDOM(``);

async function mymapper(x) {
  const kanji = x

  if(!kanji) { throw new Error('') }

  let transl = null
  try {
    transl = await require('./scripts/lib/trainchinese').trainchinese(dom, kanji)
    // console.log({ kanji, transl })
  } catch (e) {
    console.error({ kanji, e })
  }

  return {
    kanji,
    transl
  }
}

// output = []
// ;(async function(input){
//   for (let i = 0; i < input.length; i++) {
//     const res = await mymapper(input[i])

//     fs.appendFileSync('trainchinesecache.json', JSON.stringify(res))

//     output.push(res)

//     console.log({ i, l: input.length })
//   };
// })(other);

output = JSON.parse("[" + fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/trainchinesecache.json').toString().replace(/}{/g, "},{") + "]")
output = output.filter(x => x.transl)
output = R.uniqBy(x => x.sentence, output)

function processTrainchineseTransl(x) {
  const transl = x.transl
  if (RA.isNilOrEmpty(transl)) { throw new Error('transl') }
  const kanji = x.kanji
  if (RA.isNilOrEmpty(kanji)) { throw new Error('kanji') }

  dom.window.document.body.innerHTML = transl

  const buff = []
  dom.window.document.body.querySelectorAll('div.chinese').forEach(chNode => {
    const ch = chNode.textContent.trim().split('').filter(isHanzi).join('')

    if (ch.length > 1) {
      // console.log({ ch, chl: ch.length, kanji: kanji.length })
      return
    }

    const pinyin = chNode.nextSibling.nextSibling.textContent.trim()

    if (RA.isNilOrEmpty(pinyin)) { throw new Error('pinyin') }

    const typeAndTransl__Node = chNode.nextSibling.nextSibling.nextSibling.nextSibling

    if (RA.isNilOrEmpty(typeAndTransl__Node)) { throw new Error('typeAndTransl__Node') }

    const transl__ = typeAndTransl__Node.querySelector('span').textContent.trim()

    typeAndTransl__Node.querySelector('span').remove()

    const type = typeAndTransl__Node.textContent.trim()

    if (RA.isNilOrEmpty(transl__)) { throw new Error('transl') }
    if (RA.isNilOrEmpty(type)) { throw new Error('type') }

    buff.push({
      pinyin,
      transl: transl__,
      type,
    })
  })

  if (RA.isNilOrEmpty(buff)) {
    // console.log(x)
    // throw new Error('buff')
    return null
  }

  return {
    kanji,
    trasl: buff.map(x => {
      const pinyin = '<span class="trainchinese-pinyin">' + x.pinyin + '</span>'
      const type = '<span class="trainchinese-type">' + x.type + '</span>'
      const transl_____ = '<span class="trainchinese-transl">' + x.transl + '</span>'

      const res = pinyin + ': (' + type + ') ' + transl_____
      return res
    }).join('\n<br/>\n')
  }
}

// processTrainchineseTransl(x)

output_ = output.map(processTrainchineseTransl).filter(R.identity)

// kanjimore = input.map(R.prop('kanji')).filter(x => x.length > 1).map(x => x.split('')).flat()
// kanjimore = kanjimore.filter(isHanzi)
// kanjimore = R.uniq(kanjimore)
// inputkanji = input.map(R.prop('kanji'))
// kanjimore.filter(x => !inputkanji.includes(x)).length
// checkDuplicateKeys(knownkanji)

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
)(output_);