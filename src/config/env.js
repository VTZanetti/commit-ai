import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

/** Root of the installed package, used to find the .env shipped next to the CLI. */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))

/**
 * Lists the .env files the CLI reads, in load order.
 * Later files override values already set by earlier ones.
 */
export function envFileCandidates(env = process.env, cwd = process.cwd()) {
  return [
    join(packageRoot, '.env'),
    join(cwd, '.env'),
    env.GLUM_ENV_PATH || env.OPEN_ROUTER_ENV_PATH,
  ].filter(Boolean)
}

/**
 * Loads every existing candidate into `process.env`.
 * Returns the paths that were actually read.
 */
export function loadEnvFiles(env = process.env, cwd = process.cwd()) {
  const loaded = []

  envFileCandidates(env, cwd).forEach((path, index) => {
    if (!existsSync(path)) return
    dotenv.config({ path, override: index !== 0, quiet: true })
    loaded.push(path)
  })

  return loaded
}
