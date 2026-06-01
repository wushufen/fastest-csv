/**
 * @param {string} text
 * @param {object} options
 * @param {string} [options.separator=',']
 * @param {string[]} [options.headers]
 * @param {(name:string, value:string, col:number) => string} [options.onHeader]
 * @param {(name:string, value:string, col:number) => *} [options.onValue]
 */
function parseCSV(
  text = '',
  {
    separator = ',',
    headers = [],
    onHeader = undefined,
    onValue = undefined,
  } = {},
) {
  let col = 0 // column index
  let chars = '' // value

  let quotStart = false // "...
  let headerEnd = !!headers.length // first row

  let row = /** @type {typeof rows[0]} */ ({})
  const rows = /** @type {Record<string, string>[]} */ ([])

  for (let i = 0, len = text.length; i < len; i++) {
    let char = text[i]
    let colEnd = false
    let rowEnd = false

    // "...>
    if (quotStart) {
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
    // ...>
    else {
      // >"..."
      if (char == '"') {
        quotStart = true
      }
      // ...>,...
      else if (char == separator) {
        colEnd = true
      }
      // ...>\n
      else if (char == '\r' || char == '\n') {
        colEnd = true
        rowEnd = true

        // ...\n>\n skip
        const pre = text[i - 1]
        if (pre == '\r' || pre == '\n') {
          continue
        }
      }
      // ...>...
      else {
        chars += char
      }
    }

    // ⇥[^\r\n]EOF
    if (i == text.length - 1) {
      colEnd = true
      rowEnd = true
    }

    // ,  \n
    if (colEnd) {
      // [headers]
      if (!headerEnd) {
        const header = onHeader ? onHeader(chars, chars, col) : chars
        headers.push(header)
      }
      // {values}
      else {
        const name = headers[col] || `${col}`
        const value = onValue ? onValue(name, chars, col) : chars
        row[name] = value
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
