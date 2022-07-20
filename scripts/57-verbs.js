popularVerbs = fs.readFileSync('spanish-verbs.txt').toString()
popularVerbs = popularVerbs.trim().split('\n')
popularVerbs = R.splitWhenever(x => x == '', popularVerbs)
popularVerbs = popularVerbs.map(([type, ...verbs]) => ({ type: type.toLowerCase(), verbs: verbs.map(x => x.split('|')) }))

// // verbs[0].verbs
// verbs = verbs.map(({ type, verbs }) => verbs.map(([spanish, en, googleRu]) => ({ ...(esAndGoogleTranslationsMap[spanish.replace('í', 'i')] || { googleRu }), type, spanish, en, id: spanish.replace('í', 'i') }))).flat()
// // verbs.filter(x => !x.googleRu)

// console.log(R.uniq(verbs.map(x => x.type)).sort().map(x => `my spanish verbs 1000::${x}`).join('\n'))

// require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["id", "en", "spanish", "_prompt", "_image",  "_a_en", "_a_tr", "_section", "_topic", "type", "googleRu", "etimologyEs", "etimologyRu", "ru", "conjugations"].map(x => ({ id: x, title: x })) }).writeRecords(verbs).then(() => { console.log('...Done') })

popularVerbsMap = popularVerbs.map(({ type, verbs }) => verbs.map(([spanish, en]) => ({ id: spanish.replace('í', 'i'), spanish, en, type }))).flat()
popularVerbsMap = popularVerbsMap.map(({ spanish, en, type }) => [spanish, { en, type }])
popularVerbsMap = R.fromPairs(popularVerbsMap)

verbs = esAndGoogleTranslations.filter(x => x.conjugations)
verbs = verbs.map(x => ({ ...x, isPopular:  }))
