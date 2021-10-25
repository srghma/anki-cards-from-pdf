const csv = require('csv-parser')
const fs = require('fs')
let results = [];
let headers = [
  "kanji",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "chinese_mnemonics_deck__equiv",
  "tags"
]
fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: '\t', headers })).on('data', (data) => results.push(data)).on('end', () => { console.log(results); })

let results_ = results.filter((x) => x["kanji"].includes("・"))

changed = []
results_.forEach(x => {
  [...x["kanji"]].forEach(k => {
    if (k == "・") { return }

    console.log(k)

    const res = results.find(x => x["kanji"] == k)

    console.log(res)

    if (!res) { return }

    const res_copy = JSON.parse(JSON.stringify(res))

    headers.filter(x => x != "kanji").forEach(header => {
      if (res_copy[header] == x[header]) { return }
      console.log({ before: res_copy[header], plus: x[header] })
      res_copy[header] = [res_copy[header], x[header]].filter(x => x != null).join('\n')
    })

    headers.forEach(header => {
      res_copy[header] = res_copy[header].trim()
    })

    changed.push(res_copy)
  })
})

const createCsvWriter = require('csv-writer').createObjectCsvWriter
createCsvWriter({ path: '/home/srghma/Downloads/All Kanji.txt', header:  headers.map(x => ({ id: x, title: x })) }).writeRecords(changed).then(() => { console.log('...Done') })
