# Bot ROCIE — Registro de continuidade (29/10/2026)

## Objetivo
Bot próprio via WhatsApp Business Cloud API da Meta, com futura integração ao TOTVS Protheus e substituição da Blip. Projeto independente do PRJ0226.

## Infraestrutura
- GitHub: https://github.com/boninicsb/bot-rocie (branch main)
- Render Free: https://bot-rocie.onrender.com
- Webhook: https://bot-rocie.onrender.com/webhook
- Node.js nativo, arquivo principal server.js, start via npm start
- KingHost foi tentada, mas não funcionou para este teste.

## Validado
- Aplicação Node.js acessível por HTTPS; GET / retorna JSON status online.
- GET /webhook verificado e salvo na Meta.
- Assinatura de webhooks ativada e evento messages recebido com sucesso no Render.
- POST /webhook verifica assinatura X-Hub-Signature-256 com META_APP_SECRET.
- Número real cadastrado na Meta; confirmar estado de conexão antes de produção.

## Última alteração
- Commit: 8584fd6387baf8351578daffba7cc83c96e2cd22
- Implementada resposta automática para Oi, Olá, Bom dia, Boa tarde e Boa noite.
- Texto: "Olá! Bem-vindo ao atendimento automatizado do Grupo ROCIE. Como podemos ajudar?"
- Envio pela Graph API, sem bibliotecas externas.
- Ignora eventos de status e mensagens não textuais.
- Deduplicação temporária em memória; NÃO adequada para produção.

## Variáveis de ambiente
Já configuradas anteriormente: WHATSAPP_VERIFY_TOKEN e META_APP_SECRET.
A configurar/conferir no Render:
- WHATSAPP_ACCESS_TOKEN (segredo, nunca versionar)
- WHATSAPP_PHONE_NUMBER_ID (obter/conferir no painel Meta)
- META_GRAPH_VERSION (opcional, valor inicial v23.0)
Não registrar valores secretos no GitHub.

## Próxima ação exata
1. Confirmar que Render publicou o commit mais recente.
2. Cadastrar as variáveis de envio no Render.
3. Enviar 'Olá' de outro WhatsApp para o número comercial.
4. Conferir resposta e logs; investigar erros da Graph API se necessário.
5. Depois criar persistência/idempotência, fila confiável, fluxo de identificação de telefone, cadastro, token por e-mail, perfis Cliente/Representante/Colaborador e integração Protheus.

## Atenção
Render Free pode suspender após inatividade e não é recomendado para produção. O código ainda não foi validado em envio real. Não afirmar que a resposta automática já funciona sem teste.
