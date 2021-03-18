exports.readStreamArray = function readStreamArray(stream) {
  return new Promise((resolve, reject) => {
    const data = []

    stream.on("data", chunk => data.push(chunk))
    stream.on("end", () => resolve(data))
    stream.on("error", error => reject(error))
  })
}
