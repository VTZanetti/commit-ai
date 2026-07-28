/**
 * Prompt templates.
 *
 * The generated commit messages follow Conventional Commits in English, with no
 * emojis, no decorative punctuation and no mention of how they were written.
 */

export const SUMMARY_SYSTEM_PROMPT = [
  'You review source code diffs.',
  'You describe what changed in plain, factual English.',
  'You never speculate about intent and never mention tools, models or assistants.',
].join(' ')

export const COMMIT_SYSTEM_PROMPT = [
  'You write git commit messages that follow the Conventional Commits specification.',
  'You write in plain English, the way an experienced maintainer writes.',
  'You never use emojis, em dashes or decorative punctuation.',
  'You never mention tools, models, assistants or the process used to write the message.',
].join(' ')

const COMMIT_RULES = `Format:

type(scope): short description

- bullet describing a change
- bullet describing a change

Rules:
1. Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
2. The scope is optional and names the affected area, in lower case.
3. The description is imperative, starts in lower case and has no trailing period.
4. Keep the subject line under 72 characters.
5. Leave one blank line after the subject, then add one to three bullets starting with "- ".
6. Write everything in English.
7. Do not use emojis, em dashes, en dashes or decorative punctuation.
8. Do not mention artificial intelligence, models, assistants or this tool.
9. Describe only what the input shows. Do not invent changes.
10. Return the commit message alone, with no code fences and no commentary.`

/** Asks for a short summary of the changes made to a single file. */
export function fileSummaryPrompt(path, diff) {
  return `Summarise the changes to the file "${path}" in one or two short sentences.
Write in English. Do not use emojis or decorative punctuation.

${diff}`
}

/** Asks for the final commit message, based on the per file summaries. */
export function commitFromSummariesPrompt(summaries) {
  return `Write a commit message for the following change summaries.

${COMMIT_RULES}

Summaries:
${summaries}`
}

/** Asks for the final commit message, based on the raw diff. */
export function commitFromDiffPrompt(diff) {
  return `Write a commit message for the following diff.

${COMMIT_RULES}

Diff:
${diff}`
}
