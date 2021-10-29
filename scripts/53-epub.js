const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const removeHTML = require('./scripts/lib/removeHTML').removeHTML
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const purplecultureMarkedToNumbered = require('./scripts/lib/purplecultureMarkedToNumbered').purplecultureMarkedToNumbered
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const mkQueue = require('./scripts/lib/mkQueue').mkQueue
const mapWithForEachToArray = require('./scripts/lib/mapWithForEachToArray').mapWithForEachToArray
const arrayToRecordByPosition = require('./scripts/lib/arrayToRecordByPosition').arrayToRecordByPosition
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);

function parse(epub) {
  return new Promise((resolve, reject) => {
    epub.on("error", function(error) {
      console.log("ERROR\n-----")
      throw error
    })

    epub.on("end", function(error){
      if (error) { reject({ on: "end", error }) }
      else { resolve() }
    })

    epub.parse()
  })
}

function getChapter(epub, id) {
  return new Promise((resolve, reject) => {
    epub.getChapter(id, function(error, data){
      if(error){
        reject(error)
        return
      }
      resolve(data)
    })
  })
}

function getFile(epub, id) {
  return new Promise((resolve, reject) => {
    epub.getFile(id, function(error, data){
      if(error){
        reject(error)
        return
      }
      resolve(data)
    })
  })
}

function getImage(epub, id) {
  return new Promise((resolve, reject) => {
    epub.getImage(id, function(error, data, mimeType){
      if(error){
        reject(error)
        return
      }
      resolve({ data, mimeType })
    })
  })
}

var EPub = require("epub")

var epub = new EPub("elon-musk.epub", "/imagewebroot/", "/articlewebroot/")

const parseResult = await parse(epub)

console.log(parseResult)
console.log("METADATA:\n")
console.log(epub.metadata)

console.log("\nSPINE:\n")
console.log(epub.flow)

console.log("\nTOC:\n")
console.log(epub.toc)

data = await getFile(epub, epub.spine.contents[2].id)

image = await getImage(epub, 'x001.jpg')

output = '/home/srghma/projects/anki-cards-from-pdf/html/elon-musk'

await (require('mkdirp'))(output)

R.toPairs(epub.manifest).forEach(([id, data]) => {
  if (data['media-type'] !== 'image/jpeg') { return }

})
