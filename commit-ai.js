#!/usr/bin/env node
const { execSync } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require('node:fs');
const readline = require('node:readline/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { exit, stdin, stdout } = require('node:process');
const { config } = require('dotenv');

const envCandidates = [
  join(__dirname, '.env'),
  join(process.cwd(), '.env'),
  process.env.PEN_ROUTER_ENV_PATH,
].filter(Boolean);

envCandidates.forEach((path, index) => {
  if (existsSync(path)) {
    config({ path, override: index !== 0 });
  }
});

const API_KEY = process.env.PEN_ROUTER_API_KEY;
const MODEL = process.env.PEN_ROUTER_MODEL || 'openrouter/auto';
const IGNORE_GITIGNORED_FILES = process.env.IGNORE_GITIGNORED_FILES !== 'false';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!API_KEY) {
  console.error('Erro: Defina PEN_ROUTER_API_KEY para gerar commits com IA.');
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
      // ignore cleanup errors
    }
  }
};

const pushChanges = () => runStreaming('git push');

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

const syntheticFiles = [...new Set([...untracked, ...gitignored])];

const syntheticDiff = syntheticFiles
  .map((file) => {
    try {
      const content = readFileSync(file, 'utf-8');
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

const combinedDiff = [diff, syntheticDiff].filter(Boolean).join('\n');

if (!combinedDiff) {
  console.log('Não há alterações para resumir.');
  exit(0);
}

(async () => {
  const prompt = `A partir do diff abaixo, gere uma mensagem de commit seguindo conventional commits:\n1. Primeira linha: <tipo>(opcional-escopo): resumo curto (máx. 72 caracteres).\n2. Linha em branco.\n3. Corpo com 1-3 bullets começando com "- " descrevendo o que mudou.\n4. Escreva tudo em português.\nDiff:\n${combinedDiff}`;

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
            'Você gera mensagens de commit conforme instruções do usuário, sempre retornando cabeçalho + corpo conforme solicitado. Não invente mudanças que não estejam no diff.',
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
