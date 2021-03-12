const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

function mapWithForEachToArray(xs, fn) {
  const output = []
  xs.forEach(x => output.push(fn(x)))
  return output
}

ipwordscache_path = '/home/srghma/projects/anki-cards-from-pdf/ipacache.json'
ipwordscache = {}
try {
  ipwordscache = JSON.parse(require('fs').readFileSync(ipwordscache_path).toString())
} catch (e) {
  console.log(e)
}

dom.window.document.body.innerHTML = require('fs').readFileSync('/home/srghma/projects/anki-cards-from-pdf/ipa-output/5.html').toString()

ipwordscache_new = mapWithForEachToArray(
  dom.window.document.querySelectorAll('div.big-hanzi p'),
  pEl => {
    const chineseText = mapWithForEachToArray(pEl.querySelectorAll('a.hsk-white'), aEl => aEl.textContent.trim()).join('')

    console.log({ chineseText, innerHTML: pEl.innerHTML })

    if (chineseText.length == 0) {
      if (pEl.innerHTML == '') { return }

      return {
        chineseText: pEl.querySelector('ruby').textContent.replace(/&nbsp;/g, '').trim(),
        rubies: []
      }
    }

    const rubies = mapWithForEachToArray(
      pEl.querySelectorAll('ruby'),
      rubyEl => {
        const chineseIerogliphOrWord = rubyEl.querySelector('a.hsk-white').textContent.trim()

        console.log({ chineseIerogliphOrWord })

        const nobrs = mapWithForEachToArray(
          rubyEl.querySelectorAll('.chineseHomographsList nobr'),
          nobrEl => nobrEl.textContent.trim()
        )

        console.log({ nobrs })

        if (nobrs.length > 0) {
          return {
            chineseIerogliphOrWord,
            chineseIerogliphOrWordPronounce: nobrs,
          }
        }

        const rtText = rubyEl.querySelector('rt').textContent.trim()

        console.log({ rtText })

        return {
          chineseIerogliphOrWord,
          chineseIerogliphOrWordPronounce: [ rtText ],
        }
      }
    )

    return { chineseText, rubies }
  }
).filter(R.identity).map(x => [x.chineseText, x.rubies])

ipwordscache_new = Object.fromEntries(ipwordscache_new)
ipwordscache_old = ipwordscache
ipwordscache = { ...ipwordscache_old, ...ipwordscache_new }

require('fs').writeFileSync(ipwordscache_path, JSON.stringify(ipwordscache, null, 2))

ipwordscache = JSON.parse(require('fs').readFileSync(ipwordscache_path))
