import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseCSV } from './fastest-csv.js'

describe('parseCSV - 基本解析', () => {
  it('解析标准 CSV', () => {
    const result = parseCSV('name,age\nAlice,30\nBob,25')
    assert.deepStrictEqual(result, {
      headers: ['name', 'age'],
      rows: [
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ],
    })
  })

  it('解析单行（仅 header）', () => {
    const result = parseCSV('a,b,c')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b', 'c'],
      rows: [],
    })
  })

  it('解析单列', () => {
    const result = parseCSV('fruit\napple\nbanana')
    assert.deepStrictEqual(result, {
      headers: ['fruit'],
      rows: [{ fruit: 'apple' }, { fruit: 'banana' }],
    })
  })

  it('空字符串返回空结果', () => {
    const result = parseCSV('')
    assert.deepStrictEqual(result, { headers: [], rows: [] })
  })

  it('不传参数返回空结果', () => {
    const result = parseCSV()
    assert.deepStrictEqual(result, { headers: [], rows: [] })
  })
})

describe('parseCSV - 换行符处理', () => {
  it('\\n 换行', () => {
    const result = parseCSV('a,b\n1,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('\\r\\n 换行', () => {
    const result = parseCSV('a,b\r\n1,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('\\r 换行', () => {
    const result = parseCSV('a,b\r1,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('连续换行被忽略（空行跳过）', () => {
    const result = parseCSV('a,b\n\n1,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('末尾无换行也能正确解析', () => {
    const result = parseCSV('a,b\n1,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('末尾有多个换行', () => {
    const result = parseCSV('a,b\n1,2\n\n')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })
})

describe('parseCSV - 自定义分隔符', () => {
  it('分号分隔', () => {
    const result = parseCSV('a;b\n1;2', { separator: ';' })
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('Tab 分隔', () => {
    const result = parseCSV('a\tb\n1\t2', { separator: '\t' })
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('竖线分隔', () => {
    const result = parseCSV('a|b\n1|2', { separator: '|' })
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })
})

describe('parseCSV - 引号字段', () => {
  it('字段被双引号包裹', () => {
    const result = parseCSV('name,desc\nAlice,"hello world"')
    assert.deepStrictEqual(result, {
      headers: ['name', 'desc'],
      rows: [{ name: 'Alice', desc: 'hello world' }],
    })
  })

  it('引号内包含分隔符', () => {
    const result = parseCSV('a,b\n1,"hello,world"')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: 'hello,world' }],
    })
  })

  it('引号内包含换行符', () => {
    const result = parseCSV('a,b\n1,"line1\nline2"')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: 'line1\nline2' }],
    })
  })

  it('引号内的转义引号 "" => "', () => {
    const result = parseCSV('a,b\n1,"say ""hello"" "')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: 'say "hello" ' }],
    })
  })

  it('字段包含连续双引号', () => {
    const result = parseCSV('a,b\n1,"a""b""c"')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: 'a"b"c' }],
    })
  })

  it('空引号字段', () => {
    const result = parseCSV('a,b\n1,""')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '' }],
    })
  })
})

describe('parseCSV - 预设 headers', () => {
  it('使用预设 headers，跳过首行', () => {
    const result = parseCSV('Alice,30,NY', { headers: ['name', 'age', 'city'] })
    assert.deepStrictEqual(result, {
      headers: ['name', 'age', 'city'],
      rows: [{ name: 'Alice', age: '30', city: 'NY' }],
    })
  })

  it('预设 headers 数量多于数据列', () => {
    const result = parseCSV('Alice,30', {
      headers: ['name', 'age', 'city'],
    })
    assert.deepStrictEqual(result, {
      headers: ['name', 'age', 'city'],
      rows: [{ name: 'Alice', age: '30' }],
    })
  })
})

describe('parseCSV - onHeader 回调', () => {
  it('转换 header 为大写', () => {
    const result = parseCSV('name,age\nAlice,30', {
      onHeader: (name) => name.toUpperCase(),
    })
    assert.deepStrictEqual(result, {
      headers: ['NAME', 'AGE'],
      rows: [{ NAME: 'Alice', AGE: '30' }],
    })
  })

  it('onHeader 接收 col 参数', () => {
    const cols = []
    parseCSV('a,b,c\n1,2,3', {
      onHeader: (name, _value, col) => {
        cols.push(col)
        return name
      },
    })
    assert.deepStrictEqual(cols, [0, 1, 2])
  })
})

