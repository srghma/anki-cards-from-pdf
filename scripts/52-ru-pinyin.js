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
const nodeWith = require('./scripts/lib/nodeWith').nodeWith
const escapeRegExp = require('./scripts/lib/escapeRegExp').escapeRegExp
const TongWen = require('./scripts/lib/TongWen').TongWen

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))
  return filesAbsPath.map(file => {
    let x = require('fs').readFileSync(file).toString() // .replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)
    x = x.split(/―{4,}|-{4,}/).map(R.trim)
    x = x.filter(content => {
      if (content.length === 1) {
        if (isHanzi(content[0])) {
          return false
        }
      }
      return true
    })
    x = x.filter(Boolean).join('\n\n-----\n\n') + '\n'
    require('fs').writeFileSync(file, x)
    return { file, x }
  })
}
subCh = await readdirFullPath("/home/srghma/projects/anki-cards-from-pdf/ru-pinyin")

//////////////////

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))
  return filesAbsPath.map(file => {
    let x = require('fs').readFileSync(file).toString() // .replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)
    x = x.split(/―{4,}|-{4,}/).map(R.trim)
    return x.map(x => ({ file, x }))
  })
}
x = await readdirFullPath("/home/srghma/projects/anki-cards-from-pdf/ru-pinyin")
x = x.flat()
x = x.map(({ file, x }) => {
  hanzi = x.split('').filter(isHanzi).map(x => {
    const t = TongWen.s_2_t[x]
    const s = TongWen.t_2_s[x]
    return [x, t, s].filter(Boolean)
  }).flat()
  hanzi = R.uniq(hanzi)
  return { file, x, hanzi }
})
x = x.filter(x => x.hanzi.length !== 0)
x = x.map(({ file, x, hanzi }) => hanzi.map(hanziElem => ({ file, x, hanziElem }))).flat()
x = R.groupBy(R.prop('hanziElem'), x)
x = R.filter(x => x.length > 1, x)
x = R.mapObjIndexed(R.map(R.omit(['hanziElem'])), x)
x = R.toPairs(x)
x = R.sortBy(x => x[0].file, x)
x = R.fromPairs(x)
console.log(R.keys(x).join('\n'))

//////////////////

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))
  return filesAbsPath.map(file => {
    let x = require('fs').readFileSync(file).toString() // .replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)
    x = x.split(/―{4,}|-{4,}/).map(R.trim)
    return x.map(x => ({ file, x }))
  })
}
x = await readdirFullPath("/home/srghma/projects/anki-cards-from-pdf/ru-pinyin")
x = x.flat()
// .filter(x => x.x.includes('𠂤'))
x = x.map(({ file, x }) => {
  hanzi = [...x].filter(isHanzi).map(x => {
    const t = TongWen.s_2_t[x]
    const s = TongWen.t_2_s[x]
    return [x, t, s].filter(Boolean)
  }).flat()
  hanzi = R.uniq(hanzi)
  file = file.replace('/home/srghma/projects/anki-cards-from-pdf/ru-pinyin/', '')
  x = R.trim(x)
  return { file, x, hanzi }
})
x = x.filter(x => x.hanzi.length === 0 && x.x.length !== 0 && x.file)

console.log()
console.log(R.mapObjIndexed(R.map(R.prop('x')), R.groupBy(R.prop('file'), x)))

y = R.uniq(x.map(x => x.file)).sort().filter(Boolean)
y = y.map(x => ({ dig: x.replace(/\D/g, ''), pinyin: x.replace(/\d/g, '') }))
y = R.groupBy(R.prop('pinyin'), y)
y = R.mapObjIndexed(R.map(R.prop('dig')), y)

R.toPairs(y).slice(0, 25).forEach(([key, values]) => {
  url = `http://localhost:34567/f.html?note=${values.join(',')}#${key}`
  console.log(url)
  require('child_process').execSync(`google-chrome-beta ${url}`, {encoding: 'utf8'})
})

//////////////////

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))
  return filesAbsPath.map(file => {
    let x = require('fs').readFileSync(file).toString() // .replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)
    x = x.split(/―{4,}|-{4,}/).map(R.trim)
    return x.map(x => ({ file, x }))
  })
}
x = await readdirFullPath("/home/srghma/projects/anki-cards-from-pdf/ru-pinyin")
x = x.flat()
x = x.map(({ file, x }) => {
  hanzi = x.split('').filter(isHanzi).map(x => {
    const t = TongWen.s_2_t[x]
    const s = TongWen.t_2_s[x]
    return [x, t, s].filter(Boolean)
  }).flat()
  hanzi = R.uniq(hanzi)
  return { file, x, hanzi }
})
x = x.filter(x => x.hanzi.length !== 0)
fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/ru-pinyin.json`, JSON.stringify(x))
