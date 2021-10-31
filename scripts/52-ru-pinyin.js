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
const groupConsecutive = require('./scripts/lib/groupConsecutive').groupConsecutive

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))

  const allFilesAndTexts = filesAbsPath.map(file => {
    const fileText = require('fs').readFileSync(file).toString()
    return { file, fileText }
  })

  let allExistingHanzi = allFilesAndTexts.map(R.prop('fileText')).join('')
  allExistingHanzi = R.uniq([...allExistingHanzi].filter(isHanzi))

  return allFilesAndTexts.forEach(({ file, fileText }) => {
    fileText = fileText.split(/―{4,}|-{4,}/).map(R.trim)
    // fileText = fileText.filter(content => {
    //   if (content.length === 1) {
    //     if (isHanzi(content[0])) {
    //       return false
    //     }
    //   }
    //   return true
    // })
    fileText = fileText.filter(Boolean)

    fileText = fileText.map(fileTextGroup => {
      const chars = [...fileTextGroup]
      const hanzis = chars.filter(isHanzi)
      let hanziAndOpposite = hanzis.map(x => {
        const t = TongWen.s_2_t[x]
        const s = TongWen.t_2_s[x]

        // if (t != null && s != null) {
        //   console.log({ t, s, x, fileTextGroup })
        //   throw new Error('many opposites')
        // }

        let opposite = R.uniq([t, s].filter(Boolean))

        opposite = opposite.filter(oppositeElement => {
          const isAlreadyInText = allExistingHanzi.includes(oppositeElement)
          return !isAlreadyInText
        })

        return { hanziInText: x, opposite }
      }).filter(x => x.opposite.length !== 0)

      hanziAndOpposite = R.uniqBy(R.prop('hanziInText'), hanziAndOpposite)

      if (hanziAndOpposite.length !== 0) {
        console.log(fileTextGroup, hanziAndOpposite)
      }

      hanziAndOpposite.forEach(({ hanziInText, opposite }) => {
        fileTextGroup = fileTextGroup.replace(hanziInText, hanziInText + opposite.join(''))
      })

      fileTextGroup = groupConsecutive(isHanzi, [...fileTextGroup]).map(x => {
        return x.type ? R.uniq(x.values).join('') : x.values.join('')
      }).join('')

      // console.log(require('util').inspect({ groupedChars, fileTextGroup }, {showHidden: false, depth: null, colors: true}))

      return fileTextGroup
    })

    fileText = fileText.map(x => x.split('\n').map(x => x.replace(/^\s+|\s+$/g,'')).join('\n')).join('\n\n-----\n\n') + '\n'

    require('fs').writeFileSync(file, fileText)
    return { file, fileText }
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
console.log(R.keys(x).join('|'))

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
  hanzi = R.uniq(hanzi).sort()
  x = R.trim(x)
  return { text: x, hanzi }
})
x = x.filter(x => x.hanzi.length !== 0)
fs.writeFileSync(`/home/srghma/projects/anki-cards-from-pdf/html/ru-pinyin.json`, JSON.stringify(x, undefined, 2))

/////////////////

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))

  return filesAbsPath.filter(x => x.endsWith('.vtt')).map(file => {
    let x = require('fs').readFileSync(file).toString() // .replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)

    x = require('subtitles-parser-vtt').fromVtt(x, 's')
    x = x.map(R.prop('text')).join()
    x = R.uniq([...x].filter(isHanzi))

    return { file: file.replace('/home/srghma/Desktop/peppa-ch/', '').replace('.vtt', ''), x }
  })
}

peppaSubCh = await readdirFullPath("/home/srghma/Desktop/peppa-ch")
// peppaSubCh = peppaSubCh.filter(x => x.file === 'Chinese Peppa Pig -  🐠 𝐓𝐡𝐞 𝐀𝐪𝐮𝐚𝐫𝐢𝐮𝐦 - 𝟖 𝐂𝐂 𝐒𝐔𝐁𝐒-yJSgRIDOdzY.zh-CN')[0].x
peppaSubCh = peppaSubCh.filter(x => x.file.endsWith('.zh-CN'))[0].x

readdirFullPath = async dirPath => {
  const files = await require('fs/promises').readdir(dirPath)
  const filesAbsPath = files.map(x => require('path').join(dirPath, x))
  return filesAbsPath.map(file => {
    let x = require('fs').readFileSync(file).toString() // .replace(/\r/g, '').split('\n\n').map(x => R.tail(x.split('\n'))).filter(x => x.length > 0)
    x = x.split(/―{4,}|-{4,}/).map(R.trim)
    return x.map(x => ({ file, x }))
  })
}
knownH = await readdirFullPath("/home/srghma/projects/anki-cards-from-pdf/ru-pinyin")
knownH = knownH.flat()
knownH = knownH.map(({ file, x }) => {
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
knownH = R.uniq(knownH.map(x => x.hanzi).join())
diff = R.difference(peppaSubCh, knownH)

diff = diff.map(x => `http://localhost:34567/h.html#${x}`)
diff.slice(0, 25).forEach((url) => {
  console.log(url)
  require('child_process').execSync(`google-chrome-beta ${url}`, {encoding: 'utf8'})
})
