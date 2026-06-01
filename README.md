# ⚡ fastest-csv

> 快到离谱的 CSV 解析器，100多行代码，零依赖，一个文件搞定一切。  
> Absurdly fast CSV parser. 124 lines. Zero deps. One file does it all.

[![node](https://img.shields.io/badge/node-≥18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## ⚡ 实测速度 - Benchmark

> 测试文件: 6.5MB CSV, 59538 行, 13 列, Node.js v24  
> Test: 6.5MB CSV, 59538 rows, 13 cols, Node.js v24

```
fastest-csv  ████████████████████  197ms  🏆
PapaParse    ████████████████████████  257ms  1.3x slower
csv-parse    ████████████████████████████████████████████████  511ms  2.6x slower
```

---

## 这是什么 - What is this?

**100多行**，**<1KB gzip**，**零依赖**，**一个文件**。  
**100+ lines**, **<1KB gzip**, **zero dependencies**, **one file**.

装上就跑，不用配构建，不用看文档（但你正在看）。  
Install and go. No build config. No docs needed (but here you are).

**逐字符解析**，没有正则，没有 split，没有中间商赚差价。  
**Char-level parsing**. No regex. No split. No middlemen.

浏览器能用，Node.js 能用，Deno/Bun 能用，**哪都能用**。  
Browser, Node.js, Deno/Bun — **it works everywhere**.

```js
import parseCSV from 'fastest-csv'

const { headers, rows } = parseCSV(`name,age,city
Alice,30,New York
Bob,25,London`)

// headers → ['name', 'age', 'city']
// rows    → [{ name:'Alice', age:'30', city:'New York' }, ...]
```

**就这样。** 没有 Schema 定义，没有 Transformer 管道，没有 200KB 的 node_modules。  
**That's it.** No schema definitions. No transformer pipelines. No 200KB node_modules.

---

## 为什么要用它 - Why this over alternatives?

| | fastest-csv | csv-parse | PapaParse |
|---|---|---|---|
| 零依赖<br>Zero deps | ✅ | ❌ (7+) | ❌ (1) |
| 单文件<br>Single file | ✅ | ❌ | ❌ |
| 体积<br>Bundle size | **<1KB gzip** | ~200KB | ~60KB |
| 安装即用<br>Zero config | ✅ | ❌ | ❌ |
| 解析方式<br>Parsing | 逐字符<br>Char-level | 流式<br>Stream | 正则<br>Regex |
| 回调钩子<br>Hooks | ✅ `onHeader` `onValue` | ❌ | ❌ |
| 浏览器<br>Browser | ✅ 原生<br>Native | ❌ | ✅ |
| Node.js | ✅ | ✅ | ✅ |
| Deno / Bun | ✅ | ❌ | ✅ |
| TypeScript 类型<br>TS types | ✅ | ✅ | ✅ |

> 你的场景是 **解析一小段 CSV 然后拿到对象数组**？这就是最短路径。  
> Need to **parse CSV text into objects**? This is the shortest path.

---

## 安装 - Install

```bash
npm install fastest-csv
```

一个包，一条命令，没有然后。  
One package. One command. That's it.

---

## API

```
parseCSV(text, options?)
```

| 参数<br>Param | 类型<br>Type | 默认值<br>Default | 说明<br>Description |
|---|---|---|---|
| `text` | `string` | `''` | CSV 文本<br>CSV text |
| `separator` | `string` | `','` | 列分隔符，任意单字符<br>Column delimiter, any single char |
| `headers` | `string[]` | `[]` | 预设表头，跳过首行<br>Preset headers, skip first row |
| `onHeader` | `(name, value, col) => string` | — | 表头转换回调<br>Header transform hook |
| `onValue` | `(name, value, col) => any` | — | 值转换回调<br>Value transform hook |

**返回值** `{ headers: string[], rows: Record<string, any>[] }`  
**Returns:** `{ headers: string[], rows: Record<string, any>[] }`

---

## 用法 - Recipes

### 🔧 任意分隔符  
Any delimiter

```js
parseCSV('a;b;c\n1;2;3', { separator: ';' })
// → { headers: ['a','b','c'], rows: [{ a:'1', b:'2', c:'3' }] }

parseCSV('a\tb\tc\n1\t2\t3', { separator: '\t' })
// → 同样搞定，Tab 分隔也行

parseCSV('a|b|c\n1|2|3', { separator: '|' })
// → 竖线、波浪号、井号... 什么都行
```

### 🔢 解析时自动转类型  
Auto-type on parse

```js
parseCSV('name,age,active\nAlice,30,true', {
  onValue: (name, value) => {
    if (value === 'true') return true
    if (value === 'false') return false
    const n = Number(value)
    return Number.isNaN(n) ? value : n
  },
})
// → [{ name: 'Alice', age: 30, active: true }]
//    字符串？数字？布尔？一次性全转了
```

### 🔤 一行重命名所有表头  
Rename all headers in one shot

```js
parseCSV('firstName,lastName\nJohn,Doe', {
  onHeader: (h) => h.replace(/([A-Z])/g, '_$1').toLowerCase(),
})
// → { headers: ['first_name', 'last_name'], ... }
//    camelCase → snake_case，一行搞定
```

### 📋 自定义表头，跳过 CSV 表头行  
Preset headers, skip CSV header row

```js
parseCSV('John,Doe,30', { headers: ['first', 'last', 'age'] })
// → { headers: ['first','last','age'], rows: [{ first:'John', last:'Doe', age:'30' }] }
//    CSV 没表头？你说了算
```

### 📝 引号内随便写  
Quotes let you put anything inside

```js
parseCSV('name,bio\nAlice,"likes\nnewlines,commas"')
// → [{ name:'Alice', bio:'likes\nnewlines,commas' }]
//    换行、逗号、引号？引号里都是自由的
```

### 🔗 onHeader + onValue 组合拳  
Hook combo

```js
parseCSV('name,score\nAlice,95', {
  onHeader: (h) => h.toUpperCase(),
  onValue: (name, v) => name === 'SCORE' ? +v : v,
})
// → { headers:['NAME','SCORE'], rows:[{ NAME:'Alice', SCORE:95 }] }
//    解析即转换，省掉所有后处理
```

---

## 特性 - Features

| | |
|---|---|
| ✅ 标准 CSV<br>Standard CSV | ✅ 任意分隔符<br>Any delimiter |
| ✅ 引号字段<br>Quoted fields | ✅ 转义引号 `""` → `"`<br>Escaped quotes |
| ✅ 引号内换行<br>Newlines in quotes | ✅ `\n` `\r\n` `\r` 全兼容<br>All line endings |
| ✅ `onHeader` / `onValue` 钩子<br>Hooks | ✅ 预设表头<br>Preset headers |
| ✅ ES Module | ✅ TypeScript 类型<br>Type annotations |
| ✅ 零依赖<br>Zero dependencies | ✅ 100多行<br>100+ lines |
| ✅ 浏览器<br>Browser | ✅ Node.js |
| ✅ Deno / Bun | ✅ 任何 JS 运行时<br>Any JS runtime |

---

## 测试 - Test

```bash
node --test src/fastest-csv.test.js
```

**60 个用例，覆盖全部代码分支，全绿。**  
**60 test cases, all code branches covered, all green.**

**不是"基本能用"，是"怎么用都对"。**  
**Not "it works" — it's "it works no matter how you use it".**

---

## License

MIT
