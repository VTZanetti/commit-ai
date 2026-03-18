#!/usr/bin/env node
const { execSync } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync, unlinkSync, lstatSync, readdirSync } = require('node:fs');
const readline = require('node:readline/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { exit, stdin, stdout } = require('node:process');
const { config } = require('dotenv');

const envCandidates = [
  join(__dirname, '.env'),
  join(process.cwd(), '.env'),
  process.env.OPEN_ROUTER_ENV_PATH,
].filter(Boolean);

envCandidates.forEach((path, index) => {
  if (existsSync(path)) {
    config({ path, override: index !== 0 });
  }
});

const API_KEY = process.env.OPEN_ROUTER_API_KEY;
const MODEL = process.env.OPEN_ROUTER_MODEL || 'openrouter/auto';
const IGNORE_GITIGNORED_FILES = process.env.IGNORE_GITIGNORED_FILES !== 'false';
const MAX_FILE_CHARS = parseInt(process.env.MAX_FILE_CHARS || '2000', 10);
const MAX_TOTAL_FILES = parseInt(process.env.MAX_TOTAL_FILES || '50', 10);
const MAX_DIFF_SIZE = parseInt(process.env.MAX_DIFF_SIZE || '100000', 10);
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!API_KEY) {
  console.error('Erro: Defina OPEN_ROUTER_API_KEY para gerar commits com IA.');
  exit(1);
}

const run = (command) => {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
};

const currentBranch = run('git rev-parse --abbrev-ref HEAD') || 'branch-desconhecida';

const warnBranch = (context) => {
  console.log(`\n[Alerta] Você está na branch "${currentBranch}" antes de ${context}.`);
};

const rl = readline.createInterface({ input: stdin, output: stdout });

const askYesNo = async (question) => {
  const answer = (await rl.question(`${question} (s/N): `)).trim().toLowerCase();
  return ['s', 'sim', 'y', 'yes'].includes(answer);
};

const runStreaming = (command) => {
  execSync(command, { stdio: 'inherit' });
};

const stageAll = () => runStreaming('git add -A');

const commitWithMessage = (message) => {
  const filePath = join(tmpdir(), `ai-commit-${Date.now()}.txt`);
  writeFileSync(filePath, `${message.trim()}\n`, 'utf-8');
  try {
    runStreaming(`git commit -F "${filePath}"`);
  } finally {
    try {
      unlinkSync(filePath);
    } catch (_) {
      // ignora erros de limpeza
    }
  }
};

const pushChanges = () => runStreaming('git push');

const expandDirectory = (path) => {
  const results = [];
  try {
    const stat = lstatSync(path);
    if (stat.isDirectory()) {
      const entries = readdirSync(path);
      for (const entry of entries) {
        const fullPath = join(path, entry);
        results.push(...expandDirectory(fullPath));
      }
    } else {
      results.push(path);
    }
  } catch (error) {
    results.push(path);
  }
  return results;
};

const statusOutput = run('git status --short');

let diff = run('git diff --cached');
if (!diff) {
  diff = run('git diff');
}

const untracked = statusOutput
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('?? '))
  .map((line) => line.replace('?? ', '').trim())
  .filter(Boolean);

const gitignored = IGNORE_GITIGNORED_FILES
  ? []
  : run('git ls-files -oi --exclude-standard')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

const allPaths = [...new Set([...untracked, ...gitignored])];
let syntheticFiles = allPaths.flatMap((path) => expandDirectory(path));

if (MAX_TOTAL_FILES > 0 && syntheticFiles.length > MAX_TOTAL_FILES) {
  console.log(`\n[Aviso] Encontrados ${syntheticFiles.length} arquivos novos. Limitando a ${MAX_TOTAL_FILES} arquivos.`);
  syntheticFiles = syntheticFiles.slice(0, MAX_TOTAL_FILES);
}

const syntheticDiff = syntheticFiles
  .map((file) => {
    try {
      let content = readFileSync(file, 'utf-8');
      const originalLength = content.length;
      
      if (content.length > MAX_FILE_CHARS) {
        const lines = content.split('\n');
        const truncatedLines = lines.slice(0, 30);
        content = truncatedLines.join('\n') + `\n... [arquivo truncado: ${originalLength} caracteres, mostrando primeiras 30 linhas]`;
      }
      
      return [
        `diff --git a/${file} b/${file}`,
        'new file mode 100644',
        `--- /dev/null`,
        `+++ b/${file}`,
        `@@ 0,0 @@`,
        content,
      ].join('\n');
    } catch (error) {
      return `diff --git a/${file} b/${file}\n[conteúdo indisponível: ${error.message}]`;
    }
  })
  .join('\n');

let combinedDiff = [diff, syntheticDiff].filter(Boolean).join('\n');

if (!combinedDiff) {
  console.log('Não há alterações para resumir.');
  exit(0);
}

if (MAX_DIFF_SIZE > 0 && combinedDiff.length > MAX_DIFF_SIZE) {
  const originalSize = combinedDiff.length;
  combinedDiff = combinedDiff.substring(0, MAX_DIFF_SIZE) + 
    `\n\n... [diff truncado: ${originalSize} caracteres, mostrando primeiros ${MAX_DIFF_SIZE}]`;
  console.log(`\n[Aviso] Diff muito grande (${originalSize} caracteres). Truncado para ${MAX_DIFF_SIZE} caracteres.`);
}

(async () => {
  const prompt = `A partir do diff abaixo, gere uma mensagem de commit seguindo o padrão brasileiro de commits:

FORMATO:
emoji <tipo>(escopo): resumo curto (máx. 72 caracteres)

corpo com bullets descrevendo o que mudou

TIPOS E EMOJIS:
- ✨ feat - novo recurso
- 🐛 fix - correção de bug
- 📚 docs - mudanças na documentação
- 💄 style - formatação, semicolons, lint (sem alteração de código)
- ♻️ refactor - refatoração sem alterar funcionalidade
- 🔧 build - modificações em build e dependências
- 🧪 test - alterações em testes
- 🔧 chore - tarefas de build, configurações, pacotes
- ✅ test - adicionando um teste
- 📦 build - package.json
- 🚧 wip - em progresso
- ➕ chore - adicionando dependência
- ➖ chore - removendo dependência
- 🚚 refactor - mover/renomear

INSTRUÇÕES:
1. Use SEMPRE o emoji correspondente ao tipo
2. Primeira linha: emoji + tipo(escopo): resumo curto
3. Linha em branco
4. Corpo com 1-3 bullets começando com "- "
5. Tudo em português
6. Não invente mudanças que não estejam no diff

Diff:\n${combinedDiff}`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'CLI Commit Writer',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em gerar mensagens de commit seguindo o padrão brasileiro com emojis. Sempre use o emoji correto para cada tipo de commit. Seja preciso e objetivo.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    console.error(`Erro ao consultar IA: ${response.status} ${response.statusText}`);
    exit(1);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message?.content?.trim();

  if (!message) {
    console.error('Resposta vazia do modelo.');
    exit(1);
  }

  console.log('\nSugestão de commit:');
  console.log(message);

  warnBranch('commitar');

  const shouldCommit = await askYesNo('Deseja aplicar esta mensagem e commitar?');
  if (!shouldCommit) {
    console.log('Nenhum commit realizado.');
    rl.close();
    return;
  }

  stageAll();
  commitWithMessage(message);

  warnBranch('executar git push');

  const shouldPush = await askYesNo('Commit criado. Deseja executar git push agora?');
  if (shouldPush) {
    pushChanges();
  } else {
    console.log('Push não realizado.');
  }

  rl.close();
})();
