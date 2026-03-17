# Terminal IA CLI

Terminal de linha de comando para conversar com a IA via Pen Router com respostas em streaming.

## Pré-requisitos
- Node.js 18+
- Variável de ambiente `PEN_ROUTER_API_KEY` com a chave do Pen Router.

## Configuração
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um arquivo `.env` baseado no exemplo abaixo:
   ```bash
   PEN_ROUTER_API_KEY=seu_token_aqui
   PEN_ROUTER_MODEL=openrouter/auto
   ```

## Uso
Execute o chat com:
```bash
npm start
```
Digite mensagens e aguarde o streaming da resposta. Use `/exit` para sair.

### Commit assistido por IA
Para gerar uma sugestão de mensagem de commit baseada no estado atual do repositório (staged, unstaged e arquivos novos ainda não adicionados) e decidir se aplica automaticamente:
```bash
npm run commit:ai
```
O script agrega `git diff --cached`, depois `git diff` e inclui untracked listados em `git status --short`. Após exibir a mensagem sugerida (cabeçalho + bullets), ele pergunta se você deseja:
1. Aplicar a mensagem no `git commit` (inclui `git add -A`).
2. Caso confirme, pergunta se deseja executar `git push`.
Responda `s` ou `sim` para confirmar cada etapa.

## Limitações
- Apenas um chat por vez.
- Histórico em memória; ao fechar o terminal, a conversa é perdida.

## Próximos passos sugeridos
- Adicionar suporte a múltiplos modelos e histórico persistente.
- Implementar parâmetros configuráveis (temperatura, top_p, etc.).
