# Arquitetura

## Estrutura de diretórios

```
bin/
  glum.js         ponto de entrada executável
src/
  ai/             cliente do provedor, prompts e geração da mensagem
  cli/            leitura de argumentos, perguntas e saída no terminal
  config/         carregamento do .env e resolução das configurações
  git/            leitura e escrita no repositório
  internal/       utilidades privadas, sem regra de negócio
  constants.js    identidade do produto e padrões do provedor
  index.js        API pública do pacote
tests/            testes unitários
docs/             documentação de referência
```

## Camadas

O código é separado por responsabilidade, e a dependência aponta sempre para dentro.

| Camada     | Responsabilidade                                   | Pode importar     |
| ---------- | -------------------------------------------------- | ----------------- |
| `cli`      | Ler argumentos, perguntar e imprimir               | todas as demais   |
| `ai`       | Falar com o provedor e produzir a mensagem         | `git`, `internal` |
| `git`      | Ler o estado do repositório e aplicar as operações | `internal`        |
| `config`   | Resolver a configuração a partir do ambiente       | `constants`       |
| `internal` | Funções puras de texto e execução de processos     | nada              |

Duas regras sustentam essa separação:

- Nenhum módulo fora de `cli` escreve no terminal. As camadas internas devolvem dados, como a lista
  de avisos de `collectChanges`, e a camada `cli` decide como exibir.
- Nenhum módulo fora de `cli` encerra o processo. Erros sobem como exceção e viram código de saída
  em um único lugar.

## Fluxo de uma execução

```
bin/glum.js
  └── cli/run.js
        ├── cli/args.js          lê as opções da linha de comando
        ├── config/env.js        carrega os arquivos .env
        ├── config/settings.js   resolve e valida a configuração
        ├── git/changes.js       monta o diff combinado
        │     ├── git/repository.js
        │     └── git/diff.js
        ├── ai/commitMessage.js  gera a mensagem
        │     ├── ai/openRouter.js
        │     ├── ai/prompts.js
        │     └── ai/format.js
        ├── cli/prompts.js       confirma commit e push
        └── git/repository.js    aplica add, commit e push
```

## Geração da mensagem

O módulo `ai/commitMessage.js` tem duas estratégias.

**Duas etapas**, o padrão. `git/diff.js` separa o diff por arquivo, cada arquivo vira uma requisição
curta de resumo e os resumos são combinados em uma última requisição. Requisições pequenas cabem em
contas com limite baixo, e o resumo de um arquivo que falha é substituído por um marcador em vez de
abortar a execução.

**Uma etapa**, ativada por `--single-step` ou `GLUM_TWO_STEP=false`. Envia o diff inteiro em uma
única requisição. Menos chamadas, porém sujeito ao limite de contexto do modelo.

As duas estratégias terminam em `ai/format.js`, que remove cercas de código, emojis e travessões que
o modelo tenha inserido apesar das instruções do prompt.

## Erros

Cada camada declara o próprio tipo de erro: `ConfigurationError`, `RepositoryError`,
`ProviderError` e `ArgumentError`. O `cli/run.js` captura todos, imprime a mensagem e devolve o
código de saída, sem chamar `process.exit` no meio do fluxo.

## Testes

Os testes usam o executor nativo do Node, sem dependências adicionais:

```bash
npm run test
```

A cobertura se concentra nos módulos puros, que concentram a lógica sujeita a regressão: separação do
diff, normalização da mensagem, resolução das configurações e leitura dos argumentos. A geração da
mensagem é testada com um cliente falso que registra os prompts recebidos.