describe('parseCSV - onValue 回调', () => {
  it('将数字字符串转为数字', () => {
    const result = parseCSV('name,age\nAlice,30\nBob,25', {
      onValue: (_name, value) => {
        const num = Number(value)
        return Number.isNaN(num) ? value : num
      },
    })
    assert.deepStrictEqual(result, {
      headers: ['name', 'age'],
      rows: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    })
  })

  it('onValue 接收 name 和 col 参数', () => {
    const calls = []
    parseCSV('a,b\n1,2', {
      onValue: (name, value, col) => {
        calls.push({ name, value, col })
        return value
      },
    })
    assert.deepStrictEqual(calls, [
      { name: 'a', value: '1', col: 0 },
      { name: 'b', value: '2', col: 1 },
    ])
  })

  it('onValue 可返回任意类型', () => {
    const result = parseCSV('x,y\n1,2', {
      onValue: (_name, value) => ({ raw: value }),
    })
    assert.deepStrictEqual(result, {
      headers: ['x', 'y'],
      rows: [{ x: { raw: '1' }, y: { raw: '2' } }],
    })
  })
})

describe('parseCSV - 边界情况', () => {
  it('每行只有 header', () => {
    const result = parseCSV('a\n')
    assert.deepStrictEqual(result, {
      headers: ['a'],
      rows: [],
    })
  })

  it('多余列用列索引作为 key 存储', () => {
    const result = parseCSV('a,b\n1,2,3,4')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2', '2': '3', '3': '4' }],
    })
  })

  it('缺少列正常解析', () => {
    const result = parseCSV('a,b,c\n1')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b', 'c'],
      rows: [{ a: '1' }],
    })
  })

  it('字段包含空格', () => {
    const result = parseCSV('a,b\nhello world,  spaced  ')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: 'hello world', b: '  spaced  ' }],
    })
  })

  it('多行数据', () => {
    const csv = 'id,name,score\n1,Alice,90\n2,Bob,85\n3,Carol,95'
    const result = parseCSV(csv)
    assert.deepStrictEqual(result, {
      headers: ['id', 'name', 'score'],
      rows: [
        { id: '1', name: 'Alice', score: '90' },
        { id: '2', name: 'Bob', score: '85' },
        { id: '3', name: 'Carol', score: '95' },
      ],
    })
  })
})

describe('parseCSV - 连续分隔符（空字段）', () => {
  it('中间空字段', () => {
    const result = parseCSV('a,b,c\n1,,3')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b', 'c'],
      rows: [{ a: '1', b: '', c: '3' }],
    })
  })

  it('多个连续空字段', () => {
    const result = parseCSV('a,b,c,d\n1,,,4')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b', 'c', 'd'],
      rows: [{ a: '1', b: '', c: '', d: '4' }],
    })
  })

  it('开头空字段', () => {
    const result = parseCSV('a,b\n,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '', b: '2' }],
    })
  })

  it('仅分隔符', () => {
    // ',,' 最后一个逗号是 EOF，colEnd+rowEnd 同时触发，只产生 2 列
    const result = parseCSV(',,')
    assert.deepStrictEqual(result, {
      headers: ['', ''],
      rows: [],
    })
  })
})

describe('parseCSV - 尾部分隔符', () => {
  it('数据行末尾逗号（EOF 与分隔符同行，空值不入列）', () => {
    const result = parseCSV('a,b\n1,2,')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('尾部逗号后换行', () => {
    const result = parseCSV('a,b\n1,,\n2,3')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [
        { a: '1', b: '', '2': '' },
        { a: '2', b: '3' },
      ],
    })
  })
})

describe('parseCSV - 未关闭引号', () => {
  it('EOF 在引号内部，值包含后续所有字符', () => {
    const result = parseCSV('a,b\n1,"hello')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: 'hello' }],
    })
  })

  it('引号内包含换行和分隔符直到 EOF', () => {
    const result = parseCSV('a,b\n1,"he,llo\nworld')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: 'he,llo\nworld' }],
    })
  })
})

describe('parseCSV - 引号后紧跟普通字符', () => {
  it('关闭引号后追加字符', () => {
    const result = parseCSV('a,b\n"hello"world,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: 'helloworld', b: '2' }],
    })
  })
})

describe('parseCSV - 混合换行序列', () => {
  it('\r\r 被跳过', () => {
    const result = parseCSV('a,b\r\r1,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('\n\r 被跳过', () => {
    const result = parseCSV('a,b\n\r1,2')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })

  it('文本以 \n 开头（i=0 时 text[-1] 为 undefined）', () => {
    const result = parseCSV('\na,b\n1,2')
    // text[-1] 是 undefined，不会 continue，空字符串成为唯一的 header
    // 随后 a,b 行被当作数据行（headerEnd 已为 true）
    assert.deepStrictEqual(result.headers, [''])
    assert.ok(result.rows.length >= 1)
  })

  it('数据行以 \r 结尾', () => {
    const result = parseCSV('a,b\n1,2\r')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: '1', b: '2' }],
    })
  })
})

