const R = require('ramda')
const RA = require('ramda-adjunct')
const fetch = require('node-fetch')
const HttpsProxyAgent = require('https-proxy-agent');
const fs = require('fs');
const { mkQueue } = require('./mkQueue');

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

// proxy-lists getProxies --protocols="http,https" --output-file="proxies.txt"

proxies = fs.readFileSync("/home/srghma/projects/anki-cards-from-pdf/proxies.txt").toString().split('\n').map(x => x.trim()).filter(x => x)

// const { JsonlDB } = require('@alcalzone/jsonl-db')
// const db = new JsonlDB('/home/srghma/projects/anki-cards-from-pdf/good_proxies.json')
// await db.open()

;(async function updateProxies() {
  // const proxies_ = R.fromPairs(proxies.map(x => [x, "not_yet_tested"])) // "tested_and_working", "tested_and_not_working"

  const removeProxy = proxy => { proxies = proxies.filter(p => p !== proxy) }
  const syncProxy = async () => {
    console.log('syncing')
    await require('fs/promises').writeFile("/home/srghma/projects/anki-cards-from-pdf/proxies.txt", proxies)
  }

  // const findObjectKeyByFirstMatchingValue = (fn, object) => Object.keys(object).find(key => fn(object[key]))
  // const getProxy = () => { const key = findObjectKeyByFirstMatchingValue(x => x === "not_yet_tested", proxies_); proxies_[key] = "pending"; return key }
  // const setStatusProxy = (proxy, status) => { proxies_[proxy] = status }

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

  let removeProxy__every_counter = 0
  async function test(proxy, inputIndex) {
    const fetchWithProxy = (str, options, proxy) => fetch(str, { ...options, agent: new HttpsProxyAgent(`http://${proxy}`) })
    const str = '膛'
    let r = null
    let t = null
    try {
      r = await fetchWithProxy(`https://zi.tools/api/zi/${encodeURIComponent(str)}`, req_options, proxy)
      console.log({ proxy, s: r.status })
      if (r.status === 200) {
        t = await r.json()
        // setStatusProxy(proxy, "tested_and_working");
      } else {
        t = await r.text()
      }
    } catch (e) {
      // setStatusProxy(proxy, "tested_and_not_working");
      console.error(e)
    }
    const status = r ? r.status : null

    if (status !== 200) {
      removeProxy(proxy)
      removeProxy__every_counter++
      if (removeProxy__every_counter % 10 === 0) {
        await syncProxy()
      }
    }

    return { proxy, inputIndex, status, t }
  }
  // for (const proxy of proxies) { }

  const queueSize = 2000
  await mkQueue(queueSize).addAll(Object.keys(proxies).map((proxy, inputIndex) => async jobIndex => { await test(proxy, inputIndex) }))

  // const buffer = await Promise.all(proxies.map(test))
  // const valid = buffer.filter(x => x.s === 200).map(x => x.proxy).join('\n')
  const valid = R.toPairs(proxies).filter(([k, v]) => v === "tested_and_working").map(([k, v]) => k).join('\n')
  fs.writeFileSync("/home/srghma/projects/anki-cards-from-pdf/proxies.txt", valid)
  console.log(valid)
})();
