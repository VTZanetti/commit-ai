import { collapseBlankLines, trimLineEnds } from '../internal/text.js'

const CODE_FENCE = /^```[a-z]*\n([\s\S]*?)\n?```$/i
// Pictographs plus the variation selector and zero width joiner that bind them.
const PICTOGRAPHIC = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu
const LONG_DASH = /[–—−]/g
const LEADING_SYMBOLS = /^[^\p{L}\p{N}]+/u

/** Removes the code fence some models wrap around the answer. */
function stripCodeFence(message) {
  const match = message.trim().match(CODE_FENCE)
  return match ? match[1] : message
}

/**
 * Normalises a commit message coming from the model.
 *
 * The prompt already asks for plain text, but models drift. This pass enforces
 * the house style: no emojis, no long dashes and no stray blank lines.
 */
export function normalizeCommitMessage(message) {
  const [subject = '', ...body] = stripCodeFence(message)
    .replace(PICTOGRAPHIC, '')
    .replace(LONG_DASH, '-')
    .split('\n')

  const cleanSubject = subject.replace(LEADING_SYMBOLS, '').trim()
  const normalized = [cleanSubject, ...body].join('\n')

  return collapseBlankLines(trimLineEnds(normalized)).trim()
}
