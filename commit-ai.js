#!/usr/bin/env node
const { execSync, spawn } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync, unlinkSync, lstatSync, readdirSync, mkdirSync } = require('node:fs');
const readline = require('node:readline/promises');
const { tmpdir, homedir, platform, arch } = require('node:os');
const { join, dirname } = require('node:path');
const { exit, stdin, stdout } = require('node:process');
const http = require('node:http');
const crypto = require('node:crypto');
const { config } = require('dotenv');

const envCandidates = [
  join(__dirname, '.env'),
  join(process.cwd(), '.env'),
  process.env.OPEN_ROUTER_ENV_PATH,
].filter(Boolean);

let envPath = envCandidates.find(p => existsSync(p)) || join(process.cwd(), '.env');

envCandidates.forEach((path, index) => {
  if (existsSync(path)) {
    config({ path, override: index !== 0 });
  }
});

// Antigravity / Google OAuth Constants
const OAUTH_CONFIG = {
  clientId: '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com',
  clientSecret: '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',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo',
  callbackPort: 51121,
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/cclog',
    'https://www.googleapis.com/auth/experimentsandconfigs'
  ]
};

const ANTIGRAVITY_ENDPOINTS = [
  'https://daily-cloudcode-pa.googleapis.com',
  'https://cloudcode-pa.googleapis.com'
];

const ANTIGRAVITY_HEADERS = {
  'User-Agent': `antigravity/1.107.0 ${platform()}/${arch()}`,
  'Content-Type': 'application/json',
  'X-Client-Name': 'antigravity',
  'X-Client-Version': '1.107.0',
  'x-goog-api-client': 'gl-node/18.18.2 fire/0.8.6 grpc/1.10.x'
};

const MODE = process.env.COMMIT_AI_MODE || ''; // 'openrouter' or 'antigravity'
const OPEN_ROUTER_KEY = process.env.OPEN_ROUTER_API_KEY;
const ANTIGRAVITY_REFRESH_TOKEN = process.env.ANTIGRAVITY_REFRESH_TOKEN;
const ANTIGRAVITY_PROJECT_ID = process.env.ANTIGRAVITY_PROJECT_ID;

const MODEL = process.env.OPEN_ROUTER_MODEL || (MODE === 'antigravity' ? 'claude-sonnet-4-6-thinking' : 'openrouter/auto');
const IGNORE_GITIGNORED_FILES = process.env.IGNORE_GITIGNORED_FILES !== 'false';
const MAX_FILE_CHARS = parseInt(process.env.MAX_FILE_CHARS || '2000', 10);
const MAX_TOTAL_FILES = parseInt(process.env.MAX_TOTAL_FILES || '50', 10);
const MAX_DIFF_SIZE = parseInt(process.env.MAX_DIFF_SIZE || '100000', 10);
const OPEN_ROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const saveEnv = (key, value) => {
  let content = '';
  if (existsSync(envPath)) {
    content = readFileSync(envPath, 'utf-8');
  }
  const lines = content.split('\n');
  const index = lines.findIndex((line) => line.startsWith(`${key}=`));
  if (index !== -1) {
    lines[index] = `${key}=${value}`;
  } else {
    lines.push(`${key}=${value}`);
  }
  writeFileSync(envPath, lines.join('\n'), 'utf-8');
  process.env[key] = value;
};

const generatePKCE = () => {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
};

const openBrowser = (url) => {
  const plat = platform();
  let cmd = plat === 'darwin' ? 'open' : plat === 'win32' ? 'cmd' : 'xdg-open';
  let args = plat === 'win32' ? ['/c', 'start', '', url.replace(/&/g, '^&')] : [url];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
};

const startCallbackServer = (expectedState) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${OAUTH_CONFIG.callbackPort}`);
      if (url.pathname !== '/oauth-callback') {
        res.writeHead(404);
        res.end();
        return;
      }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (state !== expectedState) {
        res.writeHead(400);
        res.end('State mismatch');
        server.close();
        reject(new Error('State mismatch'));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Login successful!</h1><p>You can close this window now.</p><script>setTimeout(() => window.close(), 2000)</script>');
      server.close();
      resolve(code);
    });
    server.listen(OAUTH_CONFIG.callbackPort);
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout waiting for login'));
    }, 120000);
  });
};

const exchangeCode = async (code, verifier) => {
  const response = await fetch(OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: `http://localhost:${OAUTH_CONFIG.callbackPort}/oauth-callback`
    })
  });
  if (!response.ok) throw new Error(`Token exchange failed: ${await response.text()}`);
  return response.json();
};

