import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calcSlots, getNextDays, formatDateLabel } from '../lib/slots'
import { ChatBubble, TypingIndicator, ChatActions, ChatInput, ChatScroller } from '../components/Chat'

const DELAY = { short: 400, mid: 700, long: 1000 }

const STEPS = ['welcome','barber','name','phone','category','service','addons','date','time','confirm','success']

export default function Booking() {
  const navigate = useNavigate()
  const [step, setStep]         = useState('welcome')
  const [messages, setMessages] = useState([])
  const [typing, setTyping]     = useState(false)
  const [input, setInput]       = useState('')

  // Data do agendamento sendo montado
  const [barbers, setBarbers]   = useState([])
  const [services, setServices] = useState([])
  const [draft, setDraft]       = useState({
    barber: null,
    name: '',
    phone: '',
    category: null,
    service: null,
    addons: [],
    date: null,
    time: null,
  })
  const [availSlots, setAvailSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Categorias únicas dos serviços
  const categories = [...new Set(services.map(s => s.category))].filter(c => c !== 'Adicional')
  const mainServices = services.filter(s => s.category === draft.category && s.category !== 'Adicional')
  const addonServices = services.filter(s => s.category === 'Adicional')

  function addMsg(from, text, delay = DELAY.mid) {
    return new Promise(resolve => {
      setTimeout(() => {
        setMessages(prev => [...prev, { from, text, id: Date.now() + Math.random() }])
        resolve()
      }, delay)
    })
  }

  async function botSay(text, delay = DELAY.mid) {
    setTyping(true)
    await new Promise(r => setTimeout(r, delay))
    setTyping(false)
    setMessages(prev => [...prev, { from: 'bot', text, id: Date.now() + Math.random() }])
  }

  function userSay(text) {
    setMessages(prev => [...prev, { from: 'user', text, id: Date.now() + Math.random() }])
  }

  // Carrega barbeiros e serviços do Supabase
  useEffect(() => {
    async function load() {
      if (!supabase) return
      const [{ data: b }, { data: s }] = await Promise.all([
        supabase.from('barbers').select('*').eq('active', true).neq('role', 'admin').order('sort_order'),
        supabase.from('services').select('*').eq('active', true).order('sort_order'),
      ])
      setBarbers(b || [])
      setServices(s || [])
    }
    load()
  }, [])

  // Inicia o chat após carregar dados
  useEffect(() => {
    if (barbers.length === 0 && services.length === 0) return
    if (messages.length > 0) return
    startChat()
  }, [barbers, services])

  async function startChat() {
    await botSay('Oi! Seja bem-vindo à MK e BALÃO Barbearia ✂️', DELAY.short)
    await botSay('Vou te ajudar a agendar seu horário. Com qual barbeiro você quer?', DELAY.mid)
    setStep('barber')
  }

  async function chooseBarber(barber) {
    userSay(barber.name)
    setDraft(d => ({ ...d, barber }))
    await botSay(`Ótimo! ${barber.name.split(' ')[0]} é excelente! 💈`)
    await botSay('Qual é o seu nome?', DELAY.short)
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
    await botSay('Qual serviço?')
    setStep('service')
  }

  async function chooseService(svc) {
    userSay(svc.name)
    setDraft(d => ({ ...d, service: svc }))
    if (addonServices.length > 0) {
      await botSay('Quer adicionar algum serviço extra? (pode escolher mais de um)')
      setStep('addons')
    } else {
      await goToDate({ ...draft, service: svc })
    }
  }

  async function toggleAddon(svc) {
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
    await botSay('Verificando horários disponíveis...', DELAY.short)

    // Busca availability e bookings para este barbeiro nesta data
    const barberId = draft.barber?.id
    const totalMinutes = (draft.service?.duration_minutes || 0)
      + draft.addons.reduce((s, a) => s + a.duration_minutes, 0)

    const [{ data: avail }, { data: bookings }] = await Promise.all([
      supabase.from('availability')
        .select('*')
        .eq('barber_id', barberId)
        .eq('day_of_week', new Date(date + 'T12:00:00').getDay())
        .single(),
      supabase.from('bookings')
        .select('time, total_minutes, status')
        .eq('barber_id', barberId)
        .eq('date', date)
        .neq('status', 'cancelado'),
    ])

    const slots = calcSlots(draft.barber, avail, bookings || [], totalMinutes, date)
    setAvailSlots(slots)
    setLoadingSlots(false)

    if (slots.length === 0) {
      await botSay('Não há horários disponíveis neste dia. Escolha outra data:')
      setStep('date')
    } else {
      await botSay('Escolha o horário:', DELAY.short)
      setStep('time')
    }
  }

  async function chooseTime(time) {
    userSay(time)
    setDraft(d => ({ ...d, time }))
    const d = draft
    const total = (d.service?.price || 0) + d.addons.reduce((s, a) => s + a.price, 0)
    const totalMin = (d.service?.duration_minutes || 0) + d.addons.reduce((s, a) => s + a.duration_minutes, 0)
    await botSay(
      `Ótimo! Confirmando:\n\n` +
      `✂️ Barbeiro: ${d.barber?.name}\n` +
      `👤 Nome: ${d.name}\n` +
      `📱 WhatsApp: ${d.phone}\n` +
      `💈 Serviço: ${d.service?.name}${d.addons.length ? ' + ' + d.addons.map(a => a.name).join(', ') : ''}\n` +
      `📅 Data: ${formatDateLabel(d.date)} às ${time}\n` +
      `💰 Total: R$ ${total.toFixed(2).replace('.', ',')}`
    )
    setStep('confirm')
  }

  async function confirmBooking() {
    if (!supabase) return
    const d = draft
    const total = (d.service?.price || 0) + d.addons.reduce((s, a) => s + a.price, 0)
    const totalMin = (d.service?.duration_minutes || 0) + d.addons.reduce((s, a) => s + a.duration_minutes, 0)

    const payload = {
      client_name:   d.name,
      client_phone:  d.phone,
      barber_id:     d.barber.id,
      services:      [d.service, ...d.addons],
      date:          d.date,
      time:          d.time,
      total_minutes: totalMin,
      total,
      status:        'pendente',
    }

    userSay('Confirmar agendamento')
    await botSay('Registrando...', DELAY.short)

    const { data, error } = await supabase.from('bookings').insert(payload).select().single()

    if (error) {
      if (error.code === '23505') {
        await botSay('Ops! Esse horário acabou de ser ocupado. Escolha outro:')
        setStep('time')
        // Recarrega slots
        await chooseDate(d.date)
      } else {
        await botSay('Algo deu errado. Tente novamente.')
      }
      return
    }

    navigate('/confirmado', { state: { booking: data, barber: d.barber } })
  }

  const days = getNextDays(7)

  return (
    <div className="booking-page">
      <header className="booking-header">
        <div className="booking-header__brand">MK e BALÃO</div>
        <div className="booking-header__sub">Agendamento Online</div>
      </header>

      <ChatScroller>
        {messages.map(m => (
          <ChatBubble key={m.id} from={m.from}>
            {m.text.split('\n').map((line, i) => (
              <span key={i}>{line}{i < m.text.split('\n').length - 1 && <br />}</span>
            ))}
          </ChatBubble>
        ))}
        {typing && <TypingIndicator />}

        {/* ── Ações por step ── */}
        {!typing && step === 'barber' && barbers.length > 0 && (
          <ChatActions actions={barbers.map(b => ({
            label: b.name,
            onClick: () => chooseBarber(b),
          }))} />
        )}

        {!typing && step === 'name' && (
          <ChatInput value={input} onChange={setInput} onSubmit={submitName} placeholder="Seu nome completo" />
        )}

        {!typing && step === 'phone' && (
          <ChatInput value={input} onChange={setInput} onSubmit={submitPhone} placeholder="(14) 99999-9999" type="tel" />
        )}

        {!typing && step === 'category' && (
          <ChatActions actions={categories.map(c => ({ label: c, onClick: () => chooseCategory(c) }))} />
        )}

        {!typing && step === 'service' && (
          <ChatActions actions={mainServices.map(s => ({
            label: `${s.name} — R$ ${Number(s.price).toFixed(2).replace('.', ',')}`,
            onClick: () => chooseService(s),
          }))} />
        )}

        {!typing && step === 'addons' && (
          <>
            <ChatActions actions={addonServices.map(s => ({
              label: `${draft.addons.find(a => a.id === s.id) ? '✓ ' : ''}${s.name} +R$ ${Number(s.price).toFixed(2).replace('.', ',')}`,
              onClick: () => toggleAddon(s),
            }))} />
            <ChatActions actions={[{ label: 'Continuar →', variant: 'primary', onClick: confirmAddons }]} />
          </>
        )}

        {!typing && step === 'date' && (
          <ChatActions actions={days.map(d => ({
            label: formatDateLabel(d),
            onClick: () => chooseDate(d),
          }))} />
        )}

        {!typing && step === 'time' && !loadingSlots && (
          availSlots.length > 0
            ? <ChatActions actions={availSlots.map(t => ({ label: t, onClick: () => chooseTime(t) }))} />
            : null
        )}

        {!typing && step === 'confirm' && (
          <ChatActions actions={[
            { label: 'Confirmar ✓', variant: 'primary', onClick: confirmBooking },
            { label: 'Corrigir', onClick: () => setStep('barber') },
          ]} />
        )}
      </ChatScroller>

      <footer className="booking-footer">
        <a href="/login" className="booking-footer__link">Área do barbeiro</a>
      </footer>
    </div>
  )
}
