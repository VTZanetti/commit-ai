<h1 align="center">Glum AI</h1>

<p align="center">
  CLI que lê as alterações do repositório e escreve a mensagem de commit no padrão Conventional Commits.
</p>

<p align="center">
  <a href="https://github.com/VTZanetti/glum-ai/actions/workflows/ci.yml"><img src="https://github.com/VTZanetti/glum-ai/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/glum-ai"><img src="https://img.shields.io/npm/v/glum-ai" alt="npm"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="MIT"></a>
</p>

## Diferenciais

A maioria dos geradores de commit envia o diff inteiro em uma requisição e devolve um texto genérico.
O Glum AI faz três coisas além disso:

- **Processamento em duas etapas.** Cada arquivo é resumido em uma requisição pequena e só depois os
  resumos viram a mensagem final. Isso cabe nos limites de contas gratuitas e sobrevive à falha de um
  arquivo isolado.
- **Arquivos novos entram no contexto.** Arquivos ainda não rastreados não têm diff, então o CLI monta
  um bloco sintético com o conteúdo deles antes de enviar.
- **Saída limpa por construção.** O prompt proíbe emojis, travessões e qualquer menção a ferramentas,
  e uma etapa de normalização remove o que o modelo insistir em incluir.

A única dependência de runtime é o `dotenv`.

## Instalação

```bash
npm install -g glum-ai
```

Para usar direto do código fonte:

```bash
git clone https://github.com/VTZanetti/glum-ai.git
cd glum-ai
npm install
npm link
```

## Configuração

Crie um arquivo `.env` a partir do modelo e informe a chave de API:

```bash
cp .env.example .env
```

```ini
GLUM_API_KEY=coloque_sua_chave_aqui
GLUM_MODEL=openrouter/auto
```

A referência completa das variáveis está em [docs/configuracao.md](./docs/configuracao.md).

## Uso

Dentro de qualquer repositório git:

```bash
glum
```

O fluxo é sempre o mesmo:

1. O CLI reúne o diff staged, o diff do diretório de trabalho e os arquivos novos.
2. O modelo escreve a mensagem, que é exibida no terminal.
3. Você confirma o commit. Só então o CLI executa `git add -A` e `git commit`.
4. Você confirma o push. Só então o CLI executa `git push`.

Nenhuma alteração é aplicada sem confirmação, e o nome da branch atual aparece antes de cada etapa.

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

## Formato da mensagem

As mensagens saem em inglês, no padrão [Conventional Commits](https://www.conventionalcommits.org/),
sem emojis e sem qualquer marca de como foram escritas:

```
feat(git): collect untracked files into the diff

- build a synthetic diff block for files git does not track yet
- respect the file and character limits from the settings
```

## Documentação

- [Guia de uso](./docs/uso.md)
- [Referência de configuração](./docs/configuracao.md)
- [Arquitetura](./docs/arquitetura.md)

## Contribuindo

Leia o [guia de contribuição](./CONTRIBUTING.md) antes de abrir um pull request.

## Licença

[MIT](./LICENSE) © Vitor Zanetti
