const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
// const dom = new JSDOM(``);
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const timeoutPromise = require('./scripts/lib/timeoutPromise').timeoutPromise
const { JsonlDB } = require('@alcalzone/jsonl-db')

const zitools_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/zitools_cache.json'
const db = new JsonlDB(zitools_with_cache_path, {
  reviver: (key, serializedValue) => {
    // if (key === "膽") { console.log(serializedValue) }
    // if (key === "若") { console.log(serializedValue) }
    if (typeof serializedValue === "object") {
      let { explaination, readings } = serializedValue
      readings = readings || {}
      const { cn } = readings
      return {
        explaination,
        cn,
      }
    }
    if (serializedValue === 404) { return serializedValue }
    throw new Error(`unknown ${serializedValue}`)
  },
  serializer: (key, value) => value
})
await db.open()

//////////////////////////////

ruPinyinArray = require('fs').readFileSync(`/home/srghma/projects/srghma-chinese/ru-pinyin.txt`).toString()
ruPinyinArray_text__hanzies = R.uniq([...ruPinyinArray].filter(isHanzi))

// "发 asdf asdf 123 ()" => "asdfasdf"
removeAllCharactersExceptAZ = text => {
  try {
    return text.toLowerCase().replace(/[^a-z]/g, '')
  } catch (e) {
    console.log(e, text)
  }
}
removeLinks = x => x.replace(/<link>[^<]*<\/link>/g, '')
function ruPinyinTextToArray(text) {
  text = text.replace(/\t/g, '').split(/―{4,}|-{4,}/)
  text = text.map(x => x.split('\n').map(x => x.trim()).join('\n'))
  text = text.map(x => x.split(/_{3,}/).map(x => x.trim()).filter(x => x))
  text = text.filter(x => x.length > 0)
  return text
}

explainations_ = []; db.forEach((value, key) => { explainations_.push({ key, ...value }) })
explainations_ = explainations_.filter(({ key, explaination }) => explaination)
explainations_ = explainations_.filter(({ key, explaination }) => explaination !== 404)
explainations_ = explainations_.filter(({ key, explaination }) => explaination !== 'Unknown origin.')
ruPinyinArray__without_html = removeAllCharactersExceptAZ(ruPinyinArray.replace(/<\/?link>/g, ''))
explainations_ = explainations_.filter(({ key, explaination }) => !ruPinyinArray__without_html.includes(removeAllCharactersExceptAZ(explaination))) // not yet in the text explanations
explainations_ = R.fromPairs(explainations_.map(({ key, explaination, cn }) => [key, { explaination, cn }]))

function enhanceWithLinkToH(t) { return [...t].map(ch => isHanzi(ch) ? `<link>${ch}</link>` : ch).join('').replace(/<\/link><link>/g, '') }

ruPinyinArray_updated = ruPinyinTextToArray(ruPinyinArray).map(sencondLevel => sencondLevel.map(ruPinyinArray_text => {
  const ruPinyinArray_text__onlyLetters = removeLinks(ruPinyinArray_text).replace(/\W/g, '')
  let ruPinyinArray_text__hanzies = R.uniq([...ruPinyinArray_text__onlyLetters].filter(isHanzi))
  ruPinyinArray_text__hanzies = ruPinyinArray_text__hanzies.map(h => {
    if (explainations_.hasOwnProperty(h)) {
      delete explainations_[h]
      return `${h} | ${enhanceWithLinkToH(explainations_[h])}`
    }
  }).filter(x => x)
  return [ruPinyinArray_text, ...ruPinyinArray_text__hanzies].join('\n')
}))
require('fs').writeFileSync(`/home/srghma/projects/srghma-chinese/ru-pinyin.txt`, ruPinyinArray_updated.map(x => x.join(`\n\n______________\n\n`)).join(`\n\n------------\n\n`))
console.log(R.toPairs(explainations_).map(([key, { explaination, cn }]) => `${key} | ${(cn || []).join(', ')} | ${enhanceWithLinkToH(explaination)}`).join('\n'))

//////////////////////////////

// console.log(explainations_.map(({ key, value }) => `${key} | ${value}`).join('\n'))

