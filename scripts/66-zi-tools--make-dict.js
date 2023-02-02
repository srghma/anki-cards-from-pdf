// node --max-old-space-size=8000 ./scripts/66-zi-tools--make-dict.js
const readStreamArray = require('./lib/readStreamArray').readStreamArray
const isHanzi = require('./lib/isHanzi').isHanzi
const checkDuplicateKeys = require('./lib/checkDuplicateKeys').checkDuplicateKeys
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
// const dom = new JSDOM(``);
const mkQueue = require('./lib/mkQueue').mkQueue
const timeoutPromise = require('./lib/timeoutPromise').timeoutPromise
const { JsonlDB } = require('@alcalzone/jsonl-db')

;(async function() {
const zitools_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/zitools_cache.json'
const db = new JsonlDB(zitools_with_cache_path, {
  reviver: (key, serializedValue) => {
    // if (key === "若") { console.log(serializedValue.yi) }
    // if (key === "膽") { console.log(serializedValue.yi) }
    if (typeof serializedValue === "object") {
      // 'GHZR-2271.04-1': [
      //   'GHZR-2271.04-1',
      //   'GHZR',
      //   '2271.04',
      //   '1',
      //   '膽',
      //   '膽',
      //   '膽',
      //   '胆量，喻人有勇气:::courage',
      //   'G:dan3',
      //   '',
      //   '',
      //   null,
      //   null,
      //   null,
      //   null,
      //   '肉詹',
      //   '膽(肉詹)'
      // ],

      // 'GHZR-2207.04-3': [
      //   'GHZR-2207.04-3',
      //   'GHZR',
      //   '2207.04',
      //   '3',
      //   '胆',
      //   '胆',
      //   '胆',
      //   '同=膽',
      //   'G:dan3',
      //   '',
      //   '',
      //   '膽-*',
      //   null,
      //   null,
      //   null,
      //   '肉旦',
      //   '胆(肉旦)'
      // ],

      const ghzr = R.values(R.path(['yi', 'nodes'], serializedValue)).filter(([ghzr_n, ghzr, num, num2, i1, i2, i3, mean, sound]) => ghzr === 'GHZR' && i1 === key).map(([ghzr_n, ghzr, num, num2, i1, i2, i3, mean, sound]) => ({ num2, mean, sound }))
      return {
        ids_zi_tools: serializedValue.ids_zi_tools,
        origin: serializedValue.origin,
        ghzr,
      }
    }
    return null
    // if (typeof serializedValue === "object") {
    //   let { explaination, readings } = serializedValue
    //   readings = readings || {}
    //   const { cn } = readings
    //   return {
    //     explaination,
    //     cn,
    //   }
    // }
    // if (serializedValue === 404) { return serializedValue }
    // throw new Error(`unknown ${serializedValue}`)
  },
  serializer: (key, value) => value
})
await db.open()

// db.get('膽')
// db.get('心')
// R.sortBy(x => Number(x.num2), db.get('心').ghzr)
// R.sortBy(x => Number(x.num2), db.get('台').ghzr)
// R.groupBy(x => x.sound, (R.sortBy(x => Number(x.num2), db.get('台').ghzr)))
// db.get('若')

const escapeHTML = str => str.replace(/[&<>'"]/g,
  tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]))

buffer = []
db.forEach((value, key) => {
  if (!value) { return }
  let { ids_zi_tools, origin, ghzr } = value
  // ⺆
  // ⺄
  // if (ids_zi_tools === '#(HNg)') { return }
  if ((!ghzr || ghzr.length === 0) || !origin) { return }

  // console.log(key, value)
  ghzr = ghzr.map(({ num2, mean, sound }) => {
    mean = mean.replace(/=(.)/g, ' 「 $1 」 ')
    const [mean_chinese, mean_eng] = mean.split(':::')
    mean = [escapeHTML(mean_chinese), mean_eng ? `<c c="#c28303">${escapeHTML(mean_eng)}</c>` : null].filter(x => x).join(' ')
    return {
      num2: num2 && Number(num2),
      mean,
      sound: sound && sound.replace(/^G\:/g, ''),
    }
  })
  ghzr = R.groupBy(x => x.sound || '', R.sortBy(x => x.num2, ghzr))
  // ghzr = R.map(x => x.map(x => x.mean), ghzr)
  // console.log(ghzr)
  ghzr = R.toPairs(ghzr)
  ghzr = ghzr.map(([sound, values]) => {
    // console.log(sound, values)
    sound = sound ? `<dtrn>${escapeHTML(sound)}</dtrn>` : null
    values = values.map(({ num2, mean }) => `<k>(${num2+1}) ${mean}</k>`)
    return [sound, ...values]
  })
  // console.log(ghzr)
  ghzr = ghzr.flat().join('')

  ids_zi_tools = ids_zi_tools.replace(/\t/g, '<br/>')

  if (origin) {
    origin = origin.map(xs => {
      xs = xs.filter(x => x).join(': ')
      xs = xs.replace(/\t/g, ' ')
      xs = `<k>${escapeHTML(xs)}</k>`
      return xs
    }).join('')
  }

  // buffer.push({ ids_zi_tools, origin, ghzr })

  const output = [
    ids_zi_tools ? `ids: ${ids_zi_tools}` : null,
    origin ? origin : null,
    ghzr ? ghzr : null,
  ].filter(x => x).join('<br/>')

  buffer.push(`<article><key>${key}</key><definition type="x"><![CDATA[${output}]]></definition></article>\n\n`)
})

require('fs').writeFileSync(`/home/srghma/Desktop/dictionaries/mychinese/zitools-textual.xml`, `<?xml version="1.0" encoding="UTF-8" ?>
<stardict>
<info>
  <version>3.0.0</version>
  <bookname>srghma zitools</bookname>
  <author>Serhii Khoma</author>
  <email>srghma@gmail.com</email>
  <website>srghma-chinese.github.io</website>
  <description>MIT copyright</description>
  <date>${new Date()}</date>
  <dicttype><!-- this element is normally empty --></dicttype>
</info>
<contents>
${buffer.join('')}
</contents>
</stardict>`)

const mkStardict = (input, output) => {
  const c = `export INPUT="${input}" && export OUTPUT="${output}" && rm -rfd "$OUTPUT" && mkdir -p "$OUTPUT" && cd ~/projects/pyglossary && nix-shell -p pkgs.gobject-introspection python38Packages.pygobject3 python38Packages.pycairo python38Packages.prompt_toolkit python38Packages.lxml python38Packages.PyICU pkgs.dict --run 'python3 main.py --ui=cmd "$INPUT" "$OUTPUT" --utf8-check --read-format=StardictTextual --write-format=Stardict'`
  console.log(c)
  require("child_process").execSync(c)
}

mkStardict("/home/srghma/Desktop/dictionaries/mychinese/zitools-textual.xml", "/home/srghma/Desktop/dictionaries/mychinese/zitools/")
})();
