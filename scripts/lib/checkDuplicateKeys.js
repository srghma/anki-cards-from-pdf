function checkDuplicateKeys(arr) {
  const counts = {}
  return arr.filter((item) => {
    counts[item] = counts[item] || 1
    if (counts[item]++ === 2) return true
  })
}

exports.checkDuplicateKeys = checkDuplicateKeys
