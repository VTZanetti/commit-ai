import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { capture, stream } from '../internal/exec.js'

/** Raised when the CLI runs outside a git working tree. */
export class RepositoryError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RepositoryError'
  }
}

/** Tells whether the current directory belongs to a git working tree. */
export function isRepository() {
  return capture('git rev-parse --is-inside-work-tree') === 'true'
}

/** Throws a RepositoryError when the current directory is not a git working tree. */
export function assertRepository() {
  if (!isRepository()) {
    throw new RepositoryError('Este diretório não é um repositório git.')
  }
}

/**
 * Name of the checked out branch.
 *
 * `git branch --show-current` answers correctly before the first commit, where
 * `rev-parse HEAD` still fails, and returns nothing on a detached HEAD.
 */
export function currentBranch() {
  return capture('git branch --show-current') || 'HEAD desanexado'
}

/** Diff of the staged changes. */
export function stagedDiff() {
  return capture('git diff --cached')
}

/** Diff of the changes that are tracked but not staged yet. */
export function workingDiff() {
  return capture('git diff')
}

/** Paths reported as untracked by `git status --short`. */
export function untrackedPaths() {
  return capture('git status --short')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('?? '))
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
}

/** Paths that exist on disk but are excluded by .gitignore. */
export function ignoredPaths() {
  return capture('git ls-files -oi --exclude-standard')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Stages every change in the working tree, including deletions. */
export function stageAll() {
  stream('git add -A')
}

/**
 * Creates a commit with `message`.
 * The message goes through a temporary file so line breaks and quotes survive
 * the shell on every platform.
 */
export function commit(message) {
  const filePath = join(tmpdir(), `glum-commit-${process.pid}-${Date.now()}.txt`)
  writeFileSync(filePath, `${message.trim()}\n`, 'utf-8')

  try {
    stream(`git commit -F "${filePath}"`)
  } finally {
    try {
      unlinkSync(filePath)
    } catch {
      // The temporary file is disposable, so cleanup failures are not fatal.
    }
  }
}

/** Pushes the current branch to its remote. */
export function push() {
  stream('git push')
}
