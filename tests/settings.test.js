import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ConfigurationError, assertUsable, resolveSettings } from '../src/config/settings.js'
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from '../src/constants.js'

describe('resolveSettings', () => {
  it('falls back to the defaults on an empty environment', () => {
    const settings = resolveSettings({})

    assert.equal(settings.apiKey, undefined)
    assert.equal(settings.baseUrl, DEFAULT_BASE_URL)
    assert.equal(settings.model, DEFAULT_MODEL)
    assert.equal(settings.twoStep, true)
    assert.equal(settings.ignoreGitignored, true)
    assert.equal(settings.maxDiffChars, 100000)
  })

  it('reads the canonical variables', () => {
    const settings = resolveSettings({ GLUM_API_KEY: 'key', GLUM_MODEL: 'vendor/model' })

    assert.equal(settings.apiKey, 'key')
    assert.equal(settings.model, 'vendor/model')
  })

  it('accepts the legacy variable names', () => {
    const settings = resolveSettings({ OPEN_ROUTER_API_KEY: 'legacy' })

    assert.equal(settings.apiKey, 'legacy')
  })

  it('prefers the canonical name over the legacy one', () => {
    const settings = resolveSettings({ GLUM_API_KEY: 'new', OPEN_ROUTER_API_KEY: 'old' })

    assert.equal(settings.apiKey, 'new')
  })

  it('ignores blank values', () => {
    const settings = resolveSettings({ GLUM_MODEL: '   ' })

    assert.equal(settings.model, DEFAULT_MODEL)
  })

  it('reads booleans as enabled unless explicitly disabled', () => {
    assert.equal(resolveSettings({ GLUM_TWO_STEP: 'false' }).twoStep, false)
    assert.equal(resolveSettings({ GLUM_TWO_STEP: 'FALSE' }).twoStep, false)
    assert.equal(resolveSettings({ GLUM_TWO_STEP: '0' }).twoStep, false)
    assert.equal(resolveSettings({ GLUM_TWO_STEP: 'true' }).twoStep, true)
    assert.equal(resolveSettings({ GLUM_TWO_STEP: 'anything' }).twoStep, true)
  })

  it('falls back when an integer cannot be parsed', () => {
    assert.equal(resolveSettings({ GLUM_MAX_FILES: 'many' }).maxFiles, 50)
    assert.equal(resolveSettings({ GLUM_MAX_FILES: '7' }).maxFiles, 7)
  })
})

describe('assertUsable', () => {
  it('rejects settings without an API key', () => {
    assert.throws(() => assertUsable(resolveSettings({})), ConfigurationError)
  })

  it('accepts settings with an API key', () => {
    assert.doesNotThrow(() => assertUsable(resolveSettings({ GLUM_API_KEY: 'key' })))
  })
})
