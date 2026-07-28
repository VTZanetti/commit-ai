/**
 * Pure helpers for reading and writing unified diffs.
 * Nothing here touches the filesystem or spawns a process.
 */

const FILE_HEADER = /^diff --git a\/(.*) b\//
const UNKNOWN_PATH = 'unknown-file'

/**
 * Splits a unified diff into one entry per file.
 * Returns `[{ path, diff }]`, preserving the original text of each block.
 */
export function splitDiffByFile(diff) {
  const files = []
  let path = null
  let lines = []

  const flush = () => {
    if (path === null) return
    files.push({ path, diff: lines.join('\n') })
  }

  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git')) {
      flush()
      const match = line.match(FILE_HEADER)
      path = match ? match[1] : UNKNOWN_PATH
      lines = [line]
      continue
    }
    if (path !== null) lines.push(line)
  }

  flush()
  return files
}

/**
 * Builds a unified diff block that presents `content` as a brand new file.
 * Untracked files have no diff of their own, so the CLI synthesises one to give
 * the model the same shape of input it gets for tracked changes.
 */
export function formatNewFileDiff(path, content) {
  return [
    `diff --git a/${path} b/${path}`,
    'new file mode 100644',
    '--- /dev/null',
    `+++ b/${path}`,
    '@@ 0,0 @@',
    content,
  ].join('\n')
}

/**
 * Cuts `diff` down to `limit` characters and appends a note about what was
 * removed. A limit of zero or less disables the cut.
 * Returns `{ diff, originalLength, truncated }`.
 */
export function truncateDiff(diff, limit) {
  if (limit <= 0 || diff.length <= limit) {
    return { diff, originalLength: diff.length, truncated: false }
  }

  const note = `\n\n[diff truncado: ${diff.length} caracteres no total, exibindo os primeiros ${limit}]`

  return {
    diff: diff.slice(0, limit) + note,
    originalLength: diff.length,
    truncated: true,
  }
}
