import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const AFFIRMATIVE = new Set(['s', 'sim', 'y', 'yes'])

/**
 * Opens a question channel on the terminal.
 * The caller must call `close` when done, otherwise the process stays alive.
 */
export function createPrompt() {
  const rl = createInterface({ input: stdin, output: stdout })

  return {
    /** Asks a yes or no question. Anything other than an explicit yes means no. */
    async confirm(question) {
      const answer = await rl.question(`${question} (s/N): `)
      return AFFIRMATIVE.has(answer.trim().toLowerCase())
    },
    close() {
      rl.close()
    },
  }
}
