# Chatbot — Fluxo de Cliente Recorrente

## O problema que isso resolve

Clientes que já agendaram antes precisavam redigitar nome e telefone a cada visita. Além disso, não havia nenhuma forma de o cliente ver ou cancelar um agendamento futuro sem sair do chatbot.

## Como funciona

### 1. Detecção de cliente recorrente (localStorage)

Ao confirmar um agendamento, o chatbot salva em `localStorage`:
```js
localStorage.setItem('mk_client', JSON.stringify({ name, phone }))
```

Na próxima visita, esses dados pré-preenchem o formulário de confirmação — o cliente não precisa redigitar.

### 2. Busca de agendamento futuro (Supabase)

No `useEffect` de carregamento do `Booking.jsx`, após carregar barbeiros e serviços:

```js
const saved = JSON.parse(localStorage.getItem('mk_client') || 'null')
if (saved?.phone) {
  const { data: bkData } = await supabase
    .from('bookings')
    .select('*')
    .eq('client_phone', saved.phone)
    .gte('date', today)
    .eq('status', 'confirmado')
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .limit(1)
  if (bkData?.length) setUpcomingBooking(bkData[0])
}
```

Busca apenas o próximo agendamento futuro confirmado. Ignorado se não houver telefone salvo.

### 3. Step `'mybooking'`

Se `upcomingBooking` existe quando o cliente inicia o chat, o fluxo bifurca **antes** da saudação normal:

```
startChat()
  ↓ upcomingBooking existe?
  ├─ SIM → mostra o agendamento + 2 botões → step 'mybooking'
  └─ NÃO → startNormalFlow() (fluxo padrão)
```

O bot exibe:
```
"Olá [nome]! Você já tem um agendamento confirmado:
 📅 Seg, 06 Out às 09:00
 ✂️ Gabriel
 💈 Corte + Barba"
```

Os dois botões:
- **"Agendar novo horário ✂️"** → limpa `upcomingBooking` e chama `startNormalFlow()`
- **"Cancelar este agendamento"** → navega para `/cancelar/{cancel_token}`

### 4. Back bloqueado no step `'mybooking'`

```js
const NO_BACK = new Set(['confirmado', 'mybooking'])
```

O botão "← Voltar" fica oculto nesse step para evitar estado incoerente.

## Edge cases

- **Agendamento cancelado:** a query filtra `status = 'confirmado'` — agendamentos cancelados não aparecem
- **Múltiplos agendamentos futuros:** exibe apenas o mais próximo (`.limit(1)`)
- **Telefone não salvo:** sem `saved.phone`, a query não roda — fluxo normal desde o início
- **Telefone de outra pessoa no mesmo dispositivo:** pode mostrar agendamento de outro cliente. Aceito como trade-off — não há autenticação no chatbot público

## Por que não usar Supabase Realtime aqui

O chatbot é público (sem login). Realtime exigiria subscription autenticada ou policy muito aberta. A query pontual no load é suficiente — o cliente abre o chatbot, vê o status na hora.
