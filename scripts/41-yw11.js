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

// inputOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))
inputOrig = require('/home/srghma/projects/srghma-chinese/files/anki.json')
input = Object.keys(inputOrig)

const queueSize = 15
doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
output = []
promises = input.map((kanji, inputIndex) => async jobIndex => {
  // const kanji = x['kanji']
  console.log({ m: "doing", jobIndex, inputIndex, kanji })
  const dom = doms[jobIndex]
  if (!RA.isNonEmptyString(kanji)) { throw new Error('kanji') }
  if (!dom) { throw new Error('dom') }
  let translation = null
  try {
    translation = await require('./scripts/lib/yw11').yw11_dictionary_with_cache(dom, kanji)
  } catch (e) {
    console.error({ m: "error", jobIndex, inputIndex, kanji, e })
    output.push({ kanji, translation })
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

outputfixed = output.filter(x => x.translation).map(x => ({ ...x, translation: x.translation.replace(/http:\/\/www.chazidian.comhttps/g, 'https') }))
outputfixed = outputfixed.map(x => { return { ...x, images: R.uniq((Array.from(x.translation.matchAll(/<img src="(.*?)"/g)) || []).map(x => x[1])) } })

outputfixed = outputfixed.map(x => { return { ...x, images: x.images.filter(x => x.endsWith('.png')) } })
outputfixed = outputfixed.map(x => { return { kanji: x.kanji, translation: x.translation, image: x.images[0] } })
outputfixed = outputfixed.filter(x => x.image)

R.uniq(outputfixed.map(x => x.kanji)).length

// inputOrig['梵'].rendered
inputOrig__changed = []
inputOrig_ = R.mapObjIndexed((value, key) => {
  let rendered = value.rendered

  rendered = rendered.replace(/<a href="https:\/\/images.yw11.com\/zixing\/([^\.]+).png" target="_blank"><img src="yw11-zixing-([^\.]+).png"><\/a>/g, '<a href="https://images.yw11.com/zixing/$1.png" target="_blank"><object data="https://images.yw11.com/zixing/$1.png" type="image/png"><img src="yw11-zixing-$2.png"></object></a>')

  rendered = rendered.replace(/<a href="https:\/\/images.yw11.com\/zixing\/([^\.]+).png" target="_blank"><img src="yw11-zixing-([^\.]+).png" alt="([^"]+)"><\/a>/g, '<a href="https://images.yw11.com/zixing/$1.png" target="_blank"><object data="https://images.yw11.com/zixing/$1.png" type="image/png"><img src="yw11-zixing-$2.png"></object></a>')

  // if (rendered !== value.rendered) { console.log(rendered); throw new Error('') }
  if (rendered !== value.rendered) { inputOrig__changed.push(value.kanji) }
  return { ...value, rendered }
}, inputOrig)

// R.difference(R.uniq(outputfixed.map(x => x.kanji)), inputOrig__changed)
// R.difference(inputOrig__changed, R.uniq(outputfixed.map(x => x.kanji)))

// '做'
// '傲'
// '冲'
// '渚'
// '瀣'
// '田'
// '痨'
// '褚'
// '角'
// console.log(inputOrig_['赋'].rendered)
// outputfixed.filter(x => !inputOrig__changed.includes(x.kanji))

fs.writeFileSync('/home/srghma/projects/srghma-chinese/files/anki.json', JSON.stringify(inputOrig_, undefined, 4))

// R.values(inputOrig_).filter(x => x.rendered)

imagesAll = R.uniq(outputfixed.map(R.prop('images')).flat())

imagesAll_ = imagesAll.filter(x => x.endsWith('.png'))
imagesAll_ = imagesAll_.map(x => {
  const filename = x.replace(/https:\/\/images\.yw11\.com\/zixing\//g, 'yw11-zixing-')
  const dest = `/home/srghma/.local/share/Anki2/user2/collection.media/${filename}`
  return dest
}).filter(dest => fs.existsSync(dest))

files = fs.readdirSync('/home/srghma/.local/share/Anki2/user2/collection.media/')
files = files.filter(x => x.includes('yw11-zixing-zi') && x.includes('.png'))

const output_imagetexts__path = '/home/srghma/projects/anki-cards-from-pdf/image-texts.json'
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();
let output_imagetexts = {}
try { output_imagetexts = JSON.parse(fs.readFileSync(output_imagetexts__path).toString()) } catch (e) {  }

// Object.keys(output_imagetexts).length
// R.values(output_imagetexts)[100][0].description
// R.keys(output_imagetexts)[100]

promises = files.map((file, inputIndex) => async jobIndex => {
  if (output_imagetexts.hasOwnProperty(file)) { return }
  const dest = `/home/srghma/.local/share/Anki2/user2/collection.media/${file}`
  try {
    const results = await client.textDetection(dest)
    console.log(file)
    console.log(results)
    const [result] = results
    const detections = result.textAnnotations;
    const texts = []
    detections.forEach(text => {
      // console.log(text)
      texts.push(text)
    });
    console.log({ m: "finished", jobIndex, inputIndex, length: files.length })
    output_imagetexts[file] = texts
    fs.writeFileSync(output_imagetexts__path, JSON.stringify(output_imagetexts))
  } catch (e) {
    console.log(e)
  }
})
await mkQueue(10).addAll(promises)

R.toPairs(output_imagetexts).filter(x => x[1].length <= 0).map(R.prop(0)).forEach(x => {
  console.log(x)
  delete output_imagetexts[x]
})

imgWithDescr = R.toPairs(output_imagetexts).filter(x => x[1].length > 0).map(x => ({ k: x[0], d: x[1][0].description }))

let imgWithDescr__output = []
promises = imgWithDescr.map((x, index) => async jobIndex => {
  try {
    const translation = await require('./scripts/lib/google_translate_with_cache').google_translate_with_cache(x.d, { to: 'en' })
    imgWithDescr__output.push({
      ...x,
      translation,
    })
  } catch (e) {
    console.log(e)
  }
})
await mkQueue(10).addAll(promises)

require('./scripts/lib/google_translate_with_cache').google_translate_sync()

// require('child_process').spawn('convert', imagesAll_.concat(`/home/srghma/Downloads/output.pdf`))

// imagesAll_.forEach(x => {
//   const filename = x.replace(/https:\/\/images\.yw11\.com\/zixing\//g, 'yw11-zixing-')
//   const dest = `/home/srghma/.local/share/Anki2/user2/collection.media/${filename}`
//   if (!fs.existsSync(dest)) {
//     console.log(`doesnt ex ${dest}`)
//     return
//   }
//   const size = fs.statSync(dest).size
//   if (size === 0) {
//     console.log(filename)
//     fs.unlinkSync(dest)
//   }
// })

// images.filter(x => R.any(image => !image.startsWith('https://images.yw11.com/zixing/'), x.images))

function existsAsync(path) {
  return new Promise(function(resolve, reject){
    fs.exists(path, function(exists){
      resolve(exists);
    })
  })
}

// await mkdirp(fulldir)
promises = imagesAll.map(x => async jobIndex => {
  const filename = x.replace(/https:\/\/images\.yw11\.com\/zixing\//g, 'yw11-zixing-')
  const dest = `/home/srghma/.local/share/Anki2/user2/collection.media/${filename}`
  const exists = await existsAsync(dest)
  if (exists) { return }
  try {
    const resp = await require('image-downloader').image({ url: x, dest })
    console.log('Saved to', resp.filename)
    const size = fs.statSync(dest).size
    if (size === 0) {
      console.log('Deleting', dest)
      fs.unlinkSync(dest)
    }
  } catch (e) {
    console.log({ x, e })
  }
})
await mkQueue(10).addAll(promises)

output_ = outputfixed.map(x => ({
  kanji: x.kanji,
  translation: x.translation.replace(/>\s+</g, '><').trim().replace(/id="[^"]+"/g, '').replace(/<p><\/p>/g, '').replace(/　　　/g, ', ').replace('<br< p=""></br<></p>', '<br>').replace(/<img src="([^"]+)" alt="([^"]+)">/g, '<a href="$1" target="_blank"><img src="$1" alt="$2"></a>').replace(/src="https:\/\/images\.yw11\.com\/zixing\//g, 'src="yw11-zixing-').replace(/style="[^"]+"/g, '').replace(/class="[^"]+"/g, '').replace(/<h4\s+>/g, '<h4>').replace(/<(\S+)\s+>/g, '<$1>')
}))

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);

// allKanji = R.uniq(output___.map(x => (x.purpleculture_dictionary_orig_transl || '')).join('').split('').filter(isHanzi))
// fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', allKanji.join('\n'))

// output____ = output___.map(x => ({
//   ...x,
//   sounds: Array.from(x.pinyinWithHtml.matchAll(/allsetlearning-([^\.]+).mp3/g)).map(R.prop(1)).map(x => `[sound:allsetlearning-${x}.mp3]`).join('<br>')
// }))

imgWithDescr__output_ = R.fromPairs(imgWithDescr__output.map(x => ([x.k, x])))
output = inputOrig.map(({ kanji, _91 }) => {
  return {
    kanji,
    images: (Array.from(_91.matchAll(/<img src="(.*?)"/g)) || []).map(x => x[1]).filter(x => x.endsWith('.png'))[0]
  }
}).filter(x => x.images).map(x => ({ kanji: x.kanji, ...imgWithDescr__output_[x.images] })).filter(x => x.d).map(R.pick('kanji d translation'.split(' ')))
output = output.map(x => ({ kanji: x.kanji, d: x.d.replace(/\n/g, '<br>'), translation: x.translation.replace(/\n/g, '<br>') }))

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output);
