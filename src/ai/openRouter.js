import { DEFAULT_TEMPERATURE, HOMEPAGE, PRODUCT_NAME } from '../constants.js'

/** Raised when the provider rejects a request or returns an unusable payload. */
export class ProviderError extends Error {
  constructor(message, { status } = {}) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
  }
}

/** Number of characters kept from an error body when reporting a failure. */
const ERROR_BODY_LIMIT = 200

/** Minimal client for the OpenRouter chat completions endpoint. */
export class OpenRouterClient {
  constructor({ apiKey, baseUrl, model }) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.model = model
  }

  get endpoint() {
    return `${this.baseUrl}/chat/completions`
  }

  /**
   * Sends a single system and user turn and returns the trimmed reply.
   * Throws a ProviderError on transport errors, HTTP errors and empty replies.
   */
  async complete({ system, user, temperature = DEFAULT_TEMPERATURE }) {
    let response

    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': HOMEPAGE,
          'X-Title': PRODUCT_NAME,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature,
        }),
      })
    } catch (error) {
      throw new ProviderError(`Falha de conexão com o provedor: ${error.message}`)
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      const detail = body ? `: ${body.slice(0, ERROR_BODY_LIMIT)}` : ''
      throw new ProviderError(`O provedor respondeu ${response.status}${detail}`, {
        status: response.status,
      })
    }

    const payload = await response.json().catch(() => null)
    const message = payload?.choices?.[0]?.message?.content?.trim()

    if (!message) {
      throw new ProviderError('O modelo devolveu uma resposta vazia.')
    }

    return message
  }
}