input = JSON.parse(require('fs').readFileSync('/home/srghma/projects/srghma-chinese/files/anki.json').toString()); null
// input['发']
input = R.values(input)
input = R.filter(x => x.chinese_junda_freq_ierogliph_number, input)
input = R.sortBy(value => value.chinese_junda_freq_ierogliph_number, input)
input = R.map(value => value.kanji, input)
input = R.uniq([...input, ...ruPinyinArray_text__hanzies])
input = R.difference(input, Array.from(db.keys()))

// getInput = () => {
//   const [first, ...all] = input
//   input = [...all, first]
//   return first
// }
// pushInputAgain = (x) => {
//   input = [...input, x]
// }

// input.forEach(x => { if (db.get(x) === false) { db.delete(x) } })
// await db.close()

// input.map(R.prop('kanji')).join('').includes('鏕')

proxies_ = fs.readFileSync("/home/srghma/projects/anki-cards-from-pdf/good-proxies.txt").toString().split('\n').map(x => x.trim()).filter(x => x)

// getProxy = () => {
//   const [first, ...all] = currentProxies
//   currentProxies = [...all, first]
//   return first
// }
// removeProxyBecauseBlocked = (proxy) => {
//   currentProxies = currentProxies.filter(x => x !== proxy)
// }

function mkMapper(proxyForThisRequest) {
  eachNIndex = 0
  return async function mapper(output, kanji) {
    if(!kanji) { throw new Error('') }
    // const proxyForThisRequest = getProxy()
    // const proxyForThisRequest = null
    // const proxyForThisRequest = "198.41.34.67:8080"
    let transl = null
    try {
      // require('./scripts/lib/zitools').zitools_translate_sync()
      const { from_cache, jsonOrStatus } = await require('./scripts/lib/zitools').zitools_with_cache(db, kanji, proxyForThisRequest)
      transl = jsonOrStatus
      const shouldRetry = jsonOrStatus !== 200 && jsonOrStatus !== 404
      // const isBlocked =
      if (!from_cache) {
        eachNIndex++
        await new Promise(r => setTimeout(r, 1000));
        if (eachNIndex % 10 === 0) { console.log('waiting 2s'); await new Promise(r => setTimeout(r, 3 * 1000)); }
        // if (eachNIndex % 300 === 0) { console.log('waiting 60 min'); await new Promise(r => setTimeout(r, 60 * 60 * 1000)); }
        console.log(kanji, typeof jsonOrStatus === "object" ? "" : jsonOrStatus)
      }
    } catch (e) {
      console.error({ kanji, e })
      if (e.message.includes('Unexpected end of JSON input') || e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET') {
        // TODO: return and pick new proxy
        await new Promise(r => setTimeout(r, 60 * 60 * 1000));
        // removeProxyBecauseBlocked(proxyForThisRequest)
      }
      return
    }
    output.push({
      kanji,
      transl
    })
  }
}

output = []
;(async function() {
  function split_array(a, nparts) {
    const quot = Math.floor(a.length / nparts)
    const rem = a.length % nparts
    var parts = []
    for (var i = 0; i < nparts; ++i) {
      const begin = i * quot + Math.min(rem, i)
      const end = begin + quot + (i < rem)
      parts.push(a.slice(begin, end))
    }
    return parts
  }
  // const numberOfChunks = 20
  const currentProxies = proxies_.slice(-20)
  // const currentProxies = [null, ...proxies_] //.slice(0, numberOfChunks)
  // const currentProxies = ['203.170.73.228:8080'] //.slice(0, numberOfChunks)
  const currentInputs = split_array(input, currentProxies.length)
  if (currentProxies.length !== currentInputs.length) { throw new Error(`${currentProxies.length} !== ${currentInputs.length}`) }
  await Promise.all(currentInputs.map(async (input, index) => {
    const proxyForThisRequest = currentProxies[index]
    if (proxyForThisRequest === undefined) { throw new Error('asdf') }
    const mapper = mkMapper(proxyForThisRequest)
    for (const kanji of input) {
      await mapper(output, kanji, 0)
    }
  }))
  await db.close()
})();

Array.from(db.keys()).length
input.length
output.length
proxies_.length
