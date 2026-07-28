/**
 * Product identity and provider defaults.
 *
 * Every user facing name lives here, so renaming the product means editing a
 * single file instead of hunting for strings across the codebase.
 */

export const PRODUCT_NAME = 'Glum AI'
export const PACKAGE_NAME = 'glum-ai'
export const COMMAND_NAME = 'glum'
export const HOMEPAGE = 'https://github.com/VTZanetti/glum-ai'

/** Base URL of the OpenRouter compatible API. */
export const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'

/** Model used when none is configured. */
export const DEFAULT_MODEL = 'openrouter/auto'

/** Sampling temperature. Commit messages should be deterministic, not creative. */
export const DEFAULT_TEMPERATURE = 0.1
