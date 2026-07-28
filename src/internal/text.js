/**
 * Keeps the first `count` lines of `value`.
 * Returns the original value when it is already shorter than the limit.
 */
export function headLines(value, count) {
  const lines = value.split('\n')
  if (lines.length <= count) return value
  return lines.slice(0, count).join('\n')
}

/**
 * Cuts `value` to `limit` characters.
 * A limit of zero or less disables the cut.
 */
export function clamp(value, limit) {
  if (limit <= 0 || value.length <= limit) return value
  return value.slice(0, limit)
}

/** Collapses runs of three or more blank lines into a single blank line. */
export function collapseBlankLines(value) {
  return value.replace(/\n{3,}/g, '\n\n')
}

/** Removes trailing spaces from every line. */
export function trimLineEnds(value) {
  return value
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
}
