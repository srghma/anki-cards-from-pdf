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

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/01 NihongoShark.com_ Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji", "freq" ] })))

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input.map(x => ({ old: x.kanji, new: x.kanji.trim() })));

console.log("\ninput = JSON.parse('" + JSON.stringify(input.map(x => x.kanji)) + "')")

output = {}
stop_ = false

// input_ = input.filter(x => x.length > 1).map(x => x.trim())

// https://stackoverflow.com/questions/11849562/how-to-save-the-output-of-a-console-logobject-to-a-file
console.save(JSON.stringify(output, null, 2))

;(async function() {
  const input = fullinput.slice(4000, 5000)
  for (let i = 0; i < input.length; i++) {
    const kanji = input[i].trim()

    if (stop_) {
      console.log({ m: "stopping", kanji, i })
      break
    }

    const ret = output[kanji]

    console.log({ kanji, ret, i, l: input.length })

    if (ret) {
      console.log({ m: "already processed", kanji, i, ret })
      continue
    }

    let res = null
    try {
      res = await req(kanji)
    } catch (e) {
      console.error({ kanji, i, e })
      continue
    }

    console.log({ kanji, res, i, l: input.length })

    output[kanji] = res
  };
})();

/////////////////////

(
  r = R.toPairs(require('/home/srghma/projects/anki-cards-from-pdf/.hanziyan-output.json')).map(x => ({ i: x[0], o: x[1] })),
  undefined
)

r_ = RA.compact(R.map(
  ({ i, o }) => {
    if (o.includes('Found <strong>0</strong> etymologies')) {
      return null
    }
    o = o.replace(/<strong>[^<]+<\/strong>: Found <strong>[^<]+<\/strong> etymologies and <strong>[^<]+<\/strong> characters in <strong>[^<]+<\/strong> seconds./g, '')
    o = o.replace(/<span class="label label-success">E[^<]+<\/span>/g, '')
    o = o.replace(/\s+/g, ' ')
    o = o.replace(/data-\w+="[^"]+"/g, "")
    o = o.replace(/<button type="button" class="btn btn-default btn-xs"\s*><span class="glyphicon glyphicon-search" aria-hidden="true"><\/span>[^<]+<\/button>/g, "")

    let allImages = Array.from(o.matchAll(/#(\w+), #\w+ { background-image: url\('data:image[^']+'\) }/g)).map(x => x[1])

    let allImagesGrouped = R.groupBy(x => x[0], allImages)

    const imagesToLeave = RA.compact(R.uniq(R.values(allImagesGrouped).map(g => [
      g[0],
      g[g.length - 1],
      g[g.length / 2],
      g[g.length / 2 - 1]
    ]).flat()))

    const imagesToRemove = R.difference(allImages, imagesToLeave)

    imagesToRemove.forEach(image => {
      o = o.replace(new RegExp(`#${image}, #etymology${image} { background-image: [^}]+ }`, "g"), '')
      o = o.replace(new RegExp(`<div id="etymology${image}"  >${image}</div>`, "g"), '')
    })

    o = o.replace(/<li class="text-center">\s*<\/li>/g, '')

    return { i, o }
  },
  r
))

invalid = r_.map(x => ({ i: x.i, o: x.o })).filter(x => x.o >= 131072)
if (invalid.length > 0) { throw new Error('asdf') }

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(r_);
