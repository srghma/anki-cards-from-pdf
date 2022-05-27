verbs = fs.readFileSync('spanish-verbs.txt').toString()
verbs = verbs.trim().split('\n')
verbs = R.splitWhenever(x => x == '', verbs)
verbs = verbs.map(([type, ...verbs]) => ({ type: type.toLowerCase(), verbs: verbs.map(x => x.split('|')) }))
// verbs[0].verbs
verbs = verbs.map(({ type, verbs }) => verbs.map(([spanish, en, googleRu]) => ({ ...(esAndGoogleTranslationsMap[spanish.replace('í', 'i')] || { googleRu }), type, spanish, en, id: spanish.replace('í', 'i') }))).flat()
// verbs.filter(x => !x.googleRu)

console.log(R.uniq(verbs.map(x => x.type)).sort().map(x => `my spanish verbs 1000::${x}`).join('\n'))

require('csv-writer').createObjectCsvWriter({ path: '/home/srghma/Downloads/output.txt', header: ["id", "en", "spanish", "_prompt", "_image",  "_a_en", "_a_tr", "_section", "_topic", "type", "googleRu", "etimologyEs", "etimologyRu", "ru", "conjugations"].map(x => ({ id: x, title: x })) }).writeRecords(verbs).then(() => { console.log('...Done') })
