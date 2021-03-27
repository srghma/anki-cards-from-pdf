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
const svg2img = require('svg2img')
const btoa = require('btoa')
const mkdirp = require('mkdirp')

function svg2img_promised(svgString) {
  return new Promise(function(resolve, reject) {
    svg2img(svgString, function(error, buffer) {
      if (error) { reject(error) }
      resolve(buffer)
    })
  })
}


allKanjiOrig = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: "kanji _1 _2".split(" ") })))
allKanjiOrig_ = allKanjiOrig.map(x => {
  const f = x => x.replace(' style="padding-top:30px; "', '').replace('<br style="clear:left; ">', '').replace(' class="isection wiki_class"', '').replace(/&nbsp; <\/div>$/, '').replace(/^<div> /, '')
  const _1 = f(x._1)
  const _2 = f(x._2)
  return { kanji: x.kanji, _1, _2  }
})

;(function(input){
  const s = input.map(x => Object.values(x).join('\t')).join('\n')
  // const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  // const s = require('csv-writer').createObjectCsvStringifier({ header, fieldDelimeter: ";" }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(allKanjiOrig_);

images = allKanjiOrig.map(R.prop('hanziyan')).map(x => {
  return Array.from(x.matchAll(/#(\w+), #\w+ { background-image: url\('(data:image[^']+)'\) }/g)).map(x => ({ name: x[1], data: x[2] }))
}).flat()
images = R.groupBy(R.prop('name'), images)
images = R.map(R.map(R.prop('data')), images)
images = R.map(R.uniq, images)
images = R.map((x) => {
  if (x.length !== 1) { throw new Error('asdf') }
  return x[0]
}, images)

// output_dir_path = '/home/srghma/Downloads/output-images'
// await mkdirp(output_dir_path)
// promises = R.toPairs(images).map(([ name, data ]) => async jobIndex => {
//   try {
//     const buffer = await svg2img_promised(data)
//     const path = `${output_dir_path}/${name}.png`
//     await require('fs').promises.writeFile(path, buffer)
//     console.log('Saved to ', path)
//   } catch (e) {
//     console.log({ name, data, e })
//   }
// })
// await mkQueue(30).addAll(promises)

allKanjiOrig_ = allKanjiOrig.map(x => {
  let hanziyan = x.hanziyan
  if (!hanziyan) { return null }
  hanziyan = hanziyan.replace(/#\w+, #\w+ { background-image: url\('data:image[^']+'\) }/g, '')
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
  const array = [
    '甲骨文',
    '甲骨文',
    '没有已知的甲骨文',
    '金文',
    '没有已知的金文',
    '说文解字的篆字',
    '没有已知的说文解字的篆字',
    '六书通的字',
    '没有已知的六书通的字',
    '有已知的',
    '应用规则',
    '异体规则说明',
    '异体规则',
    '简化规则说明',
    'Oracle characters (0)',
    'Bronze characters (0)',
    'Seal characters (0)',
    'Liushutong characters (0)',
    'There is no known oracle characters found. .',
    'There is no known bronze characters found. .',
    'There is no known seal characters found. .',
    'There is no known Liushutong characters found. .',
    'There is no known Liushutong characters found. 没.',
    'aria-hidden="true"',
    'glyphicon-edit',
    'glyphicon-modal-window',
    'glyphicon-book',
    'glyphicon-list-alt',
    'glyphicon-share-alt',
    'glyphicon ',
    'Not applicable.',
    '留言',
    '报错',
    '异体规则说明',
    '简化规则',
    '异体规则',
    '应用规则',
    '简化规则说明',
    '新字形规则',
    'Report issue /',
    'Help: Simplification of Chinese character',
    'https://dixin.github.io/Etymology/simplification-of-chinese-character',
    'https://github.com/Dixin/Etymology/issues/new',
    'btn btn-warning btn-xs ladda-button',
    '<p>.</p>',
    '<span></span>',
    '[?]',
    `<a target="_blank"></a>`,
    `<p class="pre-inline"><b>Simplification rule explained </p>`,
    `<p class="pre-inline"><br></p>`,
    `<span class="glyphicon-ok"></span>`,
  ]
  array.forEach(x => { hanziyan = hanziyan.replace(new RegExp(escapeRegExp(x), 'g'), '') })
  hanziyan = hanziyan.replace(/>\s+</g, '><')
  hanziyan = hanziyan.replace(/" >/g, '">')
  hanziyan = hanziyan.replace(/\s+\/>/g, '/>')
  hanziyan = hanziyan.replace(/\s+>/g, '>')
  hanziyan = hanziyan.replace(/<style type="text\/css">\s*<\/style>/g, '')
  hanziyan = hanziyan.replace(/href="\s*"/g, '')
  hanziyan = hanziyan.replace(/title="\s*"/g, '')
  hanziyan = hanziyan.replace(/class="\s*"/g, '')
  hanziyan = hanziyan.replace(/\s+/g, ' ')
  array.forEach(x => { hanziyan = hanziyan.replace(new RegExp(escapeRegExp(x), 'g'), '') })
  hanziyan = hanziyan.replace(/<div id="etymology(\w+)">\w+<\/div>/g, '<img src="hanziyan-$1.png"/>')
  return { kanji: x.kanji, hanziyan }
}).filter(R.identity)

;(function(input){
  const s = input.map(x => Object.values(x).join('\t')).join('\n')
  // const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  // const s = require('csv-writer').createObjectCsvStringifier({ header, fieldDelimeter: ";" }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(allKanjiOrig_);
