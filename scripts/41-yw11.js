const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const removeHTML = require('./scripts/lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./scripts/lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./scripts/lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))

const queueSize = 10
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
output = []
promises = input.map((x, inputIndex) => async jobIndex => {
  const kanji = x['kanji']
  // console.log({ m: "doing", inputIndex, jobIndex, kanji })
  const dom = doms[jobIndex]
  if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }
  if (!dom) { throw new Error('dom') }
  let translation = null
  try {
    translation = await require('./scripts/lib/yw11').yw11_dictionary_with_cache(dom, kanji)
  } catch (e) {
    console.error({ m: "error", inputIndex, kanji, e })
    return
  }
  if (translation) {
    console.log({ m: "finished", jobIndex, inputIndex, length: input.length })
    output.push({ kanji, translation })
  }
})
mkQueue(queueSize).addAll(promises)
input.length
output.length

outputfixed = output.map(x => ({ ...x, translation: x.translation.replace(/http:\/\/www.chazidian.comhttps/g, 'https') }))
outputfixed = outputfixed.map(x => { return { ...x, images: (Array.from(x.translation.matchAll(/<img src="(.*?)"/g)) || []).map(x => x[1]) } })

imagesAll = R.uniq(outputfixed.map(R.prop('images')).flat())

// images.filter(x => R.any(image => !image.startsWith('https://images.yw11.com/zixing/'), x.images))

// await mkdirp(fulldir)
promises = imagesAll.map(x => async jobIndex => {
  const filename = x.replace(/https:\/\/images\.yw11\.com\/zixing\//g, 'yw11-zixing-')
  const dest = `/home/srghma/.local/share/Anki2/User 1/collection.media/${filename}`
  if (fs.existsSync(dest)) { return }
  try {
    const resp = await require('image-downloader').image({ url: x, dest })
    console.log('Saved to', resp.filename)
  } catch (e) {
    console.log({ x, e })
  }
})
await mkQueue(10).addAll(promises)

output_ = outputfixed.map(x => ({
  kanji: x.kanji,
  translation: x.translation.replace(/>\s+</g, '><').trim().replace(/id="[^"]+"/g, '').replace(/https:\/\/images\.yw11\.com\/zixing\//g, 'yw11-zixing-')
}))

// allKanji = R.uniq(output___.map(x => (x.purpleculture_dictionary_orig_transl || '')).join('').split('').filter(isHanzi))
// fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', allKanji.join('\n'))

// output____ = output___.map(x => ({
//   ...x,
//   sounds: Array.from(x.pinyinWithHtml.matchAll(/allsetlearning-([^\.]+).mp3/g)).map(R.prop(1)).map(x => `[sound:allsetlearning-${x}.mp3]`).join('<br>')
// }))

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
