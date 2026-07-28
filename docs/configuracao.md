# Referência de configuração

Toda a configuração vem de variáveis de ambiente, normalmente declaradas em um arquivo `.env`.

## Variáveis

| Variável                 | Padrão                         | Descrição                                                    |
| ------------------------ | ------------------------------ | ------------------------------------------------------------ |
| `GLUM_API_KEY`           | obrigatória                    | Chave de API do provedor                                     |
| `GLUM_MODEL`             | `openrouter/auto`              | Modelo usado nas requisições                                 |
| `GLUM_BASE_URL`          | `https://openrouter.ai/api/v1` | Endereço base da API compatível com o OpenRouter             |
| `GLUM_TWO_STEP`          | `true`                         | Resume cada arquivo antes de escrever a mensagem             |
| `GLUM_MAX_CHUNK_CHARS`   | `8000`                         | Máximo de caracteres enviados por arquivo na etapa de resumo |
| `GLUM_MAX_FILE_CHARS`    | `2000`                         | Tamanho a partir do qual um arquivo novo vira uma prévia     |
| `GLUM_MAX_FILES`         | `50`                           | Máximo de arquivos novos considerados                        |
| `GLUM_MAX_DIFF_CHARS`    | `100000`                       | Tamanho máximo do diff combinado                             |
| `GLUM_IGNORE_GITIGNORED` | `true`                         | Ignora os arquivos listados no `.gitignore`                  |
| `GLUM_ENV_PATH`          | não definida                   | Caminho absoluto de um `.env` adicional                      |

Os limites são medidos em caracteres. O valor `0` desliga o limite em `GLUM_MAX_FILES`,
`GLUM_MAX_FILE_CHARS` e `GLUM_MAX_DIFF_CHARS`.

Valores booleanos são lidos como verdadeiros, exceto `false`, `0`, `no` e `off`, em qualquer
combinação de maiúsculas e minúsculas.

Desligar `GLUM_IGNORE_GITIGNORED` afeta apenas o que é enviado ao modelo. O commit continua sendo
criado com `git add -A`, que respeita o `.gitignore`, então esses arquivos aparecem na descrição sem
entrar no commit.

## Nomes anteriores

Os nomes usados antes da adoção do prefixo `GLUM_` continuam funcionando, e o nome novo tem
prioridade quando os dois estão definidos.

| Nome atual               | Nome anterior             |
| ------------------------ | ------------------------- |
| `GLUM_API_KEY`           | `OPEN_ROUTER_API_KEY`     |
| `GLUM_MODEL`             | `OPEN_ROUTER_MODEL`       |
| `GLUM_BASE_URL`          | `OPEN_ROUTER_BASE_URL`    |
| `GLUM_ENV_PATH`          | `OPEN_ROUTER_ENV_PATH`    |
| `GLUM_TWO_STEP`          | `USE_TWO_STEP_PROCESSING` |
| `GLUM_MAX_CHUNK_CHARS`   | `MAX_CHUNK_SIZE`          |
| `GLUM_MAX_FILE_CHARS`    | `MAX_FILE_CHARS`          |
| `GLUM_MAX_FILES`         | `MAX_TOTAL_FILES`         |
| `GLUM_MAX_DIFF_CHARS`    | `MAX_DIFF_SIZE`           |
| `GLUM_IGNORE_GITIGNORED` | `IGNORE_GITIGNORED_FILES` |

## Onde o `.env` é procurado

Três arquivos são lidos, nesta ordem:

1. O `.env` que fica junto do pacote instalado.
2. O `.env` do diretório em que o comando foi executado.
3. O caminho apontado por `GLUM_ENV_PATH`.

Os arquivos lidos depois sobrescrevem os valores dos anteriores. Na prática, a chave global fica no
primeiro arquivo e cada projeto ajusta apenas o que precisa mudar.

## Escolha do modelo

O valor de `GLUM_MODEL` é repassado direto ao provedor, então qualquer identificador aceito por ele
funciona. `openrouter/auto` deixa a escolha a cargo do roteador.

Para testar um modelo sem alterar o `.env`:

```bash
glum --model anthropic/claude-sonnet-4.5 --dry-run
```

## Ajuste dos limites

Os limites existem para caber na janela de contexto e no orçamento de tokens da conta.

- Contas gratuitas costumam funcionar bem com `GLUM_TWO_STEP=true` e `GLUM_MAX_CHUNK_CHARS` entre
  4000 e 8000.
- Contas pagas com janela grande podem usar `GLUM_TWO_STEP=false`, que envia tudo de uma vez e reduz
  o número de requisições.
- Repositórios com muitos arquivos novos, como uma primeira importação, pedem um `GLUM_MAX_FILES`
  maior ou um commit inicial feito à mão.
