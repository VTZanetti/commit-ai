import { readFileSync } from 'node:fs'
import { COMMAND_NAME, PACKAGE_NAME, PRODUCT_NAME } from '../constants.js'

const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'))

/** Version declared in package.json. */
export const version = manifest.version

/** Carriage return plus the ANSI sequence that erases the current line. */
const CLEAR_LINE = '\r\u001b[2K'

export function info(message) {
  console.log(message)
}

export function warn(message) {
  console.log(`[aviso] ${message}`)
}

export function error(message) {
  console.error(`[erro] ${message}`)
}

/** Formats a notice produced while the changes were collected. */
export function notice(item) {
  if (item.type === 'files-limited') {
    warn(`${item.found} arquivos novos encontrados. O limite configurado é ${item.limit}.`)
    return
  }

  if (item.type === 'diff-truncated') {
    warn(`Diff de ${item.length} caracteres truncado em ${item.limit}.`)
  }
}

/**
 * Formats a progress event emitted while the message is generated.
 * On a terminal the file counter is redrawn in place. Elsewhere, such as a CI
 * log, each step gets its own line and no escape sequence is written.
 */
export function progress(event) {
  const interactive = process.stdout.isTTY

  if (event.type === 'summary-start') {
    info(`\nEtapa 1 de 2: resumindo ${event.total} arquivo(s).`)
    return
  }

  if (event.type === 'summary-file') {
    const line = `  ${event.current}/${event.total} ${event.path}`
    if (interactive) process.stdout.write(`${CLEAR_LINE}${line}`)
    else info(line)
    return
  }

  if (event.type === 'summary-done') {
    if (interactive) process.stdout.write('\n')
    info('Etapa 2 de 2: escrevendo a mensagem de commit.')
  }
}

/** Prints the suggested commit message. */
export function commitPreview(message) {
  info('\nMensagem sugerida:\n')
  info(message)
  info('')
}

/** Reminds which branch is about to receive the operation. */
export function branchWarning(branch, action) {
  warn(`Você está na branch "${branch}" e vai ${action}.`)
}

export function printVersion() {
  info(`${PACKAGE_NAME} ${version}`)
}

export function help() {
  info(`${PRODUCT_NAME}
Gera mensagens de commit a partir das alterações do repositório.

Uso
  ${COMMAND_NAME} [opções]

Opções
  -h, --help          Mostra esta ajuda
  -v, --version       Mostra a versão instalada
  -y, --yes           Confirma o commit e o push sem perguntar
  -m, --model <id>    Usa um modelo específico nesta execução
      --single-step   Envia o diff inteiro em uma única requisição
      --no-push       Nunca executa git push
      --dry-run       Apenas exibe a mensagem, sem alterar o repositório

Configuração
  As variáveis são lidas de um arquivo .env. Consulte docs/configuracao.md.`)
}
