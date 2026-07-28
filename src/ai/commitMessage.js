import { splitDiffByFile } from '../git/diff.js'
import { clamp } from '../internal/text.js'
import { normalizeCommitMessage } from './format.js'
import {
  COMMIT_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  commitFromDiffPrompt,
  commitFromSummariesPrompt,
  fileSummaryPrompt,
} from './prompts.js'

/** Summarises one file, degrading to a placeholder when the request fails. */
async function summariseFile(client, file, maxChunkChars) {
  try {
    return await client.complete({
      system: SUMMARY_SYSTEM_PROMPT,
      user: fileSummaryPrompt(file.path, clamp(file.diff, maxChunkChars)),
    })
  } catch {
    return 'changed, summary unavailable'
  }
}

/**
 * Two step strategy, meant for providers with tight token limits.
 *
 * Each file is summarised on its own, then the summaries are combined into the
 * final message. Requests stay small, and one failing file does not abort the
 * whole run.
 */
async function generateFromSummaries(client, diff, settings, onProgress) {
  const files = splitDiffByFile(diff)
  const summaries = []

  onProgress({ type: 'summary-start', total: files.length })

  for (const [index, file] of files.entries()) {
    onProgress({ type: 'summary-file', current: index + 1, total: files.length, path: file.path })
    const summary = await summariseFile(client, file, settings.maxChunkChars)
    summaries.push(`- ${file.path}: ${summary}`)
  }

  onProgress({ type: 'summary-done', total: files.length })

  return client.complete({
    system: COMMIT_SYSTEM_PROMPT,
    user: commitFromSummariesPrompt(summaries.join('\n')),
  })
}

/** Single step strategy. Sends the whole diff in one request. */
function generateFromDiff(client, diff) {
  return client.complete({
    system: COMMIT_SYSTEM_PROMPT,
    user: commitFromDiffPrompt(diff),
  })
}

/**
 * Produces the commit message for `diff`.
 * Progress events are reported through `onProgress` so the caller decides how
 * to display them.
 */
export async function generateCommitMessage({ client, diff, settings, onProgress = () => {} }) {
  const message = settings.twoStep
    ? await generateFromSummaries(client, diff, settings, onProgress)
    : await generateFromDiff(client, diff)

  return normalizeCommitMessage(message)
}
