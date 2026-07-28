import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatNewFileDiff, splitDiffByFile, truncateDiff } from '../src/git/diff.js'

describe('splitDiffByFile', () => {
  it('returns one entry per file header', () => {
    const diff = [
      'diff --git a/src/a.js b/src/a.js',
      '+first',
      'diff --git a/src/b.js b/src/b.js',
      '+second',
    ].join('\n')

    const files = splitDiffByFile(diff)

    assert.deepEqual(
      files.map((file) => file.path),
      ['src/a.js', 'src/b.js'],
    )
    assert.equal(files[0].diff, 'diff --git a/src/a.js b/src/a.js\n+first')
  })

  it('ignores content written before the first header', () => {
    const files = splitDiffByFile('noise\ndiff --git a/a.js b/a.js\n+line')

    assert.equal(files.length, 1)
    assert.equal(files[0].path, 'a.js')
  })

  it('returns an empty list for an empty diff', () => {
    assert.deepEqual(splitDiffByFile(''), [])
  })
})

describe('formatNewFileDiff', () => {
  it('presents the content as a new file', () => {
    const diff = formatNewFileDiff('docs/uso.md', '# Uso')

    assert.ok(diff.startsWith('diff --git a/docs/uso.md b/docs/uso.md'))
    assert.ok(diff.includes('new file mode 100644'))
    assert.ok(diff.endsWith('# Uso'))
  })

  it('produces a block that can be parsed back', () => {
    const files = splitDiffByFile(formatNewFileDiff('a.txt', 'content'))

    assert.equal(files.length, 1)
    assert.equal(files[0].path, 'a.txt')
  })
})

describe('truncateDiff', () => {
  it('keeps short diffs untouched', () => {
    const result = truncateDiff('short', 100)

    assert.equal(result.diff, 'short')
    assert.equal(result.truncated, false)
  })

  it('cuts long diffs and reports the original length', () => {
    const result = truncateDiff('a'.repeat(50), 10)

    assert.equal(result.truncated, true)
    assert.equal(result.originalLength, 50)
    assert.ok(result.diff.startsWith('a'.repeat(10)))
    assert.ok(result.diff.includes('truncado'))
  })

  it('treats a limit of zero as unlimited', () => {
    const result = truncateDiff('a'.repeat(50), 0)

    assert.equal(result.truncated, false)
    assert.equal(result.diff.length, 50)
  })
})
