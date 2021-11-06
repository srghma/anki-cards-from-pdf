const fetch = require('node-fetch')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const easypronunciation_chinese = require('./scripts/lib/easypronunciation_chinese').easypronunciation_chinese
const processPurpleculture = require('./scripts/lib/processPurpleculture').processPurpleculture
const removeHTML = require('./scripts/lib/removeHTML').removeHTML
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const Queue = require('promise-queue')
const path = require('path')
const anyAscii = require('any-ascii')
const mkdirp = require('mkdirp')
const entities = require("entities")
const isHanzi = require('./scripts/lib/isHanzi').isHanzi

// x = R.uniq(fs.readFileSync("/home/srghma/Downloads/Hanping Chinese HSK.txt").toString().split('').filter(isHanzi))
// console.log('\n' + x.join('\n'))

dir = '50-things-to-see-in-ukraine'

ps = Array.from({ length: 21 }, (_, i) => i + 1).map(async x => {
  const r = await fetch(`https://www.listchallenges.com/${dir}/list/${x}`, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": "ASP.NET_SessionId=ycid2h4fgp535zvttj1iabb4; as_visitor-id=1047318466; acceptCookies=True"
    },
    "referrer": "https://www.listchallenges.com/best-places-to-visit-in-china",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });
  const t = await r.text()
  return t
})

ps = await Promise.all(ps)

images = ps.map(x => {
  dom.window.document.body.innerHTML = x
  return mapWithForEachToArray(dom.window.document.querySelectorAll('.item-image-wrapper'), node => {
    const x = node.querySelector('img')
    return { alt: x.alt, src: x.getAttribute('data-src') || x.src }
  })
}).flat()

queue = new Queue(200, Infinity)

fulldir = `/home/srghma/.local/share/Anki2/user2/collection.media/mnemonic-places/${dir}`
await mkdirp(fulldir)

images.forEach(x => {
  queue.add(async function() {
    const extname = path.extname(x.src)
    const resp = await require('image-downloader').image({ url: `https://www.listchallenges.com${x.src}`, dest: `${fulldir}/${anyAscii(decodeURIComponent(entities.decodeHTML(x.alt)))}${extname}` })
    console.log('Saved to', resp.filename)
  })
})
