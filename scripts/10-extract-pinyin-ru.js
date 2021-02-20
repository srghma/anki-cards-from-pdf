const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/Chinese_ Sherlock.txt').pipe(csv({ separator: "\t", headers: [ "id", "hanzi", "ruby" ] })))

function exRu(text) {
  text.match(/"singlebk".+?"singlebk"/g).map((s) => {
    return s.match(/pinyin-ru">(.+?)<\/span/)
  })
}

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(text);

function removeAllNodes(elements) {
  elements.forEach(e => {
    e.parentNode.removeChild(e);
  })
}

dom.window.document.body.innerHTML
removeAllNodes(dom.window.document.querySelectorAll('.pinyin-marked'))

exRu(input[0].ruby)
