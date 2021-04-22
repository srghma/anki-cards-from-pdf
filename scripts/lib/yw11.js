function removeAllNodes(elements) { elements.forEach(e => { e.parentNode.removeChild(e); }) }

function timeoutPromise(ms, promise) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("promise timeout"))
    }, ms);
    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  })
}

async function yw11_dictionary(dom, str) {
  const fetch = require('node-fetch')

  const rPromise = fetch(`https://www.yw11.com/zidian/index/search/${encodeURIComponent(str)}`, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  })

  const r = await timeoutPromise(30000, rPromise)

  const t = await r.text()

  if (t.includes(`<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/><script>alert("汉字不存在");history.go(-1);</script>`)) { return null }

  dom.window.document.body.innerHTML = t

  // console.log(t)

  const node = dom.window.document.querySelector('.s_left_wrap')

  node.querySelectorAll('style').forEach(e => e.remove())
  node.querySelectorAll('.newqiming').forEach(e => e.remove())
  node.querySelectorAll('.info').forEach(e => e.remove())

  return node.innerHTML.trim()
}

const yw11_dictionary_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/yw11_dictionary_cache.json'

// remove = input.slice(-200).map(x => x.kanji)
// remove.forEach(x => { delete yw11_dictionary_cache[x] })
let yw11_dictionary_cache = {}
try { yw11_dictionary_cache = JSON.parse(fs.readFileSync(yw11_dictionary_with_cache_path).toString()) } catch (e) {  }

async function yw11_dictionary_with_cache(dom, sentence) {
  if (yw11_dictionary_cache.hasOwnProperty(sentence)) { return yw11_dictionary_cache[sentence] }

  const yw11_raw = await yw11_dictionary(dom, sentence)
  yw11_dictionary_cache[sentence] = yw11_raw

  fs.writeFileSync(yw11_dictionary_with_cache_path, JSON.stringify(yw11_dictionary_cache))

  return yw11_raw
}

exports.yw11_dictionary_cache = yw11_dictionary_cache
exports.yw11_dictionary = yw11_dictionary
exports.yw11_dictionary_with_cache = yw11_dictionary_with_cache
