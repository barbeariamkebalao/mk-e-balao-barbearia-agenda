# MK e BALÃO Barbearia — Sistema de Agendamento

Sistema completo de agendamento online para a **MK e BALÃO Barbearia** (Piraju-SP), desenvolvido pela [Fluency Works](https://fluencyworks.com.br).

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 |
| Roteamento | React Router v6 (code-split via `React.lazy`) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS + Storage + Realtime) |
| PWA | `vite-plugin-pwa` + Workbox |
| CSS | Tailwind (utilitários) + CSS custom (design system dark vintage) |
| Deploy | Supabase Edge + Vercel (estático) |

---

## Funcionalidades

### Agendamento público (`/agendar`)
- Chatbot conversacional com 3 personalidades (clássico, urbano, carismático)
- Fluxo: **Nome → Profissional → Categoria → Serviço → Adicionais → Horário → OK**
- Coleta nome antes de escolher o barbeiro — saudação personalizada
- **Cliente recorrente:** detecta agendamento futuro via `localStorage` + Supabase; exibe card com opção de cancelar ou agendar novo (ver `docs/features/chatbot-cliente-recorrente.md`)
- Auto-pulo de categoria quando barbeiro tem somente uma disponível
- Adicionais: texto do botão e total estimado atualizam em tempo real conforme seleção
- "Primeiro Disponível" com shuffle justo (sem viés por `sort_order`) + filtro por serviços habilitados do barbeiro
- Booking nasce como `confirmado` — sem etapa de aprovação manual (ver `docs/decisoes/ADR-001-status-flow.md`)
- Máscara e validação de telefone brasileira (DDD + celular/fixo)
- Duração total do serviço exibida na confirmação
- Token de cancelamento gerado no client-side (sem round-trip)
- Cancelamento via link único (`/cancelar/:token`) com prazo de 24h

### Painel Admin (`/admin`)
- Dashboard com KPIs: agendamentos hoje, receita do dia, semana e mês atual
- KPIs atualizam automaticamente via Supabase Realtime (sem refresh manual)
- Filtro por barbeiro + busca por nome/telefone
- Paginação (50 por página) para histórico completo
- Realtime toast ao receber novo agendamento
- Escape fecha o dropdown de navegação

#### Módulos do Admin
| Tab | Função |
|-----|--------|
| Hoje / Todos | Gestão de agendamentos — ciclo de status: confirmado → concluido / cancelado |
| Analytics | Receita por período, por barbeiro, taxa de cancelamento |
| Agenda | Disponibilidade semanal por barbeiro com validação de horário |
| Serviços | CRUD completo com categorias, badges, preço fixo / a partir de |
| Equipe | Gestão de barbeiros, intervalo de atendimento (30/40/50/60 min), foto |
| Serviços × Barbeiro | Matriz de serviços habilitados por barbeiro |
| Fiado | Lançamento de crédito com alerta de vencimento e link WA de cobrança |
| Galeria | Upload com drag-and-drop, reordenação, ativar/ocultar fotos |
| Clube | Planos de assinatura com benefícios e CTA WhatsApp |
| Chat Agenda | Configuração da personalidade do chatbot |
| Config | Dados da barbearia, dias bloqueados, credenciais digitais |

### Painel Barbeiro (`/barbeiro`)
- KPIs pessoais: hoje, receita hoje, últimos 7 dias, mês atual
- Card "Fiado em aberto" — clicável, soma total pendente
- Realtime: novo agendamento notifica instantaneamente
- Ações rápidas: agendar para cliente, copiar link, instalar PWA
- Módulo Fiado com busca por nome de cliente
- **Q1 WA ao cliente:** botão "✓ WA" em cada card abre WhatsApp com mensagem de confirmação pronta
- **Q2 Próximo em destaque:** badge "em X min" / "AGORA" + borda dourada no próximo agendamento do dia
- **Q3 Bloquear dia próprio:** barbeiro registra folga/atestado sem precisar do admin
- **S1 Histórico do cliente:** clicar no nome abre modal com visitas, total gasto e serviços realizados
- **S2 Estou atrasado:** botão abre WA com aviso de atraso para o cliente
- **S3 Intervalo self-service:** aba Config com select 30/40/50/60 min, salva diretamente no perfil

---

## Banco de Dados (Supabase)

