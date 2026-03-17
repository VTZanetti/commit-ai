#!/usr/bin/env node
const readline = require('node:readline');
const { stdin, stdout, exit } = require('node:process');
const { config } = require('dotenv');

config();

const API_KEY = process.env.PEN_ROUTER_API_KEY;
const MODEL = process.env.PEN_ROUTER_MODEL || 'openrouter/auto';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!API_KEY) {
  console.error('Erro: Defina PEN_ROUTER_API_KEY no arquivo .env ou nas variáveis de ambiente.');
  exit(1);
}

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
  prompt: 'Você > ',
});

const conversation = [
  {
    role: 'system',
    content: 'Você é uma IA útil respondendo no terminal. Mantenha as respostas concisas e claras.',
  },
];

const renderAssistantPrompt = () => {
  stdout.write('\nIA   > ');
};

async function streamCompletion(messages) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'CLI Chat',
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let assistantText = '';

  renderAssistantPrompt();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (!chunk.startsWith('data:')) continue;
      const data = chunk.replace(/^data:\s*/, '');
      if (data === '[DONE]') {
        stdout.write('\n');
        conversation.push({ role: 'assistant', content: assistantText.trim() });
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        if (delta) {
          assistantText += delta;
          stdout.write(delta);
        }
      } catch (error) {
        console.error('\n[Streaming] Erro ao parsear chunk:', error.message);
      }
    }
  }
}

async function handlePrompt(prompt) {
  if (!prompt.trim()) {
    rl.prompt();
    return;
  }

  if (prompt.trim().toLowerCase() === '/exit') {
    rl.close();
    return;
  }

  conversation.push({ role: 'user', content: prompt });

  try {
    await streamCompletion(conversation);
  } catch (error) {
    console.error(`\n[Erro] ${error.message}`);
  } finally {
    stdout.write('\n');
    rl.prompt();
  }
}

rl.on('line', handlePrompt);
rl.on('SIGINT', () => {
  console.log('\nEncerrando...');
  rl.close();
});

console.log('Terminal IA iniciado. Digite sua mensagem ou /exit para sair.');
rl.prompt();
