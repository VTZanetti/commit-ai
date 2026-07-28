# Política de segurança

## Versões suportadas

| Versão | Suporte |
| ------ | ------- |
| 0.1.x  | Sim     |

## Reportando uma vulnerabilidade

Use a aba Security do repositório e a opção de aviso privado, ou entre em contato pelo perfil
[@VTZanetti](https://github.com/VTZanetti). Evite abrir uma issue pública com os detalhes.

A resposta inicial costuma sair em até sete dias. Correções são publicadas como versão de patch, com
crédito ao autor do relato quando houver interesse.

## Chave de API e conteúdo enviado

O CLI envia o diff do repositório para o provedor configurado em `GLUM_BASE_URL`. Isso inclui o
conteúdo dos arquivos novos. Antes de usar a ferramenta em um repositório com dados sensíveis:

- Verifique a política de retenção do provedor escolhido.
- Mantenha segredos fora do diretório de trabalho ou listados no `.gitignore`, já que arquivos
  ignorados ficam de fora por padrão.
- Nunca versione o arquivo `.env`. Ele já está listado no `.gitignore`.

Se uma chave for exposta em um commit, revogue a chave no provedor antes de reescrever o histórico.
