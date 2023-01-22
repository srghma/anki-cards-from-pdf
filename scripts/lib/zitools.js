const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const mapWithForEachToArray = require('./mapWithForEachToArray').mapWithForEachToArray
const HttpsProxyAgent = require('https-proxy-agent');

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

exports.zitools_with_cache = async function zitools_with_cache(db, sentence) {
  if (db.has(sentence)) {
    return { from_cache: true, value: db.get(sentence) }
  }
  const value = await exports.zitools(sentence)
  db.set(sentence, value);
  return { from_cache: false, value }
}
