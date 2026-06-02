/**
 * @param {string} text
 * @param {object} options
 * @param {string} [options.separator=',']
 * @param {string[]} [options.headers]
 * @param {boolean} [options.fastMode=false]
 * @param {(value:string, name:string, col:number) => string} [options.onHeader]
 * @param {(value:string, name:string, col:number) => *} [options.onValue]
 * @returns {{ headers: string[], rows: Record<string, string>[] }}
 */
function parseCSV(
  text = '',
  {
    separator = ',',
    headers = [],
    fastMode = false,
    onHeader = String,
    onValue = String,
  } = {},
) {
  if (fastMode) {
    const lines = text.trim().split(/[\r\n]+/)
    if (!headers.length) {
      const line0 = lines.shift() || ''
      headers = line0.split(separator).map((h, i) => onHeader(h, h, i))
    }

    const rows = lines.map((line) => {
      return line.split(separator).reduce((o, v, i) => {
        const name = headers[i] || `${i}`
        const value = onValue(v, name, i)
        o[name] = value
        return o
      }, /**@type {*}*/ ({}))
    })
    return { headers, rows }
  }

  let col = 0 // column index
  let chars = '' // value

  let quotStart = false // "...
  let headerEnd = headers.length > 0 // first row

  let row = /** @type {typeof rows[0]} */ ({})
  const rows = /** @type {Record<string, string>[]} */ ([])

  for (let i = 0, len = text.length; i < len; i++) {
    let char = text[i]
    let colEnd = false
    let rowEnd = false

    // ...>
    if (!quotStart) {
      // ...>,...
      if (char == separator) {
        colEnd = true
      }
      // ...>\n
      else if (char == '\n' || char == '\r') {
        colEnd = true
        rowEnd = true

        // ...\n>\n skip
        const pre = text[i - 1]
        if (pre == '\n' || pre == '\r') {
          continue
        }
      }
      // >"..."
      else if (char == '"') {
        quotStart = true
      }
      // ...>...
      else {
        chars += char
      }
    }
    // "...>
    else {
      // "...>"
      if (char == '"') {
        const next = text[i + 1]

        // "...>""..."
        if (next == '"') {
          chars += char // "" => "
          i++
        }
        // "...>"
        else {
          quotStart = false
        }
      }
      // "...>..."
      else {
        chars += char
      }
    }

    // ⇥EOF
    if (i == len - 1) {
      colEnd = true
      rowEnd = true
    }

    // ,  \n
    if (colEnd) {
      // {values}
      if (headerEnd) {
        const name = headers[col] || `${col}`
        row[name] = onValue(chars, name, col)
      }
      // [headers]
      else {
        headers.push(onHeader(chars, chars, col))
      }

      // \n
      if (rowEnd) {
        // headers\n
        if (!headerEnd) {
          headerEnd = true
        }
        // values\n
        else {
          rows.push(row)
        }

        col = 0
        row = {}
      } else {
        col++
      }

      chars = ''
    }
  }

  return { headers, rows }
}

export { parseCSV, parseCSV as default }
