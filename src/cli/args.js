import { parseArgs } from 'node:util'
import { COMMAND_NAME } from '../constants.js'

/** Raised when the command line cannot be parsed. */
export class ArgumentError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ArgumentError'
  }
}

const OPTIONS = {
  help: { type: 'boolean', short: 'h', default: false },
  version: { type: 'boolean', short: 'v', default: false },
  yes: { type: 'boolean', short: 'y', default: false },
  'no-push': { type: 'boolean', default: false },
  'dry-run': { type: 'boolean', default: false },
  'single-step': { type: 'boolean', default: false },
  model: { type: 'string', short: 'm' },
}

/**
 * Reads the command line into the option object used by the run loop.
 * Unknown flags raise an ArgumentError.
 */
export function parseCliArgs(argv) {
  let values

  try {
    ;({ values } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: false }))
  } catch {
    throw new ArgumentError(
      `Opção inválida. Execute "${COMMAND_NAME} --help" para ver as opções disponíveis.`,
    )
  }

  return {
    help: values.help,
    version: values.version,
    autoConfirm: values.yes,
    allowPush: !values['no-push'],
    dryRun: values['dry-run'],
    singleStep: values['single-step'],
    model: values.model,
  }
}
