input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji", "freq" ] })))

;(function(input){
  const header = Object.keys(input[0]).map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(input.map(x => ({ old: x.kanji, new: x.kanji.trim() })));

console.log("\ninput = JSON.parse('" + JSON.stringify(input.map(x => x.kanji)) + "')")

fullinput = fullinputstr.split(",").map(x => x.trim()).sort()

output = { wiki: {}, slide: {} }
stop_ = false

// input_ = input.filter(x => x.length > 1).map(x => x.trim())

// https://stackoverflow.com/questions/11849562/how-to-save-the-output-of-a-console-logobject-to-a-file
console.save(JSON.stringify(output, null, 1))

;(async function() {
  const pageType = "slide"
  const input_ = fullinput
  if (!output[pageType]) { output[pageType] = {} }
  const output_ = output[pageType]
  function req(x) {
    return fetch(`http://hanzi.su/${pageType}/${encodeURIComponent(x)}`, {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "upgrade-insecure-requests": "1"
      },
      "referrer": `http://hanzi.su/`,
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    });
  }
  for (let i = 0; i < input_.length; i++) {
    const kanji = input_[i].trim()
    if (stop_) {
      console.log({ m: "stopping", kanji, i })
      break
    }
    const ret = output_[kanji]
    console.log({ kanji, ret, i, l: input_.length })
    if (ret) {
      console.log({ m: "already processed", kanji, i, ret })
      continue
    }
    let res = null
    try {
      res = await req(kanji)
    } catch (e) {
      console.error({ kanji, i, e })
      continue
    }
    console.log({ kanji, res, i, l: input_.length })
    output_[kanji] = res
  };
})();

input = output
output = { wiki: {}, slide: {} }
Object.entries(input.slide).forEach(async ([k, v]) => {
  try {
    output.slide[k] = await v.text()
  } catch (e) {
    console.error({ k, v, e })
  }
})

/////////////////////
