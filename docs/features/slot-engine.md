# Engine de Slots (`src/lib/slots.js`)

Motor central de cálculo de horários disponíveis. Roda no client — sem round-trip ao servidor.

## Por que client-side

O banco não tem como calcular slots em tempo real sem uma Edge Function. Como a lógica é determinística (disponibilidade + agendamentos existentes → slots livres), calcular no client é suficiente e evita latência extra.

## Regras fixas (hardcoded, não configuráveis)

### Almoço 12:00–13:00
```js
const LUNCH_FROM = 12 * 60  // 720 minutos
const LUNCH_TO   = 13 * 60  // 780 minutos
```
Injetado como pseudo-booking no array `occupied` **antes** de iterar os slots. Garante que nenhum slot que sobreponha esse intervalo apareça — inclusive serviços longos que começariam antes das 12:00 e terminariam dentro do almoço.

**Por que hardcoded:** O almoço é uma regra de operação da barbearia, não uma preferência por barbeiro. Manter no código evita que seja removido acidentalmente via admin.

### Horário padrão ao cadastrar novo barbeiro
- Seg–Sex: 09:00–19:00
- Sábado (day_of_week = 6): 09:00–**20:00**
- Domingo: inativo

Definido em `EquipePanel.jsx` ao criar a disponibilidade inicial:
```js
end_time: day === 6 ? '20:00' : '19:00'
```

O mesmo padrão é aplicado no `AgendaPanel.jsx` como fallback de exibição quando um slot ainda não tem registro no banco.

## Intervalo por barbeiro (`interval_minutes`)

Cada barbeiro define seu próprio passo entre slots (30, 40, 50 ou 60 min), configurado em Admin → Equipe. O engine usa `barber.interval_minutes` — não existe intervalo global.

```
Exemplo com 50 min, serviço de 40 min:
09:00 → 09:50 → 10:40 → 11:30 → (12:00–13:00 bloqueado) → 13:10 → 14:00 ...
```

O slot das 13:00 não aparece porque 13:00 + 40 min = 13:40, mas o cursor vai de 11:30 + 50 = 12:20, que cai dentro do almoço. O próximo cursor: 12:20 + 50 = 13:10, que começa após 13:00 → disponível.

**Armadilha:** com intervalo de 30 min, o primeiro slot após o almoço é 13:00 (se a duração do serviço for ≤ 60 min). Com 50 min, o ritmo pode não "cair em ponto" às 13:00 — o primeiro slot pós-almoço varia conforme o intervalo e a hora de início do barbeiro.

## Bloqueio de horários passados (hoje)

```js
const nowMinutes = date === todayStr
  ? brHour * 60 + parseInt(brMin, 10) + 30   // +30 min de antecedência mínima
  : 0
```

Slots que terminariam no passado (ou dentro dos próximos 30 minutos) são filtrados. O offset de 30 min evita que o cliente agende um horário que já está prestes a começar.

## Duração usada no cálculo

`serviceMinutes` = soma das durações de todos os serviços selecionados (principal + adicionais). Um slot só aparece se `cursor + serviceMinutes <= end` **e** não sobrepõe nenhum bloqueio.

## O que o engine NÃO faz

- Não valida conflitos no servidor — assume que o banco tem os agendamentos corretos
- Não considera atrasos ou tempo de limpeza entre clientes
- Não bloqueia o sábado à noite automaticamente — depende de `availability.end_time` estar correto (20:00)
