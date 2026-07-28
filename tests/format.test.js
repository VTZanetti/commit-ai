import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeCommitMessage } from '../src/ai/format.js'

describe('normalizeCommitMessage', () => {
  it('removes the emoji some models put before the type', () => {
    assert.equal(normalizeCommitMessage('✨ feat(cli): add a flag'), 'feat(cli): add a flag')
  })

  it('removes emojis from the body', () => {
    const message = normalizeCommitMessage('fix(git): stage deletions\n\n- fixes the bug \u{1F41B}')

    assert.equal(message, 'fix(git): stage deletions\n\n- fixes the bug')
  })

  it('replaces long dashes with a hyphen', () => {
    assert.equal(
      normalizeCommitMessage('docs: update the guide — again'),
      'docs: update the guide - again',
    )
  })

  it('unwraps a fenced answer', () => {
    assert.equal(normalizeCommitMessage('```\nchore: bump deps\n```'), 'chore: bump deps')
  })

  it('unwraps a fenced answer with a language tag', () => {
    assert.equal(normalizeCommitMessage('```text\nchore: bump deps\n```'), 'chore: bump deps')
  })

  it('collapses extra blank lines and trailing spaces', () => {
    const message = normalizeCommitMessage('feat: add   \n\n\n\n- first bullet  \n')

    assert.equal(message, 'feat: add\n\n- first bullet')
  })

  it('keeps a clean message unchanged', () => {
    const original = 'refactor(core): split the diff helpers\n\n- move parsing to git/diff.js'

    assert.equal(normalizeCommitMessage(original), original)
  })
})
