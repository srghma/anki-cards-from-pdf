function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

exports.purpleculture_pinyin_converter = async function purpleculture_pinyin_converter(dom, str) {
  const fetch = require('node-fetch')

  const body = `wdqchs=${encodeURIComponent(str)}&correcttone=on&colorpy=on&convert=y&reviewlist=&tone_type=number`

  const r = await fetch("https://www.purpleculture.net/chinese-pinyin-converter/?session=45d7a7a7bf8995fdd1cd78e31e185f0a", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": "__cfduid=dd2beda466ca6a747493047b221b897611612708715; zenid=477igpr03n8069m2gl0hj1290t; tlang=en; samsen_sets=0|1; locel=en-US; ftu_dic=y; font=SimSun; fontsize=1; side_ss=ss_ori; side_def=def_en; pyloc=t; ftu=y; tonecolor=0000FF|00FF00|8900BF|FF0000|A8A8A8; frontside=f_sc; backside=b_py|b_en; vocftu=y; aspeed=1; agendar=Female; viewop=hsk2|hsk3|hsk4|hsk5|hsk6|hsk1|hsk7|tooltips"
    },
    "referrer": "https://www.purpleculture.net/chinese-pinyin-converter/?session=68c22797f58ae7fbe219451b959b20ba",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": body,
    "method": "POST",
    "mode": "cors"
  });

  const t = await r.text()

  dom.window.document.body.innerHTML = t

  const node = dom.window.document.querySelector('#annoatedtext')
  removeAllNodes(node.querySelectorAll(".tools"))
  removeAllNodes(node.querySelectorAll(".fa-spinner"))
  removeAllNodes(node.querySelectorAll('*[style*="display: none;"]'))
  return node.innerHTML.trim()
}

const purpleculture_pinyin_converter_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/purpleculture_pinyin_converter_cache.json'

let purpleculture_pinyin_converter_cache = {}
try { purpleculture_pinyin_converter_cache = JSON.parse(fs.readFileSync(purpleculture_pinyin_converter_with_cache_path).toString()) } catch (e) {  }

async function purpleculture_pinyin_converter_with_cache(dom, sentence) {
  const cached = purpleculture_pinyin_converter_cache[sentence]
  if (cached) { return cached }

  const purpleculture_raw = await require('./purpleculture_pinyin_converter').purpleculture_pinyin_converter(dom, sentence)
  purpleculture_pinyin_converter_cache[sentence] = purpleculture_raw

  fs.writeFileSync(purpleculture_pinyin_converter_with_cache_path, JSON.stringify(purpleculture_pinyin_converter_cache))

  return purpleculture_raw
}

exports.purpleculture_pinyin_converter_with_cache = purpleculture_pinyin_converter_with_cache
