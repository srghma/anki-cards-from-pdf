const fetch = require('node-fetch')
const readStreamArray = require('./scripts/lib/readStreamArray').readStreamArray
const rubyToDifferentPinyin = require('./scripts/lib/rubyToDifferentPinyin').rubyToDifferentPinyin
const checkDuplicateKeys = require('./scripts/lib/checkDuplicateKeys').checkDuplicateKeys
const fixRadicalToKanji = require('./scripts/lib/fixRadicalToKanji').fixRadicalToKanji
const isHanzi = require('./scripts/lib/isHanzi').isHanzi
const csv = require('csv-parser')
const fs = require('fs')
const R = require('ramda')
const RA = require('ramda-adjunct')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(``);
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: "annular-form-299211"});
const easypronunciation_chinese = require('./scripts/lib/easypronunciation_chinese').easypronunciation_chinese
const processPurpleculture = require('./scripts/lib/processPurpleculture').processPurpleculture
