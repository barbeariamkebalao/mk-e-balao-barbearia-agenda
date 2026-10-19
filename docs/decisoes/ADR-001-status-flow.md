# ADR-001 — Booking nasce como `confirmado`

**Data:** 2026-10-05  
**Status:** Aceito

## Contexto

O campo `status` em `bookings` tem 4 valores: `pendente`, `confirmado`, `concluido`, `cancelado`.

No design original, bookings eram criados como `pendente` e o barbeiro precisava clicar "Confirmar" manualmente para que o cliente soubesse que o horário estava garantido.

## Decisão

Bookings são inseridos com `status: 'confirmado'` diretamente pelo chatbot, sem etapa de aprovação manual do barbeiro.

O fluxo de status passa a ser:

```
confirmado (nasce aqui)
    ↓ barbeiro atende
concluido
    ↓ ou a qualquer momento
cancelado
```

O valor `pendente` permanece no schema e no RLS para compatibilidade, mas não é mais usado em inserções novas.

## Razão

A promessa do produto é "cliente agenda às 23h e está resolvido". Exigir que o barbeiro confirme manualmente:

1. Quebra essa promessa — o cliente fica em estado de incerteza após agendar
2. Cria trabalho operacional diário sem valor agregado para a barbearia
3. O barbeiro já tem visibilidade do agendamento em tempo real via Realtime toast

A barbearia controla a disponibilidade via `availability` (dias/horários abertos) e `blocked_dates` (folgas). Se não há slot disponível, o cliente não consegue agendar — a "confirmação" manual era redundante.

## Consequências

- Botão "Confirmar" removido do painel do barbeiro
- O barbeiro tem duas ações por agendamento: **Concluir** (após atender) e **Cancelar** (emergência)
- Registros antigos com `status: 'pendente'` continuam visíveis e funcionais no painel
- Admin mantém ciclo completo de status para casos de suporte
