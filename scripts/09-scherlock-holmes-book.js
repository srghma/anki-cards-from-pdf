const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')

content = fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/scripts/scherlock-holmes-book.txt').toString()

content = content.split(/(CHAPTER \d+ .+)\n/).map(x => x.trim()).filter(x => x != '')

content = content.reduce((acc, curr) => {
  console.log({ acc, curr })
  if (curr.startsWith('CHAPTER ')) {
    acc[curr] = []
  } else {
    const lastAdd = Object.keys(acc).pop()
    console.log({ lastAdd })
    acc[lastAdd].push(curr.trim())
  }

  return acc
}, {})

content = R.map(
  val => val.join('\n'),
  content
)

specchars = "。？！".split('')
ignorechars = R.uniq("”““”".split(''))

// console.log(val)

// val = val.split('\n').map(x => x.trim()).filter(x => x != '').map(v => {
//   let buffer = v

//   specchars.forEach(specchar => {
//     ignorechars.forEach(ignorechar => {
//       buffer = buffer.replace(new RegExp(`(${specchar})([^${ignorechar}])`, 'g'), `$1\n$2`)
//     })
//   })

//   return buffer.split('\n').map(x => x.trim()).filter(x => x != '')
// }).flat()

content_ = R.pipe(
  R.mapObjIndexed((val, key) => {
    const val_ = val
      .split('\n').map(x => x.trim()).filter(x => x != '')
      // .map(s => s.replace(/“/g, '"').replace(/”/g, '"'))
      .flat()

    return val_
  })
)(content)

content__ = R.pipe(
  R.mapObjIndexed((val, key) => {
    const val_ = val
      .map(s => {
        return s
        .replace(/(。|？|！)([^’”\n])/g, "$1\n$2")
        .split('\n').map(x => x.trim()).filter(x => x != '')
      })
      .flat()
      .map(s => {
        return s
        .replace(/(。|？|！)”/g, "$1”\n")
        .split('\n').map(x => x.trim()).filter(x => x != '')
      })
      .flat()
      .map(s => {
        return s
        .replace(/(。|？|！)’/g, "$1’\n")
        .split('\n').map(x => x.trim()).filter(x => x != '')
      })
      .flat()
      .map(s => s.replace(/HERE/g, '').replace(" ", ''))

    return val_
  })
)(content_)

content___ = Object.entries(content__).map(([key, val]) => val.map(v => ({ sentence: v, chapter: key }))).flat()

// console.log()
// console.log(JSON.stringify(content___, null, '  '))

const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

async function mymapper(x) {
  const sentence = x
  const chapter = null

  let translation = null
  try {
    translation = await translate.translate(sentence, 'en')
    console.log({ sentence, translation })
  } catch (e) {
    console.error(e)
  }

  let purpleculternumbered = null
  try {
    purpleculternumbered = await require('./scripts/purpleculture_pinyin_converter').purpleculture_pinyin_converter(sentence)
    console.log({ sentence, purpleculternumbered })
  } catch (e) {
    console.error(e)
  }

  return {
    sentence,
    chapter,
    purpleculternumbered,
    translation,
  }
}

output = []

;(async function(input){
  for (let i = 0; i < input.length; i++) {
    const res = await mymapper(input[i])

    fs.appendFileSync('sherlockpinyincache.json', JSON.stringify(res))

    output.push(res)

    console.log({ i, l: input.length })
  };
})(s);

output_ = output.map(x => {
  return {
    sentence: x.sentence,
    chapter: x.chapter,
    purpleculternumbered: require('./scripts/lib/processPurpleculture').processPurpleculture(x.purpleculternumbered),
    translation: x.translation[0],
  }
})

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(output_);
