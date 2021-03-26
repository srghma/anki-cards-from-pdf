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

input = require('/home/srghma/projects/anki-cards-from-pdf/hanzi-su.json')
input_ = {}
R.mapObjIndexed((v, k) => {
  if (!input_[k]) { input_[k] = {} }
  input_[k].wiki = v
}, input.wiki)
R.mapObjIndexed((v, k) => {
  if (!input_[k]) { input_[k] = {} }
  input_[k].slide = v
}, input.slide)
R.keys(input_).length

output = R.toPairs(input_).map(([kanji, { wiki, slide }]) => {
  function extractSection(x) {
    if (!x) { return null }
    dom.window.document.body.innerHTML = x
    let r = dom.window.document.body.querySelector('#section').innerHTML.replace(/\t/g, '').trim()
    if (r.includes('Заданный иероглиф в базе отсутствует')) { return null }
    r = r.replace(/(src|href)="\//g, '$1="http://hanzi.su/')
    return r
  }
  function extractImages(x) {
    if (!x) { return [] }
    dom.window.document.body.innerHTML = x
    const y = mapWithForEachToArray(dom.window.document.body.querySelectorAll('img'), node => { return node.src })
    // console.log({ y })
    return y
  }
  wiki = extractSection(wiki)
  slide = extractSection(slide)
  const images = R.concat(extractImages(wiki), extractImages(slide))
  return {
    kanji,
    wiki,
    slide,
    images,
  }
})

images = R.uniq(R.map(R.prop('images'), output).flat()).map(img => ({ src: img, filename: 'hanzisu' + decodeURI(img).replace('http://hanzi.su/data', '').replace(/[\.\/]/g, '-').replace('-png', '.png') }))

await mkdirp(fulldir)
promises = images.map(x => async jobIndex => {
  const extname = path.extname(x.src)
  try {
    const resp = await require('image-downloader').image({ url: x.src, dest: `/tmp/images/${x.filename}` })
    console.log('Saved to', resp.filename)
  } catch (e) {
    console.log({ x, e })
  }
})

await mkQueue(30).addAll(promises)

imageSrcs = R.concat([], images.map(R.prop('filename')))

output_ = output.map(x => {
  function extractImages(x) {
    if (!x) { return [] }
    dom.window.document.body.innerHTML = x
    const y = mapWithForEachToArray(dom.window.document.body.querySelectorAll('img'), node => { return node.src })
    // console.log({ y })
    return y
  }
  const f = x => {
    if (!x) { return '' }
    images.forEach(({ src, filename }) => {
      x = x.replace(new RegExp(decodeURI(src), 'g'), filename)
    })
    const srcs = extractImages(x)
    const diff = R.difference(srcs, imageSrcs)
    if (diff.length > 0) {
      console.log({ x, srcs, diff })
      throw new Error('adf')
    }
    return x
  }
  return { kanji: x.kanji, wiki: f(x.wiki), slide: f(x.slide) }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
