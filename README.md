# fastest-csv ⚡

> 轻量，极速，0依赖。<br>
> Lightweight, blazing fast, zero dependencies.

## Benchmark

```
12.4MB CSV, 100000 rows, 10 cols (50% "quotes")

fastest-csv  ██████████                   315ms  🏆  39 MB/s
PapaParse    ██████████████               433ms  1.4x slower
csv-parse    ███████████████████████████  840ms  2.7x slower
```

## Quick Start

```bash
npm install fastest-csv
```

```js
import { parseCSV } from 'fastest-csv'

const { headers, rows } = parseCSV(`name,age,city
Alice,30,New York
Bob,25,London`)

// headers: ['name', 'age', 'city']
// rows: [
//   { name:'Alice', age:'30', city:'New York' },
//   { name:'Bob', age:'25', city:'London' }
// ]
```

## API

```js
parseCSV(text, options?)
```

| 参数<br>Param | 类型<br>Type          | 默认值<br>Default | 说明<br>Description                                       |
| ------------- | --------------------- | ----------------- | --------------------------------------------------------- |
| `text`        | `string`              | `''`              | CSV 文本<br>CSV text                                      |
| `separator`   | `string`              | `','`             | 列分隔符，任意单字符<br>Column delimiter, any single char |
| `headers`     | `string[]`            | `[]`              | 预设表头<br>Preset headers                                |
| `onHeader`    | `(v, k, i) => string` | `String`          | 表头转换钩子<br>Header transform hook                     |
| `onValue`     | `(v, k, i) => any`    | `String`          | 值转换钩子<br>Value transform hook                        |

**return** `{ headers: string[], rows: Record<string, any>[] }`

## Recipes

```js
// 自动转类型 - Auto-type on parse
parseCSV('name,age\nAlice,18', {
  onValue: (v) => (isNaN(v) ? v : Number(v)),
})

// 重命名表头 - Rename headers
parseCSV('name,age\nAlice,18', {
  onHeader: (h) => h.toLowerCase(),
})

// 预设表头 - Preset headers
parseCSV('Alice,18', { headers: ['name', 'age'] })

// 任意分隔符 - Any delimiter
parseCSV('a;b;c\n1;2;3', { separator: ';' })
```

## Features

- ✅ 标准 CSV - Standard CSV
- ✅ 任意分隔符 - Any delimiter
- ✅ 引号字段 - Quoted fields
- ✅ 转义引号 `""` → `"` - Escaped quotes
- ✅ 引号内换行 - Newlines in quotes
- ✅ 换行符全兼容 `\n` `\r\n` `\r` - All line endings
- ✅ 转换钩子 `onHeader` `onValue` - Transform hooks
- ✅ 零依赖 - Zero dependencies
- ✅ 浏览器 / Node.js / Deno / Bun - Any JS runtime
- ✅ ES Module
- ✅ TypeScript

## Test

```bash
node --test src/fastest-csv.test.js
```

60 个用例，全部代码分支覆盖，全绿。<br>
60 test cases, all branches covered, all green.

## License

MIT
