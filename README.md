# Pen Commit AI CLI

CLI para gerar mensagens de commit com IA (formato conventional commits) e aplicar automaticamente `git add`, `git commit` e `git push`.

## Sumário
- [Recursos](#recursos)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração das variáveis de ambiente](#configuração-das-variáveis-de-ambiente)
- [Uso do commit assistido](#uso-do-commit-assistido)
- [Utilização como CLI global](#utilização-como-cli-global)
- [Scripts de desenvolvimento](#scripts-de-desenvolvimento)
- [Contribuição](#contribuição)
- [Licença](#licença)

## Recursos
- Suporte a múltiplos provedores: **OpenRouter** (via API Key) e **Antigravity** (via Login Google).
- Seleção automática de provedor no primeiro uso.
- Commit writer detecta arquivos staged, unstaged e untracked.
- Suporte a confirmação para `git commit` e `git push`.
- CLI exportado via campo `bin` para ser executado em qualquer projeto com Git.

## Pré-requisitos
- Node.js 18 ou superior.
- Uma conta Google (para modo Antigravity) ou API key do Open Router (modo OpenRouter).

## Instalação

```bash
git clone https://github.com/VTZanetti/ia-test.git
cd ia-test
npm install
```

## Configuração das variáveis de ambiente

O script gerencia as configurações automaticamente no primeiro uso, salvando no arquivo `.env`. No entanto, você pode configurar manualmente:

```
COMMIT_AI_MODE=antigravity # ou openrouter
OPEN_ROUTER_API_KEY=sua_chave_aqui
ANTIGRAVITY_REFRESH_TOKEN=seu_token_aqui
ANTIGRAVITY_PROJECT_ID=seu_projeto_aqui
```

### Prioridade de carregamento
O `commit-ai.js` procura as variáveis nesta ordem:
1. `.env` localizado junto ao CLI (`/path/do/cli/.env`).
2. `.env` do diretório em que o comando é executado.
3. Caminho apontado em `OPEN_ROUTER_ENV_PATH` (valor absoluto).

Use essa hierarquia para reutilizar a mesma chave em vários projetos sem duplicar arquivos.

## Uso do commit assistido

```bash
npm run commit:ai
```

Fluxo:
1. No primeiro uso, selecione entre OpenRouter e Antigravity (Google).
2. O script agrega `git diff --cached`, `git diff` e gera diffs sintéticos para arquivos `??` do `git status --short`.
3. A IA devolve uma mensagem de commit no formato convencional.
3. Você confirma se deseja aplicar a mensagem. Caso aceite:
   - Executa `git add -A`.
   - Cria o commit com a mensagem sugerida.
4. Pergunta se deve rodar `git push`.
5. Todas as confirmações aceitam `s`, `sim`, `y` ou `yes` (demais respostas são tratadas como `não`).

## Utilização como CLI global

Graças ao campo `bin`, o comando pode ser executado em qualquer repositório Git:

1. Faça o link global a partir deste projeto:
   ```bash
   npm link
   ```
2. Em outro repositório, basta rodar:
   ```bash
   commitai
   ```
   Certifique-se de que as variáveis de ambiente estejam acessíveis conforme explicado acima.

Alternativamente, publique o pacote em um registro privado/público ou instale via caminho local:
```bash
npm install -g /caminho/para/ia-test
```

## Scripts de desenvolvimento
- `npm run commit:ai`: executa o fluxo de commits assistidos localmente.
- `commitai`: versão CLI global (requer `npm link` ou instalação global).

## Contribuição
1. Faça um fork.
2. Crie uma branch (`git checkout -b feature/nome`).
3. Commit e push (`npm run commit:ai` pode ajudar a gerar a mensagem).
4. Abra um pull request descrevendo o que foi alterado.

## Licença
ISC License.
