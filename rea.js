function Rea(options) {
  const computedMap = {}
  const modelListener = []
  const templateMap = new Map()

  const proxy = new Proxy(options.data, {
    set(target, propKey, value, receiver) {
      if (Array.isArray(value)) {
        value = new Proxy(value, {
          set(_target, _propKey, _value, _receiver) {
            setTimeout(() => {
              proxy[propKey] = _target.slice()
            })
            return Reflect.set(_target, _propKey, _value, _receiver)
          }
        })
      }
      setTimeout(() => {
        const nodes = document.querySelectorAll(`[r-${propKey}]`)
        for (let node of nodes || []) {
          node.textContent = value
        }

        const showNodes = document.querySelectorAll(`[r-show-${propKey}]`)
        for (let node of showNodes || []) {
          if (value) node.style.display = ''
          else node.style.display = 'none'
        }

        const modelNodes = document.querySelectorAll(`[r-model-${propKey}]`)
        for (let node of modelNodes || []) {
          node.value = value
          if (!modelListener.includes(node)) {
            modelListener.push(node)
            node.addEventListener('input', () => {
              proxy[propKey] = node.value
            })
          }
        }

        const forNodes = document.querySelectorAll(`[r-for-${propKey}]`)
        for (let node of forNodes || []) {
          if (!templateMap.get(node)) {
            templateMap.set(node, node.innerHTML || '<div>r-prop</div>')
          }
          node.innerHTML = value
            .map((m, i) =>
              templateMap
                .get(node)
                .replace(/r-prop-(\w+)/g, (_, key) => m[key])
                .replace(/r-prop/g, m)
                .replace(/r-event="/g, 'r-event="' + i + ':')
            )
            .join('')

          const eventNodes = node.querySelectorAll('[r-event]')
          for (let eNode of eventNodes || []) {
            const [index, name, method] = eNode.getAttribute('r-event').split(':')
            eNode.addEventListener(name, event => {
              proxy[method](event, +index)
            })
          }
        }

        for (let item of computedMap[propKey] || []) {
          proxy[item] = options.computed[item].call(proxy)
        }
      })

      return Reflect.set(target, propKey, value, receiver)
    }
  })

  for (let key in options.data) {
    proxy[key] = options.data[key]
  }

  for (let key in options.computed) {
    const initProxy = new Proxy(options.data, {
      get(target, propKey, receiver) {
        if (!computedMap[propKey]) computedMap[propKey] = new Set()
        computedMap[propKey].add(key)
        return Reflect.get(target, propKey, receiver)
      }
    })
    proxy[key] = options.computed[key].call(initProxy)
  }

  for (let key in options.methods) {
    proxy[key] = options.methods[key].bind(proxy)
  }

  const eventNodes = document.querySelectorAll('[r-event]')
  for (let node of eventNodes || []) {
    const [name, method] = node.getAttribute('r-event').split(':')
    node.addEventListener(name, proxy[method])
  }
}
