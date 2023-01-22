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
db = new JsonlDB(zitools_with_cache_path)
await db.open()

x = JSON.parse(require('fs').readFileSync('/home/srghma/projects/srghma-chinese/files/anki.json').toString()); null

// x['发']

x = R.filter(x => x.purpleculture_hsk, x); null

input_ = Object.keys(x)
// input_.map(R.prop('kanji')).join('').includes('鏕')


eachNIndex = 0
async function mapper(output, kanji, inputIndex) {
  if(!kanji) { throw new Error('') }
  let transl = null
  try {
    // require('./scripts/lib/zitools').zitools_translate_sync()
    const { from_cache, value } = await require('./scripts/lib/zitools').zitools_with_cache(db, kanji)
    transl = value
    if (!from_cache) {
      eachNIndex++
      await new Promise(r => setTimeout(r, 200));
      if (eachNIndex % 10 === 0) {
        console.log('waiting 2s')
        await new Promise(r => setTimeout(r, 3 * 1000));
      }
      if (eachNIndex % 300 === 0) {
        console.log('waiting 60 min')
        await new Promise(r => setTimeout(r, 60 * 60 * 1000));
      }
      // console.log({ kanji, transl })
    }
  } catch (e) {
    console.error({ kanji, e })
    if (e.message.includes('Unexpected end of JSON input')) {
      await new Promise(r => setTimeout(r, 60 * 60 * 1000));
    }
    return
  }
  output.push({
    kanji,
    transl
  })
}
output = []

;(async function() {
  for (const kanji of input_) {
    await mapper(output, kanji, 0)
  }
  await db.close()
})();

output.length

// queueSize = 10
// // doms = Array.from({ length: queueSize }, (_, i) => { return new JSDOM(``) })
// mkQueue(queueSize).addAll(input_.map((x, inputIndex) => async jobIndex => { mapper(output, x, inputIndex) }))
