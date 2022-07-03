// alreadyProcessed = require('/home/srghma/Downloads/console.json')
// last = Object.keys(alreadyProcessed)
// last = last[last.length - 1]
// input = esAndGoogleTranslations.map(x => x.es)
// lastIndexInInput = input.findIndex(x => x === last)
// input_ = input.splice(0, lastIndexInInput + 1)
// input_.forEach(x => {
//   if (!alreadyProcessed[x]) {
//     alreadyProcessed[x] = null
//   }
// })
// await fs.promises.writeFile('/home/srghma/Downloads/console.json', JSON.stringify(alreadyProcessed))

alreadyProcessed1 = JSON.parse(fs.readFileSync('/home/srghma/Downloads/console (1).json').toString())
alreadyProcessed2 = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/etimologias_cache--urls.json').toString())
function cleanObject(jsonObject) {
  var clone = JSON.parse(JSON.stringify(jsonObject))
  for(var prop in clone)
      if(clone[prop] == null)
          delete clone[prop];
  return clone;
}
alreadyProcessed = { ...alreadyProcessed1, ...alreadyProcessed2 }
await fs.promises.writeFile('/home/srghma/projects/anki-cards-from-pdf/etimologias_cache--urls--with-nulls.json', JSON.stringify(alreadyProcessed, undefined, 2))
await fs.promises.writeFile('/home/srghma/projects/anki-cards-from-pdf/html/spanish/etimologias_cache--urls--without-nulls.json', JSON.stringify(cleanObject(alreadyProcessed)))
// values = R.uniq(Object.values(alreadyProcessed)).sort()

// const etimologias_with_cache_path = '/home/srghma/projects/anki-cards-from-pdf/etimologias_cache.json'
// let etimologias_cache = {}
// try { etimologias_cache = JSON.parse(fs.readFileSync(etimologias_with_cache_path).toString()); null } catch (e) {  }
// alreadyProcessed_ = [...Object.keys(etimologias_cache), ...Object.keys(alreadyProcessed)]
// alreadyProcessed_ = R.uniq(alreadyProcessed_).sort()
// input_ = esAndGoogleTranslations.map(x => x.es)
// input_ = R.without(alreadyProcessed_, input_)
// input_ = input_.sort()
// console.log("\ninput = JSON.parse('" + JSON.stringify(input_) + "')")

console.log("\ninput = JSON.parse('" + JSON.stringify(R.without(R.keys(alreadyProcessed), elonMuskWords)) + "')")


// i = 'abandonado'
// response = await fetch("http://etimologias.dechile.net/", { "headers": { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", "accept-language": "es-ES,es;q=0.9,en;q=0.8,ru;q=0.7", "cache-control": "no-cache", "content-type": "application/x-www-form-urlencoded", "pragma": "no-cache", "upgrade-insecure-requests": "1" }, "referrer": "http://etimologias.dechile.net/?abandonar", "referrerPolicy": "strict-origin-when-cross-origin", "body": `Busca=${i}&x=0&y=0`, "method": "POST", "mode": "cors", "credentials": "include" })
// buffer = await response.arrayBuffer()
// decoder = new TextDecoder('windows-1252')
// text = decoder.decode(buffer)
// console.log(text)

output_ = {}
stop_ = false
;(async function() {
  const range = ({from = 0, to, step = 1, length = Math.ceil((to - from) / step)}) => Array.from({length}, (_, i) => from + i * step)
  function partition(list = [], n = 1) {
    const isPositiveInteger = Number.isSafeInteger(n) && n > 0;
    if (!isPositiveInteger) {
      throw new RangeError('n must be a positive integer');
    }
    const q = Math.floor( list.length / n );
    const r = list.length % n;
    let i   ; // denotes the offset of the start of the slice
    let j   ; // denotes the zero-relative partition number
    let len ; // denotes the computed length of the slice
    const partitions = [];
    for ( i=0, j=0, len=0; i < list.length; i+=len, ++j ) {
      len = j < r ? q+1 : q ;
      partitions.push(range({ from: i, to: i+len })) ;
    }
    return partitions;
  }
  // partition([1,2,3,4,5,6,7,8,9,10], 3)
  // partition([1,2,3,4,5,6,7,8,9,10,11], 3)
  // partition([1,2,3,4,5,6,7,8,9,10,11,12], 3)
  // partition([1,2,3,4,5,6,7,8,9,10,11,12,13], 3)
  // partition([1,2,3,4,5,6,7,8,9,10,11,12,13], 1)
  function req(i) {
    return fetch("http://etimologias.dechile.net/", { "headers": { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", "accept-language": "es-ES,es;q=0.9,en;q=0.8,ru;q=0.7", "cache-control": "no-cache", "content-type": "application/x-www-form-urlencoded", "pragma": "no-cache", "upgrade-insecure-requests": "1" }, "referrer": "http://etimologias.dechile.net/?abandonar", "referrerPolicy": "strict-origin-when-cross-origin", "body": `Busca=${i}&x=0&y=0`, "method": "POST", "mode": "cors", "credentials": "include" })
  }
  partition(input, 4).forEach(async (indexes, partitionIndex) => {
    for (const index of indexes) {
      const debug = { partitionIndex, index, l: input.length }
      const element = input[index].trim()
      if (stop_) {
        console.log({ m: "stopping", element, index })
        break
      }
      const ret = output_[element]
      console.log({ element, ret, ...debug })
      if (ret) {
        console.log({ m: "already processed", element, ret, ...debug })
        continue
      }
      try {
        let res = await req(element)
        res = res.url.split('?')[1]
        console.log({ element, res, ...debug })
        output_[element] = res
      } catch (e) {
        console.error({ element, e, ...debug })
        output_[element] = null
      }
    }
  })
})();

Object.keys(output_).length

(function(console){
console.save = function(data, filename){
    if(!data) {
        console.error('Console.save: No data')
        return;
    }
    if(!filename) filename = 'console.json'
    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4)
    }
    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')
    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
 }
})(console)
// https://stackoverflow.com/questions/11849562/how-to-save-the-output-of-a-console-logobject-to-a-file
console.save(JSON.stringify(output_, null, 1))
