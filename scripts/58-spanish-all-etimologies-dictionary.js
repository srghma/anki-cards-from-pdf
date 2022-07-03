etimologias_with_ru_cache = JSON.parse(fs.readFileSync('/home/srghma/projects/anki-cards-from-pdf/html/spanish/etimologias_with_ru_cache.json'))

etimologias_with_ru_cache.filter(x => x.keys.length > 1)
