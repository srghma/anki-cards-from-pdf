const fetch = require('node-fetch')

function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

exports.trainchinese = async function trainchinese(dom, str) {
  const r = await fetch(`https://www.trainchinese.com/v2/search.php?searchWord=${encodeURIComponent(str)}&tcLanguage=ru`, {
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
      "cookie": "X-Mapping-llahcpom=0C14464A7A01A280C5776A75B2327FDB; aff_site=https%3A%2F%2Fwww.google.com%2F"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });

  const t = await r.text()

  dom.window.document.body.innerHTML = t

  const node = dom.window.document.querySelector('table.table')

  return node.innerHTML.trim()
}
