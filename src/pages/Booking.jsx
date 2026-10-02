import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calcSlots, getNextDays, formatDateLabel } from '../lib/slots'

const DELAY = { short: 400, mid: 700, long: 1000 }

// Progress steps: which booking steps map to each progress node
const PROGRESS_NODES = [
  { label: 'Serviço',      steps: ['welcome','barber','name','phone','category','service','addons'] },
  { label: 'Profissional', steps: [] },
  { label: 'Horário',      steps: ['date','time'] },
  { label: 'OK',           steps: ['confirm','success'] },
]

function getProgressState(step) {
  // 0=service/barber, 1=professional (barber selected), 2=date/time, 3=confirm
  if (['welcome','barber','name','phone'].includes(step)) return 0
  if (['category','service','addons'].includes(step)) return 1
  if (['date','time'].includes(step)) return 2
  if (['confirm','success'].includes(step)) return 3
  return 0
}

export default function Booking({ preselectedSlug = null }) {
  const navigate = useNavigate()
  const chatRef = useRef(null)

  const [step, setStep]         = useState('welcome')
  const [messages, setMessages] = useState([])
  const [typing, setTyping]     = useState(false)
  const [input, setInput]       = useState('')

  const [barbers, setBarbers]   = useState([])
  const [services, setServices] = useState([])
  const [draft, setDraft]       = useState({
    barber: null, name: '', phone: '',
    category: null, service: null, addons: [],
    date: null, time: null,
  })
  const [availSlots, setAvailSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const categories   = [...new Set(services.map(s => s.category))].filter(c => c !== 'Adicional')
  const mainServices = services.filter(s => s.category === draft.category && s.category !== 'Adicional')
  const addonServices = services.filter(s => s.category === 'Adicional')

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, typing])

  async function botSay(text, delay = DELAY.mid) {
    setTyping(true)
    await new Promise(r => setTimeout(r, delay))
    setTyping(false)
    setMessages(prev => [...prev, { from: 'bot', text, id: Date.now() + Math.random() }])
  }

  function userSay(text) {
    setMessages(prev => [...prev, { from: 'user', text, id: Date.now() + Math.random() }])
  }

  useEffect(() => {
    async function load() {
      if (!supabase) return
      let bQuery = supabase.from('barbers').select('*').eq('active', true).neq('role', 'admin').order('sort_order')
      if (preselectedSlug) bQuery = bQuery.eq('slug', preselectedSlug)
      const [{ data: b }, { data: s }] = await Promise.all([
        bQuery,
        supabase.from('services').select('*').eq('active', true).order('sort_order'),
      ])
      setBarbers(b || [])
      setServices(s || [])
    }
    load()
  }, [])

  useEffect(() => {
    if (barbers.length === 0 && services.length === 0) return
    if (messages.length > 0) return
    startChat()
  }, [barbers, services])

  async function startChat() {
    if (preselectedSlug && barbers.length === 1) {
      const b = barbers[0]
      setDraft(d => ({ ...d, barber: b }))
      await botSay(`Oi! Seja bem-vindo ao agendamento com ${b.name.split(' ')[0]} ✂️`, DELAY.short)
      await botSay('Qual é o seu nome completo?', DELAY.mid)
      setStep('name')
    } else {
      await botSay('Oi! Seja bem-vindo à MK e BALÃO ✂️', DELAY.short)
      await botSay('Vou te ajudar a agendar. Com qual barbeiro você quer?', DELAY.mid)
      setStep('barber')
    }
  }

  async function chooseBarber(barber) {
    userSay(barber.name)
    setDraft(d => ({ ...d, barber }))
    await botSay(`Ótimo! ${barber.name.split(' ')[0]} é excelente! 💈`)
    await botSay('Qual é o seu nome completo?', DELAY.short)
    setStep('name')
    setInput('')
  }

  async function submitName(e) {
    e?.preventDefault()
    if (!input.trim()) return
    const name = input.trim()
    userSay(name)
    setDraft(d => ({ ...d, name }))
    setInput('')
    await botSay(`Prazer, ${name.split(' ')[0]}! 👋`)
    await botSay('Me passa o seu WhatsApp com DDD:', DELAY.short)
    setStep('phone')
  }

  async function submitPhone(e) {
    e?.preventDefault()
    const phone = input.trim().replace(/\D/g, '')
    if (phone.length < 10) return
    userSay(input.trim())
    setDraft(d => ({ ...d, phone }))
    setInput('')
    await botSay('Perfeito! O que você quer fazer hoje?')
    setStep('category')
  }

  async function chooseCategory(cat) {
    userSay(cat)
    setDraft(d => ({ ...d, category: cat, service: null, addons: [] }))
    await botSay('Qual serviço você quer?')
    setStep('service')
  }

  async function chooseService(svc) {
    userSay(svc.name)
    setDraft(d => ({ ...d, service: svc }))
    if (addonServices.length > 0) {
      await botSay('Quer adicionar algum extra? (pode escolher mais de um)')
      setStep('addons')
    } else {
      await goToDate({ ...draft, service: svc })
    }
  }

  function toggleAddon(svc) {
    setDraft(d => {
      const has = d.addons.find(a => a.id === svc.id)
      return { ...d, addons: has ? d.addons.filter(a => a.id !== svc.id) : [...d.addons, svc] }
    })
  }

  async function confirmAddons() {
    const labels = draft.addons.map(a => a.name).join(', ')
    userSay(draft.addons.length > 0 ? labels : 'Sem adicionais')
    await goToDate(draft)
  }

  async function goToDate(currentDraft) {
    await botSay('Qual data você prefere?')
    setDraft(d => ({ ...d, ...currentDraft }))
    setStep('date')
  }

  async function chooseDate(date) {
    userSay(formatDateLabel(date))
    setDraft(d => ({ ...d, date, time: null }))
    setLoadingSlots(true)
    await botSay('Verificando horários...', DELAY.short)

    const barberId = draft.barber?.id
    const totalMinutes = (draft.service?.duration_minutes || 0)
      + draft.addons.reduce((s, a) => s + a.duration_minutes, 0)

    const [{ data: avail }, { data: bookings }] = await Promise.all([
      supabase.from('availability')
        .select('*').eq('barber_id', barberId)
        .eq('day_of_week', new Date(date + 'T12:00:00').getDay()).single(),
      supabase.from('bookings')
        .select('time, total_minutes, status').eq('barber_id', barberId)
        .eq('date', date).neq('status', 'cancelado'),
    ])

    const slots = calcSlots(draft.barber, avail, bookings || [], totalMinutes, date)
    setAvailSlots(slots)
    setLoadingSlots(false)

    if (slots.length === 0) {
      await botSay('Sem horários disponíveis neste dia. Escolha outra data:')
      setStep('date')
    } else {
      await botSay('Escolha o horário:', DELAY.short)
      setStep('time')
    }
  }

  async function chooseTime(time) {
    userSay(time)
    setDraft(d => ({ ...d, time }))
    const d = { ...draft, time }
    const total = (d.service?.price || 0) + d.addons.reduce((s, a) => s + a.price, 0)
    await botSay(
      `Confirmando:\n\n` +
      `✂️ ${d.barber?.name}\n` +
      `👤 ${d.name} · ${d.phone}\n` +
      `💈 ${d.service?.name}${d.addons.length ? ' + ' + d.addons.map(a => a.name).join(', ') : ''}\n` +
      `📅 ${formatDateLabel(d.date)} às ${time}\n` +
      `💰 R$ ${total.toFixed(2).replace('.', ',')}`
    )
    setStep('confirm')
  }

  async function confirmBooking() {
    if (!supabase) return
    const d = draft
    const total = (d.service?.price || 0) + d.addons.reduce((s, a) => s + a.price, 0)
    const totalMin = (d.service?.duration_minutes || 0) + d.addons.reduce((s, a) => s + a.duration_minutes, 0)

    userSay('Confirmar agendamento')
    await botSay('Registrando...', DELAY.short)

    const { data, error } = await supabase.from('bookings').insert({
      client_name: d.name, client_phone: d.phone,
      barber_id: d.barber.id, services: [d.service, ...d.addons],
      date: d.date, time: d.time,
      total_minutes: totalMin, total, status: 'pendente',
    }).select().single()

    if (error) {
      if (error.code === '23505') {
        await botSay('Esse horário acabou de ser ocupado. Escolha outro:')
        setStep('time')
        await chooseDate(d.date)
      } else {
        await botSay('Algo deu errado. Tente novamente.')
      }
      return
    }

    navigate('/confirmado', { state: { booking: data, barber: d.barber } })
  }

  const days = getNextDays(7)
  const progressIdx = getProgressState(step)

  // Avatar image map (uses public/ folder)
  const AVATAR_MAP = {
    maikon:  '/barbeiro-maikon.png',
    gabriel: '/barbeiro-gabriel.png',
    daniel:  '/barbeiro-daniel.png',
  }

  return (
    <div className="booking-page">
      {/* ── Header ── */}
      <header className="booking-header">
        <div className="booking-header__inner">
          <img
            className="booking-header__logo"
            src="/logo-semfundo.png"
            alt="MK e BALÃO"
          />
          {draft.barber ? (
            <div className="booking-header__info">
              <div className="booking-header__barber">{draft.barber.name.split(' ')[0]}</div>
              <div className="booking-header__role">Barbeiro</div>
            </div>
          ) : (
            <div className="booking-header__info">
              <div className="booking-header__barber">MK e BALÃO</div>
              <div className="booking-header__role">Assistente Virtual</div>
            </div>
          )}
        </div>
        <div className="barber-pole-bg" style={{ height: '4px' }} />
      </header>

      {/* ── Step Progress ── */}
      <div className="step-progress">
        <div className="step-progress__inner">
          {['Serviço', 'Profissional', 'Horário', 'OK'].map((label, i) => {
            const state = i < progressIdx ? 'done' : i === progressIdx ? 'active' : 'idle'
            return (
              <div key={label} className="step-item" style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
                <div className={`step-node${state === 'active' ? ' step-node--active' : state === 'done' ? ' step-node--done' : ''}`}>
                  {state === 'done' ? '✓' : i + 1}
                </div>
                <span className={`step-label${state === 'active' ? ' step-label--active' : ''}`} style={{ marginLeft: '0.375rem' }}>{label}</span>
                {i < 3 && <div className="step-divider" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div className="chat-window" ref={chatRef}>
        {messages.map(m => (
          <div key={m.id} className={`chat-bubble chat-bubble--${m.from}`}>
            {m.from === 'bot' && <div className="chat-bubble__avatar">✂</div>}
            <div className="chat-bubble__text">
              {m.text.split('\n').map((line, i) => (
                <span key={i}>{line}{i < m.text.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
            {m.from === 'user' && <div className="chat-bubble__avatar">👤</div>}
          </div>
        ))}
        {typing && (
          <div className="typing-indicator">
            <div className="typing-avatar">✂</div>
            <div className="typing-dots">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* ── Action Bar ── */}
      {!typing && (
        <div className="action-bar">
          {/* Barber selection — 2-column grid with photos */}
          {step === 'barber' && barbers.length > 0 && (
            <div className="barber-grid">
              {barbers.map(b => (
                <div key={b.id} className="barber-card" onClick={() => chooseBarber(b)}>
                  <div className="barber-card__avatar">
                    {(b.avatar_url || AVATAR_MAP[b.slug]) ? (
                      <img src={b.avatar_url || AVATAR_MAP[b.slug]} alt={b.name} />
                    ) : (
                      <span className="barber-card__avatar--placeholder">✂</span>
                    )}
                  </div>
                  <div className="barber-card__name">{b.name.split(' ')[0]}</div>
                  <div className="barber-card__role">{b.interval_minutes}min/atend.</div>
                </div>
              ))}
            </div>
          )}

          {/* Text inputs */}
          {step === 'name' && (
            <form className="chat-input-wrap" onSubmit={submitName}>
              <input
                className="mk-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Seu nome completo"
                autoFocus
              />
              <button type="submit" className="chat-send">→</button>
            </form>
          )}

          {step === 'phone' && (
            <form className="chat-input-wrap" onSubmit={submitPhone}>
              <input
                className="mk-input"
                type="tel"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="(14) 99999-9999"
                autoFocus
              />
              <button type="submit" className="chat-send">→</button>
            </form>
          )}

          {/* Category */}
          {step === 'category' && (
            <div className="action-list">
              {categories.map(c => (
                <button key={c} className="chat-action-btn" onClick={() => chooseCategory(c)}>{c}</button>
              ))}
            </div>
          )}

          {/* Service */}
          {step === 'service' && (
            <div className="action-list">
              {mainServices.map(s => (
                <button key={s.id} className="chat-action-btn" onClick={() => chooseService(s)}>
                  {s.name} — R$ {Number(s.price).toFixed(2).replace('.', ',')}
                </button>
              ))}
            </div>
          )}

          {/* Addons */}
          {step === 'addons' && (
            <>
              <div className="addon-grid">
                {addonServices.map(s => {
                  const selected = !!draft.addons.find(a => a.id === s.id)
                  return (
                    <div
                      key={s.id}
                      className={`addon-item${selected ? ' selected' : ''}`}
                      onClick={() => toggleAddon(s)}
                    >
                      <div>
                        <div className="addon-item__name">{s.name}</div>
                        <div className="addon-item__price">+R$ {Number(s.price).toFixed(2).replace('.', ',')}</div>
                      </div>
                      <div className="addon-item__check">{selected ? '✓' : ''}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <button className="chat-action-btn primary" onClick={confirmAddons}>Continuar →</button>
              </div>
            </>
          )}

          {/* Date chips — horizontal scroll */}
          {step === 'date' && (
            <div className="date-scroll">
              {days.map(d => {
                const dt = new Date(d + 'T12:00:00')
                const day = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()
                const num = dt.getDate()
                const month = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
                return (
                  <div
                    key={d}
                    className={`date-chip${draft.date === d ? ' active' : ''}`}
                    onClick={() => chooseDate(d)}
                  >
                    <div className="date-chip__day">{day}</div>
                    <div className="date-chip__num">{num}</div>
                    <div className="date-chip__month">{month}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Time slots — 4-column grid */}
          {step === 'time' && !loadingSlots && availSlots.length > 0 && (
            <div className="time-grid">
              {availSlots.map(t => (
                <div
                  key={t}
                  className={`time-slot${draft.time === t ? ' active' : ''}`}
                  onClick={() => chooseTime(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          )}

          {/* Confirm */}
          {step === 'confirm' && (
            <div className="action-list">
              <button className="chat-action-btn primary" onClick={confirmBooking}>Confirmar ✓</button>
              <button className="chat-action-btn" onClick={() => setStep(preselectedSlug ? 'name' : 'barber')}>Corrigir</button>
            </div>
          )}
        </div>
      )}

      <footer className="booking-footer">
        <a href="/login">Área do barbeiro</a>
      </footer>
    </div>
  )
}
