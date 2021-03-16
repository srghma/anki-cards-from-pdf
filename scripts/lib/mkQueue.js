function waitUntil(checkCondition) {
  return new Promise(resolve => {
    const condition = checkCondition()

    if (condition) {
      resolve(condition)
      return
    }

    const interval = setInterval(() => {
      const condition = checkCondition()

      if (condition === false) { return }

      clearInterval(interval)

      resolve(condition)
    }, 0)
  })
}

function mkQueue(max) {
  const runningPromises = new Array(max)

  async function waitForFreeJobIndex() {
    return waitUntil(() => {
      const freeJobIndex = runningPromises.findIndex(x => x === undefined)

      // console.log({ m: "waitForFreeJobIndex", freeJobIndex })

      if (freeJobIndex >= 0) { return freeJobIndex }

      return false
    })
  }

  return {
    addAll: async function(promiseGeneratorArray) {
      // const successes = []
      // const errors = []

      let arrayIndex = 0;

      while(promiseGenerator = promiseGeneratorArray[arrayIndex++]){
        const freeJobIndex = await waitForFreeJobIndex()
        // console.log({ m: "while", index, freeJobIndex })

        const runningPromise = promiseGenerator(freeJobIndex, arrayIndex)

        runningPromises[freeJobIndex] = runningPromise

        runningPromise
          // .then(x => {
          //   successes.push(x)
          // })
          // .catch(e => {
          //   errors.push(e)
          // })
          .finally(() => {
            runningPromises[freeJobIndex] = undefined
          })
      }

      // return { successes, errors }
    }
  }
}

exports.mkQueue = mkQueue
