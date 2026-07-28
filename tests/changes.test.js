import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { listFiles } from '../src/git/changes.js'

describe('listFiles', () => {
  let root

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'glum-test-'))
    mkdirSync(join(root, 'nested', 'deep'), { recursive: true })
    writeFileSync(join(root, 'top.txt'), 'top')
    writeFileSync(join(root, 'nested', 'middle.txt'), 'middle')
    writeFileSync(join(root, 'nested', 'deep', 'bottom.txt'), 'bottom')
  })

  after(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('returns a single file untouched', () => {
    const file = `${root}/top.txt`

    assert.deepEqual(listFiles(file), [file])
  })

  it('walks directories recursively', () => {
    const files = listFiles(root)

    assert.equal(files.length, 3)
    assert.ok(files.includes(`${root}/nested/deep/bottom.txt`))
  })

  it('joins segments with a forward slash on every platform', () => {
    const files = listFiles(`${root}/nested`)

    assert.ok(files.every((file) => !file.slice(root.length).includes('\\')))
  })

  it('drops the trailing slash git adds to untracked directories', () => {
    const files = listFiles(`${root}/nested/`)

    assert.ok(files.includes(`${root}/nested/middle.txt`))
    assert.ok(files.every((file) => !file.includes('//')))
  })

  it('returns a missing path instead of throwing', () => {
    assert.deepEqual(listFiles(`${root}/absent.txt`), [`${root}/absent.txt`])
  })
})
