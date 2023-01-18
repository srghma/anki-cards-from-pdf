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

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji", "freq" ] })))
input = input.filter(x => !x._88)
unprocessed_kanji = input.map(x => x.kanji).join('')

// ;(function(input){
//   const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
//   const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
//   fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
// })(input.map(x => ({ old: x.kanji, new: x.kanji.trim() })));

console.log("\nfullinput = JSON.parse('" + JSON.stringify(unprocessed_kanji) + "').split('')")

// input_ = input.filter(x => x.length > 1).map(x => x.trim())

// https://stackoverflow.com/questions/11849562/how-to-save-the-output-of-a-console-logobject-to-a-file

(function(console){

console.save = function(data, filename){

    if(!data) {
        console.error('Console.save: No data')
        return;
    }

    if(!filename) filename = 'console.json'

    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
 }
})(console)

console.save(JSON.stringify(output, null, 2))

function splitEvery(n, list) {
  if (n <= 0) {
    throw new Error('First argument to splitEvery must be a positive integer');
  }
  var result = [];
  var idx = 0;
  while (idx < list.length) {
    result.push(list.slice(idx, idx += n));
  }
  return result;
}

input = splitEvery(1000, fullinput)

output = {}
stop_ = false

// // breakpoint on
// ().get("Bronze");
// // to find function d
// req = d

function req(x) {
  return fetch(`https://zi.tools/api/zi/${encodeURIComponent(x)}`, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "ru,en-US;q=0.9,en;q=0.8",
      "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"102\", \"Google Chrome\";v=\"102\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Linux\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin"
    },
    "referrer": "https://zi.tools/zi/%E9%9F%B3",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
  })
}
// input.forEach(async currentInput => {
for (let i = 0; i < input.length; i++) {
  const kanji = input[i].trim()
  if (stop_) {
    console.log({ m: "stopping", kanji, i })
    break
  }
  // window.localStorage.getItem(kanji, JSON.stringify(person));
  if (localStorage.hasOwnProperty(kanji)) {
    console.log({ m: "already processed", kanji, i })
    continue
  }
  let res = null
  try {
    res = await req(kanji)
  } catch (e) {
    console.error({ kanji, i, e })
    window.localStorage.setItem(kanji, '')
    // output[kanji] = null
    continue
  }
  console.log({ kanji, res, i, l: input.length })
  window.localStorage.setItem(kanji, JSON.stringify(res))
  // output[kanji] = res
}
// })

/////////////////////

// mv /home/srghma/Downloads/console.json /home/srghma/projects/anki-cards-from-pdf/.hanziyan-output.json
(
  r = R.toPairs(require('/home/srghma/projects/anki-cards-from-pdf/.hanziyan-output.json')).map(x => ({ i: x[0], o: x[1] })),
  undefined
)

