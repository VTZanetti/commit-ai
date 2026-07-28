import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { generateCommitMessage } from '../src/ai/commitMessage.js'
import { resolveSettings } from '../src/config/settings.js'

/** Client double that records the prompts it receives. */
function createClient(replies) {
  const calls = []
  const queue = [...replies]

  return {
    calls,
    async complete(request) {
      calls.push(request)
      return queue.shift() ?? 'chore: no reply configured'
    },
  }
}

const DIFF = ['diff --git a/a.js b/a.js', '+one', 'diff --git a/b.js b/b.js', '+two'].join('\n')

describe('generateCommitMessage', () => {
  it('sends a single request in single step mode', async () => {
    const client = createClient(['feat(core): add the loader'])
    const settings = { ...resolveSettings({}), twoStep: false }

    const message = await generateCommitMessage({ client, diff: DIFF, settings })

    assert.equal(client.calls.length, 1)
    assert.equal(message, 'feat(core): add the loader')
  })

  it('summarises every file before writing the message in two step mode', async () => {
    const client = createClient(['first summary', 'second summary', 'feat(core): add the loader'])
    const settings = resolveSettings({})

    const message = await generateCommitMessage({ client, diff: DIFF, settings })

    assert.equal(client.calls.length, 3)
    assert.ok(client.calls[2].user.includes('first summary'))
    assert.ok(client.calls[2].user.includes('second summary'))
    assert.equal(message, 'feat(core): add the loader')
  })

  it('keeps going when a file summary fails', async () => {
    let call = 0
    const client = {
      async complete() {
        call += 1
        if (call === 1) throw new Error('provider is down')
        return call === 3 ? 'fix(core): handle the failure' : 'summary'
      },
    }

    const message = await generateCommitMessage({
      client,
      diff: DIFF,
      settings: resolveSettings({}),
    })

    assert.equal(message, 'fix(core): handle the failure')
  })

  it('reports progress for every file', async () => {
    const client = createClient(['one', 'two', 'chore: touch files'])
    const events = []

    await generateCommitMessage({
      client,
      diff: DIFF,
      settings: resolveSettings({}),
      onProgress: (event) => events.push(event.type),
    })

    assert.deepEqual(events, ['summary-start', 'summary-file', 'summary-file', 'summary-done'])
  })

  it('normalises the message returned by the model', async () => {
    const client = createClient(['✨ feat(core): add the loader'])
    const settings = { ...resolveSettings({}), twoStep: false }

    const message = await generateCommitMessage({ client, diff: DIFF, settings })

    assert.equal(message, 'feat(core): add the loader')
  })
})
