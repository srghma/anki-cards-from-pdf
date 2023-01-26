const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray
const HttpsProxyAgent = require('https-proxy-agent');

const req_options = {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "ru,en-US;q=0.9,en;q=0.8",
    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"102\", \"Google Chrome\";v=\"102\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET",
}

fetchWithProxy = (str, options, proxy) => fetch(str, { ...options, agent: new HttpsProxyAgent(`http://${proxy}`) })

exports.zitools = async function zitools(str, proxy) {
  const url = `https://zi.tools/api/zi/${encodeURIComponent(str)}`
  const response = proxy ? await fetchWithProxy(url, req_options, proxy) : await fetch(url, req_options)
  const { status } = response
  let jsonOrStatus = status
  // 400 bad request - try again
  if (status === 200) { jsonOrStatus = await response.json() }
  if (status !== 200) {
    try {
      const text = await response.text()
      console.log(str, proxy, status, text)
    } catch (e) {
      console.log(str, proxy, status, e)
    }
  }
  return jsonOrStatus
}

exports.zitools_with_cache = async function zitools_with_cache(db, sentence, proxy) {
  if (db.has(sentence)) {
    return { from_cache: true, value: db.get(sentence) }
  }
  const jsonOrStatus = await exports.zitools(sentence, proxy)
  const isObjectOr404 = jsonOrStatus === 404 || typeof jsonOrStatus === "object"
  if (isObjectOr404) { db.set(sentence, jsonOrStatus) }
  return { from_cache: false, jsonOrStatus }
}
