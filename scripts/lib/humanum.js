const fetch = require('node-fetch')

function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

async function humanum(dom, str) {
  const r = await fetch(`http://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=${encodeURIComponent(str)}`, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,ja-JP;q=0.6,ja;q=0.5",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "upgrade-insecure-requests": "1",
      "cookie": "screen=1914*1077; leximfPhonetic=0; leximfLang=1"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  })

  const t = await r.text()

  if (t.includes('字未收錄於本資料庫')) { return { res: "not_in_db" } }

  dom.window.document.body.innerHTML = t

  const img = dom.window.document.querySelector('#char_anc_div img')

  let sinopsis = null
  let explanation = null

  if (!dom.window.document.querySelector('#explainShapeTable')) {
    return {
      origText: t,
      res: "no_explainShapeTable"
    }
  } // TODO

  let explainShapeTable = dom.window.document.querySelector('#explainShapeTable tr.greyTr > td > div')

  // if (!explainShapeTable) {
  //   console.log(t)
  // }

  // POSSIBLE EXCEPTION
  // http://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=%E6%90%BA
  // 「携」cannot be found in our database.
  explainShapeTable = explainShapeTable.innerHTML

  explainShapeTable = explainShapeTable.split(/<div style="float:right; margin-right: 10px; color: #666666">.* Characters<\/div><br>/)
  // console.log(explainShapeTable)

  sinopsis = explainShapeTable[0]
  explanation = explainShapeTable[1]

  return {
    origText: t,
    image: img && ("http://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/" + img.src),
    sinopsis: sinopsis && sinopsis.trim().replace(/href="search\.php\?word/g, 'href="http://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=').trim(),
    explanation: explanation && explanation.trim().replace(/href="search\.php\?word/g, 'href="http://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=').trim(),
  }
}

exports.humanum = humanum