describe('parseCSV - 回调组合', () => {
  it('onHeader + onValue 同时使用', () => {
    const result = parseCSV('name,age\nAlice,30', {
      onHeader: (name) => name.toUpperCase(),
      onValue: (name, value) => (name === 'AGE' ? Number(value) : value),
    })
    assert.deepStrictEqual(result, {
      headers: ['NAME', 'AGE'],
      rows: [{ NAME: 'Alice', AGE: 30 }],
    })
  })

  it('预设 headers + onValue 回调', () => {
    const result = parseCSV('Alice,30', {
      headers: ['name', 'age'],
      onValue: (_name, value) => value.toUpperCase(),
    })
    assert.deepStrictEqual(result, {
      headers: ['name', 'age'],
      rows: [{ name: 'ALICE', age: '30' }],
    })
  })

  it('预设 headers 时 onHeader 不会被调用', () => {
    let called = false
    const result = parseCSV('Alice,30', {
      headers: ['name', 'age'],
      onHeader: () => { called = true; return 'X' },
    })
    assert.strictEqual(called, false)
    assert.deepStrictEqual(result.headers, ['name', 'age'])
  })

  it('onValue 返回 undefined', () => {
    const result = parseCSV('a,b\n1,2', {
      onValue: () => undefined,
    })
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: undefined, b: undefined }],
    })
  })

  it('onValue 返回 null', () => {
    const result = parseCSV('a,b\n1,2', {
      onValue: () => null,
    })
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [{ a: null, b: null }],
    })
  })
})

describe('parseCSV - 预设 headers 边界', () => {
  it('预设 headers + 数据列多于 headers，多余列用索引', () => {
    const result = parseCSV('1,2,3', { headers: ['a'] })
    assert.deepStrictEqual(result, {
      headers: ['a'],
      rows: [{ a: '1', '1': '2', '2': '3' }],
    })
  })

  it('预设 headers + 空文本', () => {
    const result = parseCSV('', { headers: ['a', 'b'] })
    assert.deepStrictEqual(result, {
      headers: ['a', 'b'],
      rows: [],
    })
  })

  it('空 headers 数组等同于不传', () => {
    const r1 = parseCSV('a,b\n1,2')
    const r2 = parseCSV('a,b\n1,2', { headers: [] })
    assert.deepStrictEqual(r1, r2)
  })
})

describe('parseCSV - 特殊内容', () => {
  it('Unicode 内容', () => {
    const result = parseCSV('姓名,年龄\n张三,30')
    assert.deepStrictEqual(result, {
      headers: ['姓名', '年龄'],
      rows: [{ '姓名': '张三', '年龄': '30' }],
    })
  })

  it('header 行含转义引号', () => {
    const result = parseCSV('"a""b",c\n1,2')
    assert.deepStrictEqual(result, {
      headers: ['a"b', 'c'],
      rows: [{ 'a"b': '1', c: '2' }],
    })
  })

  it('onHeader 返回空字符串导致 falsy 回退', () => {
    const result = parseCSV('a,b\n1,2', {
      onHeader: () => '',
    })
    // headers 数组存的是 ''，但取值时 '' || '0' => '0'（空字符串 falsy）
    assert.deepStrictEqual(result, {
      headers: ['', ''],
      rows: [{ '0': '1', '1': '2' }],
    })
  })

  it('多行数据列数不一致', () => {
    const result = parseCSV('a,b,c\n1,2\n3,4,5')
    assert.deepStrictEqual(result, {
      headers: ['a', 'b', 'c'],
      rows: [
        { a: '1', b: '2' },
        { a: '3', b: '4', c: '5' },
      ],
    })
  })

  it('分隔符为引号时，引号仍按引号处理（优先级）', () => {
    const result = parseCSV('a"b', { separator: '"' })
    assert.deepStrictEqual(result, {
      headers: ['ab'],
      rows: [],
    })
  })

  it('分隔符为换行符时，\n 作列分隔而非行分隔', () => {
    const result = parseCSV('a\nb\nc\nd', { separator: '\n' })
    // \n 先匹配 separator 分支，不走换行逻辑，所有值都在同一行
    assert.deepStrictEqual(result, {
      headers: ['a', 'b', 'c', 'd'],
      rows: [],
    })
  })
})

describe('parseCSV - 导出', () => {
  it('default 导出与命名导出一致', async () => {
    const mod = await import('./fastest-csv.js')
    assert.strictEqual(mod.default, mod.parseCSV)
  })
})
