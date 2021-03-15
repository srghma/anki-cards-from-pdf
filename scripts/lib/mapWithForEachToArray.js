function mapWithForEachToArray(xs, fn) {
  const output = []
  xs.forEach(x => output.push(fn(x)))
  return output
}

exports.mapWithForEachToArray = mapWithForEachToArray
