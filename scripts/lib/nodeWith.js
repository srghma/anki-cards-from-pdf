const R = require('ramda')

const nodeWith = R.curryN(3, (nodeName, props, content) => {
  if (props) {
    if (Array.isArray(props)) {
      props = props.join(' ')
    } else {
      props = R.toPairs(props)

      props = props.map(([k, v]) => {
        if (Array.isArray(v)) { v = v.join(' ') }
        return `${k}="${v}"`
      }).join(' ')
    }

    if (props.length == 0) {
      props = null
    }
  }

  return `<${nodeName}${props ? ' ' + props : ''}>${content}</${nodeName}>`
})

exports.nodeWith = nodeWith
