# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota o
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

## [0.1.0]

Primeira versão sob a identidade Glum AI. O pacote anterior, `commitai`, nunca foi publicado, e a
numeração recomeça aqui.

### Adicionado

- Estrutura em camadas, com `src/ai`, `src/cli`, `src/config`, `src/git` e `src/internal`, e o
  executável isolado em `bin/glum.js`.
- Opções de linha de comando: `--help`, `--version`, `--yes`, `--model`, `--single-step`,
  `--no-push` e `--dry-run`.
- Normalização da mensagem gerada, removendo cercas de código, emojis e travessões.
- Verificação de que o diretório atual é um repositório git, com mensagem de erro dedicada.
- Variável `GLUM_BASE_URL`, para apontar o CLI a outro provedor compatível.
- Suíte de testes com o executor nativo do Node, cobrindo a separação do diff, a normalização da
  mensagem, a resolução das configurações e a leitura dos argumentos.
- Integração contínua no GitHub Actions, com lint, verificação de formatação e testes.
- ESLint, Prettier, EditorConfig, modelos de issue e modelo de pull request.
- Documentação de uso, configuração e arquitetura em `docs/`.

### Alterado

- As mensagens geradas passam a sair em inglês, no padrão Conventional Commits, sem emojis e sem
  menção a ferramentas de geração.
- As variáveis de ambiente adotam o prefixo `GLUM_`. Os nomes anteriores continuam sendo aceitos.
- O pacote passa a usar módulos ESM.
- O comando muda de `commitai` para `glum`.
- A licença muda de ISC para MIT, agora com um arquivo `LICENSE` no repositório.

### Removido

- O arquivo único `commit-ai.js`, substituído pelos módulos em `src/`.

[não lançado]: https://github.com/VTZanetti/glum-ai/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/VTZanetti/glum-ai/releases/tag/v0.1.0
