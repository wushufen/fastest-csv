import { parse } from 'csv-parse/sync'
import Papa from 'papaparse'
import { parseCSV } from '../src/fastest-csv.js'

const text = (
  Array.from({ length: 5 }, (_, i) => `${'v'.repeat(10)}${i}`).join(',') +
  ',' +
  Array.from({ length: 5 }, (_, i) => `"${'q'.repeat(10)}${i}"`).join(',') +
  '\n'
).repeat(100000)
const lines = text.trim().split('\n').length
const sizeMB = +(Buffer.byteLength(text) / 1024 / 1024).toFixed(1)

console.log(`📊 ${lines} 行, ${10} 列, ${sizeMB} MB\n`)
/** @type {{label:string, median:number, min:number, max:number}[]} */
const results = []

/**
 *
 * @param {string} label
 * @param {function} fn
 * @param {number} rounds
 * @returns
 */
function bench(label, fn, rounds = 10) {
  // warmup
  for (let i = 0; i < 3; i++) fn()

  const times = []
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now()
    fn()
    times.push(performance.now() - t0)
  }
  times.sort((a, b) => a - b)
  const median = times[Math.floor(times.length / 2)]
  const min = times[0]
  const max = times[times.length - 1]

  results.push({ label, median, min, max })
}

// fastest-csv
bench('fastest-csv', () => parseCSV(text))

// fastest-csv fastMode
bench('fastest-csv FM', () => parseCSV(text, { fastMode: true }))

// PapaParse
bench('PapaParse  ', () => Papa.parse(text, { header: true }).data)

// PapaParse fastMode
bench(
  'PapaParse FM',
  () => Papa.parse(text, { header: true, fastMode: true }).data,
)

// csv-parse
bench('csv-parse  ', () => parse(text, { columns: true }))

const fastest = Math.min(...results.map((r) => r.median))

console.log('━'.repeat(56))
console.log(`  库${' '.repeat(20)}  中位数(ms)    最快(ms)    最慢(ms)`)
console.log('━'.repeat(56))
for (const r of results) {
  const ratio = (r.median / fastest).toFixed(1)
  const tag = r.median === fastest ? ' 🏆' : ` ${ratio}x`
  console.log(
    `  ${r.label.padEnd(20)}    ${r.median.toFixed(2).padStart(7)}    ${r.min.toFixed(2).padStart(7)}    ${r.max.toFixed(2).padStart(7)}${tag}`,
  )
}
console.log('━'.repeat(56))

const fastestResult = results.reduce((a, b) => (a.median < b.median ? a : b))
const throughput = (sizeMB / (fastestResult.median / 1000)).toFixed(0)
console.log(
  `\n⚡ ${fastestResult.label}: ${fastestResult.median.toFixed(1)}ms 解析 ${sizeMB}MB → ${throughput} MB/s\n`,
)
