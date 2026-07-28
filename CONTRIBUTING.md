# Guia de contribuição

Obrigado pelo interesse em contribuir com o Glum AI.

## Ambiente

O projeto exige Node 20.19 ou superior. A versão usada na integração contínua está no arquivo
`.nvmrc`.

```bash
npm install
npm start -- --dry-run
```

O modo `--dry-run` executa o fluxo completo sem tocar no repositório, o que é a forma mais rápida de
verificar uma alteração.

## Scripts

| Script                 | Função                                     |
| ---------------------- | ------------------------------------------ |
| `npm start`            | Executa o CLI a partir do código fonte     |
| `npm run test`         | Executa a suíte de testes                  |
| `npm run test:watch`   | Executa os testes em modo observação       |
| `npm run lint`         | Executa o ESLint                           |
| `npm run lint:fix`     | Corrige o que o ESLint conseguir corrigir  |
| `npm run format`       | Aplica o Prettier em todo o repositório    |
| `npm run format:check` | Verifica a formatação sem alterar arquivos |

Antes de abrir um pull request, os comandos `lint`, `format:check` e `test` precisam passar.

## Idiomas

Para manter o projeto legível tanto para quem lê português quanto para quem chega pelo GitHub:

- Código, comentários, nomes de teste e mensagens de commit em inglês.
- Documentação e textos exibidos no terminal em português.

## Mensagens de commit

O projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

Escopos usados no repositório: `cli`, `ai`, `git`, `config`, `docs`, `deps`.

A descrição usa o modo imperativo, começa em letra minúscula e não termina com ponto. Emojis,
travessões e menções a ferramentas de geração não entram na mensagem.

```
feat(cli): add a dry run flag
fix(git): keep untracked directories out of the file limit
docs: document the environment variables
```

## Estilo de código

O Prettier e o ESLint definem a formatação, e as configurações estão no repositório. Além disso:

- Módulos ESM, com extensão `.js` explícita nos imports relativos.
- Comentários em inglês, no formato `/** ... */`, explicando por que o código existe e não o que ele
  faz linha a linha.
- Cada camada exporta funções puras sempre que possível, e o efeito colateral fica nas bordas.
- Nenhum módulo fora de `src/cli` imprime no terminal ou encerra o processo.

A separação de camadas está descrita em [docs/arquitetura.md](./docs/arquitetura.md).

## Testes

Os testes usam o executor nativo do Node, em `tests/`. Um arquivo de teste por módulo, com nomes de
caso em inglês e no presente do indicativo:

```js
it('rejects unknown flags', () => {})
```

Alterações em `src/ai`, `src/git` e `src/config` precisam vir com teste. Chamadas ao provedor são
substituídas por um cliente falso, e nenhum teste executa comandos git de escrita.

## Reportando problemas

Abra uma issue usando um dos modelos disponíveis. Remova a chave de API antes de colar qualquer
saída do terminal.
