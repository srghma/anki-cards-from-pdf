function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

exports.purplecultre_dictionary = async function purplecultre_dictionary(dom, str) {
  const fetch = require('node-fetch')

  const r = await fetch(`https://www.purpleculture.net/dictionary_details/?word=${encodeURIComponent(str)}`, {
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
      "cookie": "tlang=en; samsen_sets=0|1; locel=en-US; ftu_dic=y; font=SimSun; fontsize=1; side_ss=ss_ori; side_def=def_en; pyloc=t; ftu=y; frontside=f_sc; backside=b_py|b_en; vocftu=y; viewop=hsk2|hsk3|hsk4|hsk5|hsk6|hsk1|hsk7|tooltips; zenid=0m5t86tcdhr4ud1bipqsifg61n; tonecolor=ff0000|d89000|00a000|0000ff|000000; charcolor=0; __cfduid=d06c1735543c8838c9ffa932e6d4166421615718103; aspeed=1; ani_color=tone|char; recently_viewed_products=a%3A3%3A%7Bi%3A0%3Bi%3A4006%3Bi%3A1%3Bi%3A1402%3Bi%3A2%3Bi%3A4006%3B%7D; agendar=Female"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });

  const t = await r.text()

  dom.window.document.body.innerHTML = t
  const node = dom.window.document.querySelector('#dicdetails div.d-flex')
  return node.innerHTML.trim()
}

const purplecultre_dictionary_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/purplecultre_dictionary_cache.json'

let purplecultre_dictionary_cache = {}
try { purplecultre_dictionary_cache = JSON.parse(fs.readFileSync(purplecultre_dictionary_with_cache_path).toString()) } catch (e) {  }

async function purplecultre_dictionary_with_cache(dom, sentence) {
  const cached = purplecultre_dictionary_cache[sentence]
  if (cached) { return cached }

  const purpleculture_raw = await require('./purplecultre_dictionary').purplecultre_dictionary(dom, sentence)
  purplecultre_dictionary_cache[sentence] = purpleculture_raw

  fs.writeFileSync(purplecultre_dictionary_with_cache_path, JSON.stringify(purplecultre_dictionary_cache))

  return purpleculture_raw
}

exports.purplecultre_dictionary_with_cache = purplecultre_dictionary_with_cache
