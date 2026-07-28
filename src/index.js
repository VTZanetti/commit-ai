/**
 * Public entry point.
 *
 * The package ships a CLI, but the pieces are exported so the commit message
 * generation can be reused from other Node scripts.
 */

export { generateCommitMessage } from './ai/commitMessage.js'
export { normalizeCommitMessage } from './ai/format.js'
export { OpenRouterClient, ProviderError } from './ai/openRouter.js'
export { envFileCandidates, loadEnvFiles } from './config/env.js'
export { ConfigurationError, assertUsable, resolveSettings } from './config/settings.js'
export { collectChanges, listFiles } from './git/changes.js'
export { formatNewFileDiff, splitDiffByFile, truncateDiff } from './git/diff.js'
export { RepositoryError } from './git/repository.js'
export { run } from './cli/run.js'
export * from './constants.js'
