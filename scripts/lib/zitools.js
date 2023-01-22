const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray
const HttpsProxyAgent = require('https-proxy-agent');
const { parseJSONPerLineFormat } = require('./json-lines')

// var ProxyLists = require('proxy-lists');

// function fetchProxies() {
//     return new Promise(function(resolve) {
//         // `gettingProxies` is an event emitter object.
//         var gettingProxies = ProxyLists.getProxies();
//         var proxies = [];

//         gettingProxies.on('data', function(p) {
//             proxies = proxies.concat(p);
//         });

//         gettingProxies.on('error', function(error) {
//             console.error('proxiesFetcher error:', error);
//         });

//         gettingProxies.once('end', function() {
//             console.log('fetched', proxies.length, 'proxies');
//             resolve(proxies);
//         });
//     });
// }

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
    "cookie": "_ga=GA1.2.1817712906.1668587759; _gid=GA1.2.1409874272.1672162462; _gat=1",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET",
  // "agent": new HttpsProxyAgent('34.84.72.91:3128'),
}

exports.zitools = async function zitools(str) {
  let r = await fetch(`https://zi.tools/api/zi/${encodeURIComponent(str)}`, req_options)
  if (r.status === 404) { return false }
  let t = await r.json()
  return t
}

/////////////////
const zitools_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/zitools_cache.json'
let zitools_cache = await parseJSONPerLineFormat(zitools_with_cache_path)
zitools_cache = R.fromPairs(zitools_cache.map(({ key, value }) => [key, value])); null

const stringifier = createJsonLFileWriteStream(zitools_with_cache_path)
// zitools_cache = R.fromPairs(zitools_cache.map(({ key, value }) => [key, null]))

// Object.keys(zitools_cache).length
// R.toPairs(zitools_cache).filter(([k, v]) => v).length
// R.toPairs(R.map(R.prop('meaning'), zitools_cache)).filter(([k, v]) => v)
//
// require('utils')

// R.toPairs(R.map(R.prop('meaning'), zitools_cache)).filter(([k, v]) => v).map(([k, v]) => [k, v.Nom]).filter(([k, v]) => v)

exports.zitools_with_cache = async function zitools_with_cache(sentence) {
  if (zitools_cache.hasOwnProperty(sentence)) { return { from_cache: true, value: zitools_cache[sentence] } }

  // return null
  const x = await exports.zitools(sentence)
  zitools_cache[sentence] = x
  stringifier.write({ key: sentence, value: x })
  return { from_cache: false, value: x }
}

exports.zitools_translate_sync = function zitools_translate_sync() {
  fs.writeFileSync(zitools_with_cache_path, JSON.stringify(zitools_cache))
}
