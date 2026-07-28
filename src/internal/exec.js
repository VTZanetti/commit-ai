import { execSync } from 'node:child_process'

/**
 * Runs `command` and returns its trimmed stdout.
 *
 * Failures resolve to an empty string, because most git queries are optional.
 * The child stderr is discarded so git complaints do not reach the terminal
 * ahead of the message this CLI wants to show.
 */
export function capture(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

/**
 * Runs `command` with the parent stdio attached, so git writes straight to the
 * terminal. Throws when the command fails.
 */
export function stream(command) {
  execSync(command, { stdio: 'inherit' })
}