const refreshAccessToken = async (refreshToken) => {
  const response = await fetch(OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  if (!response.ok) throw new Error(`Token refresh failed: ${await response.text()}`);
  return response.json();
};

const discoverProjectId = async (accessToken) => {
  for (const endpoint of ANTIGRAVITY_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}/v1internal:loadCodeAssist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...ANTIGRAVITY_HEADERS
        },
        body: JSON.stringify({ metadata: { ideType: 9, platform: 3, pluginType: 2 } }) // Basic metadata
      });
      if (!response.ok) continue;
      const data = await response.json();
      return data.cloudaicompanionProject?.id || data.cloudaicompanionProject || null;
    } catch (e) { /* ignore */ }
  }
  return 'rising-fact-p41fc'; // Fallback project ID
};

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
  let currentMode = MODE;
  if (!currentMode) {
    console.log('Escolha o provedor de IA:');
    console.log('1. OpenRouter (requer API Key)');
    console.log('2. Antigravity (Login com Google)');
    const choice = await rl.question('Selecione (1 ou 2): ');
    currentMode = choice === '2' ? 'antigravity' : 'openrouter';
    saveEnv('COMMIT_AI_MODE', currentMode);
  }

  let finalApiKey = OPEN_ROUTER_KEY;
  let finalProjectId = ANTIGRAVITY_PROJECT_ID;
  let finalRefreshToken = ANTIGRAVITY_REFRESH_TOKEN;

  if (currentMode === 'openrouter' && !finalApiKey) {
    finalApiKey = await rl.question('Digite sua OPEN_ROUTER_API_KEY: ');
    saveEnv('OPEN_ROUTER_API_KEY', finalApiKey);
  }

  if (currentMode === 'antigravity' && !finalRefreshToken) {
    const { verifier, challenge } = generatePKCE();
    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      redirect_uri: `http://localhost:${OAUTH_CONFIG.callbackPort}/oauth-callback`,
      response_type: 'code',
      scope: OAUTH_CONFIG.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state
    });
    const url = `${OAUTH_CONFIG.authUrl}?${params.toString()}`;
    console.log('Abrindo navegador para login no Google...');
    openBrowser(url);
    const code = await startCallbackServer(state);
    const tokens = await exchangeCode(code, verifier);
    finalRefreshToken = tokens.refresh_token;
    saveEnv('ANTIGRAVITY_REFRESH_TOKEN', finalRefreshToken);
    const email = (await (await fetch(OAUTH_CONFIG.userInfoUrl, { headers: { Authorization: `Bearer ${tokens.access_token}` } })).json()).email;
    console.log(`Logado como: ${email}`);
    finalProjectId = await discoverProjectId(tokens.access_token);
    saveEnv('ANTIGRAVITY_PROJECT_ID', finalProjectId);
  }

  const getCommitMessage = async (diffContent) => {
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

Diff:\n${diffContent}`;

    if (currentMode === 'openrouter') {
      const resp = await fetch(OPEN_ROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${finalApiKey}`,
          'HTTP-Referer': 'http://localhost',
          'X-Title': 'CLI Commit Writer',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: 'Você é um especialista em gerar mensagens de commit seguindo o padrão brasileiro com emojis. Sempre use o emoji correto para cada tipo de commit. Seja preciso e objetivo.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
        }),
      });
      if (!resp.ok) throw new Error(`Erro OpenRouter: ${resp.status} ${await resp.text()}`);
      const data = await resp.json();
      return data.choices?.[0]?.message?.content?.trim();
    } else {
      const tokens = await refreshAccessToken(finalRefreshToken);
      const payload = {
        project: finalProjectId,
        model: MODEL,
        request: {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { role: 'user', parts: [{ text: 'Você é um especialista em gerar mensagens de commit seguindo o padrão brasileiro com emojis. Sempre use o emoji correto para cada tipo de commit. Seja preciso e objetivo.' }] }
        },
        userAgent: 'antigravity',
        requestType: 'agent',
        requestId: 'agent-' + crypto.randomUUID()
      };
      const resp = await fetch(`${ANTIGRAVITY_ENDPOINTS[1]}/v1internal:streamGenerateContent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
          ...ANTIGRAVITY_HEADERS
        },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Erro Antigravity: ${resp.status} ${await resp.text()}`);
      
      const text = await resp.text();
      // Simple parsing for streaming JSON chunks (rough implementation)
      const matches = text.match(/"text":\s*"([^"]+)"/g);
      if (matches) {
        return matches.map(m => m.match(/"text":\s*"([^"]+)"/)[1].replace(/\\n/g, '\n')).join('').trim();
      }
      return 'Erro ao processar resposta do Antigravity.';
    }
  };

  const message = await getCommitMessage(combinedDiff);

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