r_ = RA.compact(R.map(
  ({ i, o }) => {
    if (o.includes('Found <strong>0</strong> etymologies')) { return null }
    o = o.replace(/<strong>[^<]+<\/strong>: Found <strong>[^<]+<\/strong> etymologies and <strong>[^<]+<\/strong> characters in <strong>[^<]+<\/strong> seconds./g, '')
    o = o.replace(/<span class="label label-success">E[^<]+<\/span>/g, '')
    o = o.replace(/\s+/g, ' ')
    o = o.replace(/data-\w+="[^"]+"/g, "")
    o = o.replace(/<button type="button" class="btn btn-default btn-xs"\s*><span class="glyphicon glyphicon-search" aria-hidden="true"><\/span>[^<]+<\/button>/g, "")
    const images = Array.from(o.matchAll(/#(\w+), #\w+ { background-image: url\('(data:image[^']+)'\) }/g)).map(x => ({ name: x[1], data: x[2] }))
    return { i, o, images }
  },
  r.filter(x => x.o)
))

images = r_.map(x => x.images).flat()
images = R.groupBy(R.prop('name'), images)
images = R.map(R.map(R.prop('data')), images)
images = R.map(R.uniq, images)
images = R.map((x) => {
  if (x.length !== 1) { throw new Error('asdf') }
  return x[0]
}, images)

function svg2img_promised(svgString) {
  return new Promise(function(resolve, reject) {
    svg2img(svgString, function(error, buffer) {
      if (error) { reject(error) }
      resolve(buffer)
    })
  })
}

// cd /home/srghma/Downloads/output-images/
// for f in *; do "cp" --force "$f" "/home/srghma/.local/share/Anki2/user2/collection.media/hanziyan-$f"; done

output_dir_path = '/home/srghma/Downloads/output-images'
await mkdirp(output_dir_path)
promises = R.toPairs(images).map(([ name, data ]) => async jobIndex => {
  try {
    const buffer = await svg2img_promised(data)
    const path = `${output_dir_path}/${name}.png`
    await require('fs').promises.writeFile(path, buffer)
    console.log('Saved to ', path)
  } catch (e) {
    console.log({ name, data, e })
  }
})
await mkQueue(30).addAll(promises)

invalid = r_.map(x => ({ i: x.i, o: x.o })).filter(x => x.o >= 131072)
if (invalid.length > 0) { throw new Error('asdf') }

r_.find(x => x.i == '嗀')
r__.find(x => x.i == '嗀')

r__ = r_.map(x => {
  let hanziyan = x.o
  // if (!hanziyan) { return null }
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
    'There is no known oracle characters found. 没.',
    'There is no known bronze characters found. 没.',
    'There is no known seal characters found. 没.',
    'There is no known Liushutong characters found. 没.',
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
    '[?]',
    `<a target="_blank"></a>`,
    `<p class="pre-inline"><b>Simplification rule explained </p>`,
    `<p class="pre-inline"><br></p>`,
    `<span class="glyphicon-ok"></span>`,
  ]
  array.forEach(x => { hanziyan = hanziyan.replace(new RegExp(escapeRegExp(x), 'g'), '') })
  hanziyan = hanziyan.replace(/>\s+</g, '><')
  hanziyan = hanziyan.replace(/>\s+</g, '><')
  hanziyan = hanziyan.replace(/" >/g, '">')
  hanziyan = hanziyan.replace(/\s+\/>/g, '/>')
  hanziyan = hanziyan.replace(/\s+>/g, '>')
  hanziyan = hanziyan.replace(/<style type="text\/css">\s*<\/style>/g, '')
  hanziyan = hanziyan.replace(/href="[^"]*"/g, '')
  hanziyan = hanziyan.replace(/title="[^"]*"/g, '')
  hanziyan = hanziyan.replace(/class="[^"]*"/g, '')
  hanziyan = hanziyan.replace(/role="[^"]*"/g, '')
  hanziyan = hanziyan.replace(/\s+/g, ' ')
  array.forEach(x => { hanziyan = hanziyan.replace(new RegExp(escapeRegExp(x), 'g'), '') })
  hanziyan = hanziyan.replace(/<div id="etymology(\w+)">\w+<\/div>/g, '<img src="hanziyan-$1.png"/>')
  hanziyan = hanziyan.trim()

  hanziyan = hanziyan.replace(/id="[^"]+"/g, '')
  hanziyan = hanziyan.replace(/>\s+</g, '><')
  hanziyan = hanziyan.replace(/>\s+</g, '><')
  hanziyan = hanziyan.replace(/" >/g, '">')
  hanziyan = hanziyan.replace(/\s+\/>/g, '/>')
  hanziyan = hanziyan.replace(/\s+>/g, '>')
  hanziyan = hanziyan.replace(/<(\w+)><\/\1>/g, '')
  hanziyan = hanziyan.replace(/<(\w+)><\/\1>/g, '')
  hanziyan = hanziyan.replace(/<a target="_blank"><\/a>/g, '')

  return { kanji: x.i, hanziyan }
}).filter(R.identity)

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(r__);
