var parser = require('fast-xml-parser');
var he = require('he');
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
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});

xmlData = fs.readFileSync('/home/srghma/Downloads/flash-2104220849.xml').toString()

var options = {
    attributeNamePrefix : "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName : "#text",
    ignoreAttributes : true,
    ignoreNameSpace : false,
    allowBooleanAttributes : false,
    parseNodeValue : true,
    parseAttributeValue : false,
    trimValues: true,
    cdataTagName: "__cdata", //default is 'false'
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    arrayMode: false, //"strict"
    attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
    tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
    stopNodes: ["parse-me-as-string"]
};

// if( parser.validate(xmlData) === true) { //optional (it'll return an object in case it's not valid)
//     var jsonObj = parser.parse(xmlData,options);
// }

// Intermediate obj
var tObj = parser.getTraversalObj(xmlData,options);
var jsonObj = parser.convertToJson(tObj,options);

x = jsonObj.plecoflash.cards.card.map(x => ({ ...x.entry, headword: R.uniq(x.entry.headword) })).filter(x => R.all(x => x.length == 1, x.headword))
x = x.map(R.prop('headword'))
x = R.uniq(x.filter(x => x.length !== 1)).filter(x => x.length !== 1)
x = x.map(x => x.filter(c => c !== '…'))

x_ = x.map(es => es.map(kanji => ({ kanji, es }))).flat()
x_ = R.groupBy(R.prop('kanji'), x_)
x_ = R.map(R.map(R.prop('es')), x_)
x_ = R.map(x => R.uniq(x.flat()), x_)
x_ = R.mapObjIndexed((v, k) => v.filter(x => x !== k), x_)
x_ = R.toPairs(x_).map(x => ({ k: x[0], i: x[1].join('') }))

input = await readStreamArray(fs.createReadStream('/home/srghma/Downloads/All Kanji.txt').pipe(csv({ separator: "\t", headers: [ "kanji" ] })))
input = input.map(R.pick('kanji _17'.split(' ')))
input = input.map(x => ({ k: x.kanji, i: x._17 }))
input = input.filter(x => x.i.length > 0)

x__ = R.mergeWith(
  R.concat,
  R.fromPairs(input.map(x => ([x.k, x.i]))),
  R.fromPairs(x_.map(x => ([x.k, x.i])))
)

x__ = R.toPairs(x__).map(x => ({ k: x[0], i: R.uniq(x[1]).join('') }))

;(function(input){
  let header = R.uniq(R.map(R.keys, input).flat())
  console.log({ header })
  header = header.map(x => ({ id: x, title: x }))
  const s = require('csv-writer').createObjectCsvStringifier({ header }).stringifyRecords(input)
  fs.writeFileSync('/home/srghma/Downloads/Chinese Grammar Wiki2.txt', s)
})(x__);

// x = x.map(({ headword, ...other }) => headword.map(headword => ({ headword, ...other }))).flat()

// x_ = R.groupBy(R.prop('headword'), x)
// x_ = R.map(R.uniq, x_)
// R.toPairs(x_).filter(x => x[1].length !== 1)
