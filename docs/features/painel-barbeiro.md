# Painel do Barbeiro (`/barbeiro`)

Painel pessoal — cada barbeiro acessa com seu próprio login Supabase Auth.
A autenticação acontece em `/login`; o componente `App.jsx` detecta o `role` do usuário e redireciona para `/barbeiro` ou `/admin`.

## Acesso e autenticação

- Login único em `/login` para admin e barbeiros
- `App.jsx` carrega o perfil do Supabase (`barbers` WHERE `auth_id = auth.user.id`)
- `role = 'barber'` → redireciona para `/barbeiro` passando o objeto `barber` via prop
- `role = 'admin'` → redireciona para `/admin`

## KPIs (sempre visíveis, não dependem da aba ativa)

| KPI | Fonte | Observação |
|-----|-------|------------|
| Hoje | `bookings` WHERE `date = hoje` AND `barber_id = id` | Só conta quando aba = "Hoje" |
| Receita hoje | soma `total` dos bookings de hoje | Estimado, não pago confirmado |
| Últimos 7 dias | `bookings` WHERE `date >= hoje-6` | Exclui cancelados |
| Mês atual | `bookings` WHERE `date >= primeiro dia do mês` | Exclui cancelados |
| Fiado em aberto | `fiados` WHERE `status = 'pendente'` | Aparece só quando count > 0; clicável → abre aba Fiado |

## Abas

### Hoje / Semana / Pendentes
Listagem de agendamentos com cards. Queries diferentes por aba:
- **Hoje**: `date = hoje`, todos os status
- **Semana**: `date >= hoje`, exclui cancelados
- **Pendentes**: `status = 'pendente'`, `date >= hoje`

**Ações por card:**
- **Concluir** — muda status para `concluido`
- **Cancelar** — confirma via `window.confirm`, muda para `cancelado`

Não existe botão "Confirmar" — booking nasce como `confirmado` (ADR-001).

### Fiado
Componente `FiadoPanel` reaproveitado do admin com `isAdmin={false}`.
O barbeiro vê e lança fiados apenas dos seus próprios clientes.

### Config (S3 — intervalo self-service)
Select com 30/40/50/60 min que salva `interval_minutes` diretamente em `barbers`.
Afeta imediatamente os slots disponíveis para novos agendamentos com este barbeiro.

## Features dos cards

### Q1 — WA direto e confirmação
- Link `📱 [telefone]` → abre WhatsApp do cliente (número sem mensagem)
- Link `✓ WA` → abre WhatsApp com mensagem pronta:  
  `"Confirmado: [serviços] em [data] às [hora] na MK e BALÃO ✂️"`
- Ambos abrem em nova aba

### Q2 — Próximo atendimento em destaque
Na aba "Hoje", o primeiro agendamento ativo (`status != concluido` e `status != cancelado`) com horário `>= agora` recebe:
- Borda dourada (`barb-card--next`)
- Badge `em X min` (se dentro de 90 min) ou `AGORA` (piscando em vermelho, se `diffMin <= 0`)

O cálculo usa horário de Brasília (America/Sao_Paulo).

### S1 — Histórico do cliente
Clicar no nome do cliente abre modal com:
- Total de visitas e total gasto (últimos 20 atendimentos não cancelados com este barbeiro)
- Lista cronológica reversa: data, serviços, valor

A busca é por `client_phone` — evita duplicatas por variação de grafia do nome.

### S2 — Estou atrasado
Botão "Atrasado" em cards com status `pendente` ou `confirmado`.  
Abre WhatsApp com mensagem:  
`"Olá [nome]! Aviso que estou com um pequeno atraso. Já chego! MK e BALÃO ✂️"`

## Q3 — Bloquear dia próprio

Botão "🚫 Bloquear dia" na barra de ações rápidas expande um painel inline.

- Barbeiro escolhe data (mínimo: hoje) e motivo opcional
- Insere em `blocked_dates` com `barber_id = barber.id`
- Lista todos os bloqueios futuros do próprio barbeiro com botão de remoção
- Funciona independente do admin — não requer acesso ao AdminPanel

**Importante:** bloqueios globais (sem `barber_id`) continuam sendo gerenciados apenas pelo admin via ConfigPanel.

## Ações rápidas

| Botão | Ação |
|-------|------|
| Agendar para cliente | Navega para `/agendar/:slug` do próprio barbeiro |
| Compartilhar link | Copia URL de agendamento para clipboard |
| Bloquear dia | Expande/fecha painel Q3 |
| Atualizar | Recarrega bookings manualmente |
| Instalar App | Só aparece se PWA install prompt estiver disponível |

## Realtime

Canal Supabase: `barbeiro-bookings-{barber_id}`, escuta `postgres_changes` em `bookings`.

- Qualquer mudança → recarrega listagem
- `INSERT` → mostra toast "Novo agendamento!" por 4s

O canal recria quando `tab` ou `barber.id` mudam (dependência do `useEffect`).

## Navegação

**Sidebar (desktop):** Hoje, Semana, Pendentes, Fiado, Config, Social, Manual, Marca, Hub  
**Bottom nav (mobile):** Hoje, Semana, Pendentes, Fiado, Sair

Social / Manual / Marca / Hub navegam via `react-router` para rotas separadas (`/portal`, `/manual`, `/marca`, `/hub`).
