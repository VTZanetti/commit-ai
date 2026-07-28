import { DEFAULT_BASE_URL, DEFAULT_MODEL } from '../constants.js'

/** Raised when the resolved configuration cannot be used to reach the provider. */
export class ConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

/**
 * Environment variables, from the canonical name to the legacy aliases kept for
 * compatibility with the previous release.
 */
const KEYS = {
  apiKey: ['GLUM_API_KEY', 'OPEN_ROUTER_API_KEY'],
  baseUrl: ['GLUM_BASE_URL', 'OPEN_ROUTER_BASE_URL'],
  model: ['GLUM_MODEL', 'OPEN_ROUTER_MODEL'],
  twoStep: ['GLUM_TWO_STEP', 'USE_TWO_STEP_PROCESSING'],
  ignoreGitignored: ['GLUM_IGNORE_GITIGNORED', 'IGNORE_GITIGNORED_FILES'],
  maxChunkChars: ['GLUM_MAX_CHUNK_CHARS', 'MAX_CHUNK_SIZE'],
  maxFileChars: ['GLUM_MAX_FILE_CHARS', 'MAX_FILE_CHARS'],
  maxFiles: ['GLUM_MAX_FILES', 'MAX_TOTAL_FILES'],
  maxDiffChars: ['GLUM_MAX_DIFF_CHARS', 'MAX_DIFF_SIZE'],
}

const FALSE_VALUES = new Set(['false', '0', 'no', 'off'])

function readString(env, keys) {
  for (const key of keys) {
    const value = env[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return undefined
}

function readBoolean(env, keys, fallback) {
  const value = readString(env, keys)
  if (value === undefined) return fallback
  return !FALSE_VALUES.has(value.toLowerCase())
}

function readInteger(env, keys, fallback) {
  const value = readString(env, keys)
  if (value === undefined) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

/**
 * Builds the settings object from the environment.
 * Size limits are measured in characters, and zero disables the limit.
 */
export function resolveSettings(env = process.env) {
  return {
    apiKey: readString(env, KEYS.apiKey),
    baseUrl: readString(env, KEYS.baseUrl) ?? DEFAULT_BASE_URL,
    model: readString(env, KEYS.model) ?? DEFAULT_MODEL,
    twoStep: readBoolean(env, KEYS.twoStep, true),
    ignoreGitignored: readBoolean(env, KEYS.ignoreGitignored, true),
    maxChunkChars: readInteger(env, KEYS.maxChunkChars, 8000),
    maxFileChars: readInteger(env, KEYS.maxFileChars, 2000),
    maxFiles: readInteger(env, KEYS.maxFiles, 50),
    maxDiffChars: readInteger(env, KEYS.maxDiffChars, 100000),
  }
}

/** Throws a ConfigurationError when a required setting is missing. */
export function assertUsable(settings) {
  if (!settings.apiKey) {
    throw new ConfigurationError(
      'Chave de API ausente. Defina GLUM_API_KEY em um arquivo .env antes de continuar.',
    )
  }
}
