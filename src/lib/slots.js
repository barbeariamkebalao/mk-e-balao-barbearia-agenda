// Engine de cálculo de slots disponíveis

const DAY_NAMES = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

// Converte "HH:MM" → minutos desde meia-noite
export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Converte minutos → "HH:MM"
export function minutesToTime(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// Formata data Date → "YYYY-MM-DD"
export function formatDate(d) {
  return d.toISOString().split('T')[0]
}

// Formata data para exibição: "Seg, 15 Out"
export function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = DAY_NAMES[d.getDay()].slice(0, 3)
  return `${day}, ${d.getDate()} ${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`
}

// Retorna os próximos N dias úteis (sem domingo) a partir de amanhã
export function getNextDays(n = 7) {
  const days = []
  const today = new Date()
  let cursor = new Date(today)
  cursor.setDate(cursor.getDate() + 1)

  while (days.length < n) {
    if (cursor.getDay() !== 0) { // pula domingo
      days.push(formatDate(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

/**
 * Calcula slots disponíveis para um barbeiro em uma data.
 *
 * @param {object} barber        - { interval_minutes }
 * @param {object} avail         - { start_time: "09:00", end_time: "20:00" } ou null
 * @param {Array}  bookings      - [{ time: "10:00", total_minutes: 50, status }]
 * @param {number} serviceMinutes - duração total dos serviços escolhidos
 * @param {string} date          - "YYYY-MM-DD"
 * @returns {string[]} slots disponíveis ["09:00", "09:40", ...]
 */
export function calcSlots(barber, avail, bookings, serviceMinutes, date) {
  if (!avail || !avail.active) return []

  const interval = barber.interval_minutes
  const start    = timeToMinutes(avail.start_time.slice(0, 5))
  const end      = timeToMinutes(avail.end_time.slice(0, 5))

  // Monta intervalos ocupados (ignora cancelados)
  const occupied = bookings
    .filter(b => b.status !== 'cancelado')
    .map(b => ({
      from: timeToMinutes(b.time.slice(0, 5)),
      to:   timeToMinutes(b.time.slice(0, 5)) + b.total_minutes,
    }))

  // Bloqueia slots passados se for hoje
  const now = new Date()
  const todayStr = formatDate(now)
  const nowMinutes = date === todayStr
    ? now.getHours() * 60 + now.getMinutes() + 30 // 30 min de antecedência
    : 0

  const slots = []
  let cursor = start

  while (cursor + serviceMinutes <= end) {
    const slotEnd = cursor + serviceMinutes
    const blocked = occupied.some(o => cursor < o.to && slotEnd > o.from)
    const past    = cursor < nowMinutes

    if (!blocked && !past) {
      slots.push(minutesToTime(cursor))
    }
    cursor += interval
  }

  return slots
}
