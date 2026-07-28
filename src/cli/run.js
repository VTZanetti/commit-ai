import { generateCommitMessage } from '../ai/commitMessage.js'
import { OpenRouterClient } from '../ai/openRouter.js'
import { loadEnvFiles } from '../config/env.js'
import { assertUsable, resolveSettings } from '../config/settings.js'
import { collectChanges } from '../git/changes.js'
import * as repository from '../git/repository.js'
import { parseCliArgs } from './args.js'
import { createPrompt } from './prompts.js'
import * as reporter from './reporter.js'

const EXIT_OK = 0
const EXIT_FAILURE = 1

/** Applies the command line overrides on top of the environment settings. */
function buildSettings(options) {
  const settings = resolveSettings()

  return {
    ...settings,
    model: options.model ?? settings.model,
    twoStep: options.singleStep ? false : settings.twoStep,
  }
}

/**
 * Runs the assisted commit flow.
 * Returns the exit code instead of terminating, so the flow stays testable.
 */
export async function run(argv = []) {
  let options

  try {
    options = parseCliArgs(argv)
  } catch (failure) {
    reporter.error(failure.message)
    return EXIT_FAILURE
  }

  if (options.help) {
    reporter.help()
    return EXIT_OK
  }

  if (options.version) {
    reporter.printVersion()
    return EXIT_OK
  }

  let message
  let settings

  try {
    repository.assertRepository()
    loadEnvFiles()
    settings = buildSettings(options)
    assertUsable(settings)

    const changes = collectChanges(settings)
    changes.notices.forEach(reporter.notice)

    if (!changes.diff) {
      reporter.info('Não há alterações para descrever.')
      return EXIT_OK
    }

    const client = new OpenRouterClient(settings)
    message = await generateCommitMessage({
      client,
      diff: changes.diff,
      settings,
      onProgress: reporter.progress,
    })
  } catch (failure) {
    reporter.error(failure.message)
    return EXIT_FAILURE
  }

  reporter.commitPreview(message)

  if (options.dryRun) {
    reporter.info('Execução em modo dry run. Nenhuma alteração foi aplicada.')
    return EXIT_OK
  }

  const branch = repository.currentBranch()
  const prompt = createPrompt()

  try {
    reporter.branchWarning(branch, 'criar um commit')

    if (!options.autoConfirm && !(await prompt.confirm('Aplicar esta mensagem?'))) {
      reporter.info('Nenhum commit criado.')
      return EXIT_OK
    }

    repository.stageAll()
    repository.commit(message)

    if (!options.allowPush) {
      reporter.info('Push desativado por --no-push.')
      return EXIT_OK
    }

    reporter.branchWarning(branch, 'executar git push')

    if (!options.autoConfirm && !(await prompt.confirm('Executar git push agora?'))) {
      reporter.info('Push não executado.')
      return EXIT_OK
    }

    repository.push()
    return EXIT_OK
  } catch (failure) {
    reporter.error(failure.message)
    return EXIT_FAILURE
  } finally {
    prompt.close()
  }
}
