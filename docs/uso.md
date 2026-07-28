# Guia de uso

## Comando

O pacote instala um único comando, `glum`, que funciona em qualquer diretório dentro de um
repositório git.

```bash
glum
```

Sem argumentos, o CLI roda em modo interativo e pede confirmação antes de qualquer escrita.

## O que entra na análise

O CLI monta um diff único a partir de três fontes, nesta ordem:

1. `git diff --cached`, quando existe algo no stage.
2. `git diff`, quando o stage está vazio.
3. Arquivos novos, listados por `git status --short`. Como esses arquivos não têm diff, o conteúdo
   deles é convertido em um bloco no formato de arquivo recém criado.

Diretórios novos são percorridos recursivamente. Arquivos ignorados pelo `.gitignore` ficam de fora,
a menos que `GLUM_IGNORE_GITIGNORED` seja desligado.

Quando o material ultrapassa os limites configurados, o CLI avisa no terminal o que foi cortado.

## Fluxo interativo

```
$ glum

Etapa 1 de 2: resumindo 3 arquivo(s).
  3/3 src/cli/run.js
Etapa 2 de 2: escrevendo a mensagem de commit.

Mensagem sugerida:

refactor(cli): split the run loop into smaller modules

- move the argument parsing to src/cli/args.js
- keep the terminal output in a single reporter module

[aviso] Você está na branch "main" e vai criar um commit.
Aplicar esta mensagem? (s/N):
```

Respostas aceitas como sim: `s`, `sim`, `y` e `yes`. Qualquer outra entrada é tratada como não.

Depois do commit, a mesma confirmação aparece para o `git push`.

## Opções

| Opção             | Efeito                                             |
| ----------------- | -------------------------------------------------- |
| `-h`, `--help`    | Mostra a ajuda                                     |
| `-v`, `--version` | Mostra a versão instalada                          |
| `-y`, `--yes`     | Confirma o commit e o push sem perguntar           |
| `-m`, `--model`   | Usa um modelo específico nesta execução            |
| `--single-step`   | Envia o diff inteiro em uma única requisição       |
| `--no-push`       | Nunca executa `git push`                           |
| `--dry-run`       | Apenas exibe a mensagem, sem alterar o repositório |

Exemplos:

```bash
glum --dry-run
```

```bash
glum --model anthropic/claude-sonnet-4.5 --no-push
```

```bash
glum --yes --no-push
```

## Códigos de saída

| Código | Significado                                                           |
| ------ | --------------------------------------------------------------------- |
| `0`    | Execução concluída, inclusive quando não havia alterações a descrever |
| `1`    | Falha de configuração, de repositório ou do provedor                  |

## Uso programático

Os módulos também podem ser importados por outros scripts Node:

```js
import { OpenRouterClient, generateCommitMessage, resolveSettings } from 'glum-ai'

const settings = resolveSettings(process.env)
const client = new OpenRouterClient(settings)

const message = await generateCommitMessage({
  client,
  diff: meuDiff,
  settings,
})
```