### Tabelas principais
| Tabela | Descrição |
|--------|-----------|
| `barbers` | Barbeiros com `interval_minutes` (30/40/50/60), `active`, `sort_order` |
| `bookings` | Agendamentos com `cancel_token`, `total_minutes`, `services` (JSONB) |
| `services` | Serviços com `category`, `price_type` (fixed/from), `is_addon` |
| `availability` | Grade de disponibilidade semanal por barbeiro |
| `blocked_dates` | Dias bloqueados globais ou por barbeiro |
| `barber_services` | Relação M:N barbeiro × serviço |
| `gallery` | Fotos da galeria com `sort_order`, `active` |
| `fiados` | Registro de crédito com `due_date`, `status`, `amount` |
| `plans` | Planos do Clube de Assinatura |
| `settings` | Configurações da barbearia (1 row) |

### Storage Buckets
| Bucket | Uso |
|--------|-----|
| `gallery-images` | Fotos do portfólio (público) |
| `barber-images` | Fotos de perfil dos barbeiros |

### Migrations pendentes (rodar no Supabase Dashboard → SQL Editor)
```
supabase/migrations/20261003_fiados.sql   → tabela fiados + RLS
supabase/migrations/20261003_gallery.sql  → tabela gallery + RLS
```

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Variáveis de ambiente
cp .env.example .env
# Preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## Estrutura de arquivos

```
src/
├── pages/
│   ├── Booking.jsx          # Chatbot de agendamento (v3 — cliente recorrente, mybooking step)
│   ├── Confirm.jsx          # Confirmação pós-agendamento
│   ├── Cancel.jsx           # Cancelamento via token
│   ├── Home.jsx             # Landing page pública (open/closed, FAQ, galeria, ticker, FAB)
│   ├── Login.jsx            # Login + recuperação de senha
│   ├── Admin.jsx            # Shell do painel admin
│   ├── Barbeiro.jsx         # Painel do barbeiro (Q1-Q3, S1-S3)
│   ├── Manual.jsx           # Manual do sistema (8 seções — só para autenticados)
│   └── admin/
│       ├── AgendaPanel.jsx       # Disponibilidade semanal por barbeiro (sábado 20:00)
│       ├── AnalyticsPanel.jsx    # Receita por período e por barbeiro
│       ├── BarberServicesPanel.jsx # Matriz serviços × barbeiro
│       ├── ChatAgendaPanel.jsx   # Personalidade do chatbot
│       ├── ClubePanel.jsx        # Planos de assinatura
│       ├── ConfigPanel.jsx       # Dados da barbearia, dias bloqueados
│       ├── EquipePanel.jsx       # CRUD barbeiros + intervalo por barbeiro (sábado 20:00)
│       ├── FiadoPanel.jsx        # Crédito com busca por nome
│       ├── GaleriaPanel.jsx      # Upload drag-and-drop + reordenação
│       └── ServicosPanel.jsx     # CRUD completo de serviços
├── components/
│   └── ErrorBoundary.jsx    # Captura erros de render
├── lib/
│   ├── supabase.js          # Cliente Supabase
│   ├── slots.js             # Engine de slots (almoço 12-13 hardcoded, intervalo por barbeiro)
│   └── logger.js            # Logger de erros
└── styles/
    └── global.css           # Design system dark vintage

docs/
├── decisoes/
│   └── ADR-001-status-flow.md         # Por que booking nasce como "confirmado"
└── features/
    ├── painel-barbeiro.md             # Referência completa do painel do barbeiro
    ├── slot-engine.md                 # Regras do motor de slots (almoço, sábado, intervalo)
    └── chatbot-cliente-recorrente.md  # Fluxo de detecção e exibição de agendamento futuro
```

---

## Fluxo de agendamento

```
Cliente acessa /agendar
        ↓
  [Você] → nome → telefone
        ↓
  (cliente recorrente?) → "Sim, sou eu" pula para Profissional
        ↓
  [Profissional] → escolhe barbeiro ou "1º Disponível"
        ↓
  [Serviço] → categoria → serviço → adicionais (opcional)
        ↓
  [Horário] → data → slot de horário
        ↓
  [OK] → confirmação → salva no banco → localStorage
        ↓
  Tela de confirmação com link de cancelamento + WA para barbeiro
```

---

## Licença

Produto proprietário — Fluency Works. Todos os direitos reservados.
