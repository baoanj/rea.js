![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6a4cdc9198e54c409ad9ff5ab04a0854~tplv-k3u1fbpfcp-watermark.image?)

# Rea.js 一个适合用于写原生 demo 的极简响应式 js 框架

- 隐藏 DOM 操作，简化写原生 HTML/CSS/JavaScript Demo 操作

- 使用了 Proxy Map 箭头函数，所以需要浏览器支持 ES2015

- rea.js 代码不到100行，压缩后 rea.min.js 仅 1.36 KB

- 实现原理是借助 HTML 属性 和 JavaScript Proxy 实现侦听数据变化操作 DOM

## 使用

```html
<script src="https://baoanj.github.io/rea.js/rea@0.0.1.min.js"></script>
```

使用方式和 Vue 比较类似。

指令（HTML 属性）支持：
- `r-变量`
- `r-show-变量`
- `r-model-变量`
- `r-for-变量`
  - `r-prop-属性`
- `r-event="事件:方法"`

配置（options）支持：
- `data`
- `computed`
- `methods`

```html
<div>
  <input type="text" placeholder="开启你的待办事项" maxlength="20" r-model-todoName>
  <span r-show-isShowLimit r-todoNameLimit></span>
  <select r-model-todoType r-for-typeList>
    <option value="r-prop-value">r-prop-label</option>
  </select>
  <input type="datetime-local" r-model-todoTime>
  <button r-event="click:addTodo">添加待办</button>
  <span r-show-todoTip r-todoTip></span>
</div>
<div r-for-todoListFormat>
  <div class="todo-item todo-item-r-prop-check">
    <div r-event="click:checkTodo" class="todo-item-check todo-item-check-r-prop-check"></div>
    <span>r-prop-name</span>
    <span>r-prop-type</span>
    <span>r-prop-time</span>
    <button r-event="click:delTodo">删除</button>
  </div>
</div>

<script src="https://baoanj.github.io/rea.js/rea@0.0.1.min.js"></script>
<script>
  Rea({
    data: {},
    computed: {},
    methods: {}
  })
</script>
```

## options

### data

一个对象，放置数据属性。

- - [x] 若数据属性的值为数组，可响应数组变更方法：`push` `pop` `unshift` `shift` `splice` `sort` `reverse` `索引赋值`

- - [ ] 若数据属性的值为对象，暂不支持响应对象内属性值的变化

```js
{
  typeList: [
    { label: '高', value: 'h' },
    { label: '中', value: 'm' },
    { label: '低', value: 'l' }
  ],
  todoName: '',
  todoType: null,
  todoTime: null,
  todoList: [
    { name: 'Todo Example 1', type: 'h', time: '2023-08-12T15:18', check: false },
    { name: 'Todo Example 2', type: 'm', time: '2023-08-12T15:18', check: true }
  ],
  todoTip: ''
}
```

### computed

一个对象，每个计算属性是一个函数，this 为当前实例，可访问当前实例的数据属性、计算属性、方法属性。

```js
{
  isShowLimit() {
    return this.todoName.length > 0
  },
  todoNameLimit() {
    return this.todoName.length + '/20'
  },
  todoListFormat() {
    return this.todoList.map(m => {
      return {
        name: m.name,
        type: this.typeList.find(f => f.value === m.type).label,
        time: m.time.replace('T', ' '),
        check: m.check
      }
    })
  }
}
```

### methods

一个对象，每个方法属性是一个函数，this 为当前实例，可访问当前实例的数据属性、计算属性、方法属性。

```js
{
  addTodo() {
    if (!this.todoName) {
      this.showTip('请填写待办名称')
      return
    }
    if (!this.todoType) {
      this.showTip('请选择优先级')
      return
    }
    if (!this.todoTime) {
      this.showTip('请选择待办时间')
      return
    }
    this.todoList.unshift({
      name: this.todoName,
      type: this.todoType,
      time: this.todoTime,
      check: false
    })
    this.todoName = ''
    this.todoType = null
    this.todoTime = null
  },
  showTip(msg) {
    this.todoTip = msg
    setTimeout(() => {
      this.todoTip = ''
    }, 3000)
  },
  delTodo(event, index) {
    this.todoList.splice(index, 1)
  },
  checkTodo(event, index) {
    this.todoList[index] = Object.assign(this.todoList[index], {
      check: !this.todoList[index].check
    })
  }
}
```

## 指令（HTML 属性）

### `r-变量`

响应变量值的变化，将变量值写到元素的 textContent

```html
<span r-todoNameLimit></span>
```

### `r-show-变量`

响应变量值的变化，若变量值为 falsy，则将元素的 display 设为 none

```html
<span r-show-isShowLimit></span>
```

### `r-model-变量`

双向绑定，既响应变量值的变化，也监听 input 事件改变值

```html
<input type="text" r-model-todoName>
```

### `r-for-变量`

列表渲染，元素的 innerHTML 作为模板项循环渲染，若 innerHTML 为空则默认模板为 `<div>r-prop</div>`

```html
<div r-for-simpleList></div>
```

#### `r-prop-属性`

仅用于 `r-for` 内的模板，在列表渲染时被直接替换为当前项的对应属性值，`r-prop` 则替换为当前项


```html
<select r-model-todoType r-for-typeList>
  <option value="r-prop-value">r-prop-label</option>
</select>

<div r-for-simpleList><span>r-prop</span></div>
```

### `r-event="事件:方法"`

为元素添加事件监听，方法为 methods 声明的方法函数名，方法的参数为原生事件的 event

r-for 里的 r-event 方法有两个参数，第一个是原生事件的 event，第二个是 r-for 的索引

```html
<button r-event="click:addTodo">添加待办</button>

<div r-for-todoListFormat>
  <div>
    <span>r-prop-name</span>
    <span>r-prop-type</span>
    <span>r-prop-time</span>
    <button r-event="click:delTodo">删除</button>
  </div>
</div>
```

```js
methods: {
  addTodo(event) {
    //
  },
  delTodo(event, index) {
    //
  }
}
```

## Demo

[Rea.js Example - Todo List](https://baoanj.github.io/rea.js/)

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f88a38c178884b5793ec5423b8440081~tplv-k3u1fbpfcp-watermark.image?)
