import { lstatSync, readFileSync, readdirSync } from 'node:fs'
import { headLines } from '../internal/text.js'
import { formatNewFileDiff, truncateDiff } from './diff.js'
import * as repository from './repository.js'

/** Number of lines kept when a new file is too large to send in full. */
const PREVIEW_LINES = 30

/**
 * Lists the files under `path`, walking directories recursively.
 *
 * Segments are joined with a forward slash so the paths match what git reports,
 * on Windows as well. Paths that cannot be inspected are returned untouched, so
 * the caller still reports them instead of dropping them silently.
 */
export function listFiles(path) {
  // git reports untracked directories with a trailing slash.
  const base = path.replace(/[/\\]+$/, '')

  try {
    if (!lstatSync(base).isDirectory()) return [base]
  } catch {
    return [base]
  }

  return readdirSync(base).flatMap((entry) => listFiles(`${base}/${entry}`))
}

/** Reads a new file, trimming it to a preview when it exceeds `maxFileChars`. */
function readNewFile(path, maxFileChars) {
  try {
    const content = readFileSync(path, 'utf-8')
    if (maxFileChars <= 0 || content.length <= maxFileChars) return content

    const preview = headLines(content, PREVIEW_LINES)
    return `${preview}\n[arquivo truncado: ${content.length} caracteres, exibindo as primeiras ${PREVIEW_LINES} linhas]`
  } catch (error) {
    return `[conteúdo indisponível: ${error.message}]`
  }
}

/**
 * Collects staged, unstaged and untracked changes into a single unified diff.
 *
 * Notices describe what had to be trimmed to respect the configured limits.
 * They are returned as data instead of being printed, so this module stays
 * independent of the CLI output layer.
 *
 * Returns `{ diff, newFiles, notices }`.
 */
export function collectChanges(settings) {
  const notices = []
  const tracked = repository.stagedDiff() || repository.workingDiff()

  const candidates = [
    ...repository.untrackedPaths(),
    ...(settings.ignoreGitignored ? [] : repository.ignoredPaths()),
  ]

  let newFiles = [...new Set(candidates)].flatMap((path) => listFiles(path))

  if (settings.maxFiles > 0 && newFiles.length > settings.maxFiles) {
    notices.push({ type: 'files-limited', found: newFiles.length, limit: settings.maxFiles })
    newFiles = newFiles.slice(0, settings.maxFiles)
  }

  const synthetic = newFiles
    .map((path) => formatNewFileDiff(path, readNewFile(path, settings.maxFileChars)))
    .join('\n')

  const combined = [tracked, synthetic].filter(Boolean).join('\n')
  const { diff, originalLength, truncated } = truncateDiff(combined, settings.maxDiffChars)

  if (truncated) {
    notices.push({ type: 'diff-truncated', length: originalLength, limit: settings.maxDiffChars })
  }

  return { diff, newFiles, notices }
}
