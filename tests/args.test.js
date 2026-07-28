import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ArgumentError, parseCliArgs } from '../src/cli/args.js'

describe('parseCliArgs', () => {
  it('uses the interactive defaults with no arguments', () => {
    const options = parseCliArgs([])

    assert.deepEqual(options, {
      help: false,
      version: false,
      autoConfirm: false,
      allowPush: true,
      dryRun: false,
      singleStep: false,
      model: undefined,
    })
  })

  it('reads the short flags', () => {
    const options = parseCliArgs(['-y', '-m', 'vendor/model'])

    assert.equal(options.autoConfirm, true)
    assert.equal(options.model, 'vendor/model')
  })

  it('turns --no-push into a disabled push', () => {
    assert.equal(parseCliArgs(['--no-push']).allowPush, false)
  })

  it('rejects unknown flags', () => {
    assert.throws(() => parseCliArgs(['--unknown']), ArgumentError)
  })

  it('rejects positional arguments', () => {
    assert.throws(() => parseCliArgs(['commit']), ArgumentError)
  })
})
