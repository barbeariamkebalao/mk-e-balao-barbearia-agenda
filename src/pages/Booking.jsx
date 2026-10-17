import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calcSlots, getNextDays, formatDate, formatDateLabel } from '../lib/slots'

const DELAY = { short: 220, mid: 380, long: 520 }

const BOT_MESSAGES = {
  classico: {
    welcome:          'Oi! Seja bem-vindo à MK e BALÃO ✂️',
    welcomeBarber:    (name) => `Oi! Seja bem-vindo ao agendamento com ${name} ✂️`,
    returningGreet:   (name) => `Olá de novo, ${name}! 👋`,
    returningConfirm: 'É você mesmo?',
    returningYes:     (name) => `Ótimo, ${name}! Vamos lá! 💈`,
    returningNo:      'Tudo bem! Como você se chama?',
    askName:          'Qual é o seu nome completo?',
    greetName:        (name) => `Prazer, ${name}! 👋`,
    askPhone:         'Me passa o seu WhatsApp com DDD:',
    askBarber:        'Com qual barbeiro você quer?',
    barberChosen:     (name) => `Ótimo! ${name} é excelente! 💈`,
    primeiroDisp:     'Ótimo! Vou encontrar o primeiro horário disponível. 💈',
    askCategory:      'Perfeito! O que você quer fazer hoje?',
    askService:       'Qual serviço você quer?',
    askAddonsSolo:    'Claro! Qual adicional você quer? (pode escolher mais de um)',
    askAddons:        'Quer adicionar algum extra? (pode escolher mais de um)',
    askDate:          'Qual data você prefere?',
    checking:         'Verificando disponibilidade...',
    checkingSlots:    'Verificando horários...',
    noSlots:          'Sem horários disponíveis neste dia. Escolha outra data:',
    noBarber:         'Nenhum barbeiro disponível neste dia. Escolha outra data:',
    foundBarber:      (name) => `Encontrei horário com ${name}! Escolha o horário:`,
    chooseTime:       'Escolha o horário:',
    registering:      'Registrando...',
    slotTaken:        'Esse horário acabou de ser ocupado. Escolha outro:',
    error:            'Algo deu errado. Tente novamente.',
    selectAddon:      'Selecione pelo menos um adicional para continuar.',
  },
  urbano: {
    welcome:          'E aí! Bem-vindo à MK e BALÃO 🔥',
    welcomeBarber:    (name) => `E aí! Agendamento direto com ${name} 🔥`,
    returningGreet:   (name) => `E aí, ${name}! 👋`,
    returningConfirm: 'Ainda é você?',
    returningYes:     (name) => `${name}! Bora! 💈`,
    returningNo:      'Valeu! Qual é o seu nome?',
    askName:          'Como você se chama?',
    greetName:        (name) => `Valeu, ${name}! 🤙`,
    askPhone:         'Manda seu WhatsApp com DDD:',
    askBarber:        'Com quem você vai? Escolhe o seu:',
    barberChosen:     (name) => `${name} no flow! 💈`,
    primeiroDisp:     'Beleza! Vou pegar o primeiro slot livre. 💈',
    askCategory:      'O que vai ser hoje?',
    askService:       'Qual serviço?',
    askAddonsSolo:    'Qual adicional? (pode marcar mais de um)',
    askAddons:        'Quer algo extra? (pode marcar mais de um)',
    askDate:          'Qual dia?',
    checking:         'Verificando...',
    checkingSlots:    'Checando horários...',
    noSlots:          'Dia cheio. Escolhe outra data:',
    noBarber:         'Nenhum barbeiro disponível. Escolhe outra data:',
    foundBarber:      (name) => `Achei horário com ${name}! Escolhe:`,
    chooseTime:       'Escolhe o horário:',
    registering:      'Confirmando...',
    slotTaken:        'Horário ocupado. Escolha outro:',
    error:            'Deu ruim. Tenta de novo.',
    selectAddon:      'Seleciona pelo menos um adicional.',
  },
  carismatico: {
    welcome:          'Oi! Que bom ter você aqui! Bem-vindo à MK e BALÃO ✂️✨',
    welcomeBarber:    (name) => `Oi! Que prazer! Agendamento com ${name} ✂️✨`,
    returningGreet:   (name) => `Que alegria te ver de novo, ${name}! 👋✨`,
    returningConfirm: 'É você mesmo?',
    returningYes:     (name) => `${name}! Que prazer! Vai ser ótimo! 💈✨`,
    returningNo:      'Sem problema! Me conta seu nome completo!',
    askName:          'Me conta seu nome completo, por favor!',
    greetName:        (name) => `Muito prazer, ${name}! Vai ser incrível te atender! 👋😊`,
    askPhone:         'Agora me passa seu WhatsApp com DDD:',
    askBarber:        'A gente tem os melhores profissionais! Com quem você quer ir?',
    barberChosen:     (name) => `Ótima escolha! ${name} vai arrasar! 💈✨`,
    primeiroDisp:     'Perfeito! Vou encontrar o melhor horário disponível pra você! 💈',
    askCategory:      'Maravilha! O que você quer fazer hoje?',
    askService:       'Qual serviço você prefere?',
    askAddonsSolo:    'Que tal um mimo especial? (pode escolher mais de um)',
    askAddons:        'Quer adicionar algo especial? (pode escolher mais de um)',
    askDate:          'Qual data funciona melhor pra você?',
    checking:         'Um segundo! Verificando disponibilidade... 🔍',
    checkingSlots:    'Um segundo! Verificando os horários... 🔍',
    noSlots:          'Poxa, esse dia tá cheio! Escolha outra data:',
    noBarber:         'Poxa, nenhum profissional disponível nesse dia! Escolha outra data:',
    foundBarber:      (name) => `Que ótimo! Encontrei horário com ${name}! Escolha o que preferir:`,
    chooseTime:       'Ótimo! Escolha o horário que preferir:',
    registering:      'Só um instante, confirmando tudo... ✨',
    slotTaken:        'Esse horário foi reservado agora mesmo. Escolha outro:',
    error:            'Ops, algo não deu certo. Pode tentar novamente?',
    selectAddon:      'Selecione pelo menos um adicional para continuar!',
  },
}

const CATEGORY_LABELS = {
  cabelo:       'Cabelo',
  barba:        'Barba',
  combo:        'Cabelo + Barba',
  colorimetria: 'Colorimetria',
}

const CATEGORY_EMOJI = {
  cabelo:       '✂️',
  barba:        '🧔',
  combo:        '💈',
  colorimetria: '🎨',
}

// Melhoria 2 — "Primeiro Disponível"
const PRIMEIRO_DISPONIVEL = {
  id: '__primeiro__', name: 'Primeiro Disponível',
  slug: '__primeiro__', interval_minutes: 40,
}

// Melhoria 3 — máscara de telefone
function applyPhoneMask(val) {
  const d = val.replace(/\D/g, '').slice(0, 11)
  if (!d.length) return ''
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function getProgressState(step) {
  if (['welcome','name','phone','returning'].includes(step)) return 0
  if (['barber'].includes(step)) return 1
  if (['category','service','addons'].includes(step)) return 2
  if (['date','time'].includes(step)) return 3
  if (['confirm','success'].includes(step)) return 4
  return 0
}

export default function Booking({ preselectedSlug = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill  = location.state?.prefill
  const chatRef      = useRef(null)
  const chatStarted  = useRef(false)

  const [step, setStep]         = useState('welcome')
  const [messages, setMessages] = useState([])
  const [typing, setTyping]     = useState(false)
  const [input, setInput]       = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [confirming, setConfirming] = useState(false)

  // Cliente salvo no localStorage — pré-preenchimento no retorno
  const [savedClient, setSavedClient] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mk_client') || 'null') } catch { return null }
  })

  const [loadError, setLoadError] = useState(false)

  const [barbers, setBarbers]   = useState([])
  const [services, setServices] = useState([])
  const [barberServicesMap, setBarberServicesMap] = useState({}) // Melhoria 1
  const [draft, setDraft]       = useState({
    barber: null, name: '', phone: '',
    category: null, service: null, addons: [],
    date: null, time: null,
  })
  const [availSlots, setAvailSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [exhaustedDates, setExhaustedDates] = useState([])
  const [allBlockedRows, setAllBlockedRows] = useState([]) // { date, barber_id }
  const [botPersonality, setBotPersonality] = useState('classico')
  const [upcomingBooking, setUpcomingBooking] = useState(null) // agendamento futuro do cliente recorrente

  const msgs = BOT_MESSAGES[botPersonality] || BOT_MESSAGES.classico

  // Melhoria 1 — filtra serviços pelo barbeiro selecionado
  const barberServiceIds = (draft.barber && draft.barber.id !== '__primeiro__')
    ? (barberServicesMap[draft.barber.id] || [])
    : null

  const visibleServices = barberServiceIds
    ? services.filter(s => barberServiceIds.includes(s.id))
    : services

  const categories    = [...new Set(visibleServices.filter(s => !s.is_addon).map(s => s.category))]
  const mainServices  = visibleServices.filter(s => s.category === draft.category && !s.is_addon)
  const addonServices = visibleServices.filter(s => s.is_addon)

  // name é sempre o primeiro passo real (ou 'returning' se há cliente salvo)
  const NO_BACK = ['welcome', 'success', 'name', 'returning', 'mybooking']

  function goBack() {
    const actions = {
      phone:    () => { setDraft(d => ({ ...d, name: '' })); setStep('name') },
      barber:   () => { setStep('phone') },
      category: () => {
        if (preselectedSlug) { setStep('phone') }
        else { setDraft(d => ({ ...d, barber: null })); setStep('barber') }
      },
      service:  () => { setDraft(d => ({ ...d, category: null })); setStep('category') },
      addons:   () => { setDraft(d => ({ ...d, service: null, addons: [] })); setStep('service') },
      date: () => {
        if (addonServices.length > 0) {
          setDraft(d => ({ ...d, addons: [], date: null, time: null }))
          setStep('addons')
        } else {
          setDraft(d => ({ ...d, service: null, date: null, time: null }))
          setStep('service')
        }
      },
      time:    () => { setDraft(d => ({ ...d, date: null, time: null })); setStep('date') },
      confirm: () => { setDraft(d => ({ ...d, time: null })); setStep('time') },
    }
    actions[step]?.()
  }

  // Auto-scroll
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
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
      let bQuery = supabase.from('barbers').select('*').eq('active', true).neq('role', 'admin').order('sort_order')
      if (preselectedSlug) bQuery = bQuery.eq('slug', preselectedSlug)
      try {
        const [{ data: b }, { data: s }, { data: bs }, { data: bd }, { data: st }] = await Promise.all([
          bQuery,
          supabase.from('services').select('*').eq('active', true).order('sort_order'),
          supabase.from('barber_services').select('barber_id, service_id'),
          // Só datas futuras — evita carregar histórico de bloqueios antigos
          supabase.from('blocked_dates').select('date, barber_id').gte('date', today),
          supabase.from('settings').select('bot_config').eq('id', 1).maybeSingle(),
        ])
        setBarbers(b || [])
        setServices(s || [])
        // Monta mapa { barber_id: [service_id, ...] }
        const map = {}
        for (const row of (bs || [])) {
          if (!map[row.barber_id]) map[row.barber_id] = []
          map[row.barber_id].push(row.service_id)
        }
        setBarberServicesMap(map)
        setAllBlockedRows(bd || [])
        if (st?.bot_config?.personality) setBotPersonality(st.bot_config.personality)

        // Busca agendamento futuro do cliente recorrente (localStorage)
        try {
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
        } catch {}
      } catch {
        setLoadError(true)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (barbers.length === 0 && services.length === 0) return
    if (messages.length > 0 || chatStarted.current) return
    chatStarted.current = true
    startChat()
  }, [barbers, services])

  // Fluxo normal de saudação — reutilizado pelo startChat e pelo "Agendar novo"
  async function startNormalFlow() {
    if (preselectedSlug && barbers.length === 1) {
      const b = barbers[0]
      setDraft(d => ({ ...d, barber: b }))
      if (savedClient) {
        await botSay(msgs.welcomeBarber(b.name.split(' ')[0]), DELAY.short)
        await botSay(msgs.returningGreet(savedClient.name.split(' ')[0]), DELAY.mid)
        await botSay(msgs.returningConfirm, DELAY.short)
        setStep('returning')
      } else {
        await botSay(msgs.welcomeBarber(b.name.split(' ')[0]), DELAY.short)
        await botSay(msgs.askName, DELAY.mid)
        setStep('name')
      }
    } else {
      await botSay(msgs.welcome, DELAY.short)
      if (savedClient) {
        await botSay(msgs.returningGreet(savedClient.name.split(' ')[0]), DELAY.mid)
        await botSay(msgs.returningConfirm, DELAY.short)
        setStep('returning')
      } else {
        await botSay(msgs.askName, DELAY.mid)
        setStep('name')
      }
    }
  }

  async function startChat() {
    // Reagendamento com prefill — fluxo antigo preservado
    if (prefill) {
      const { name, phone, barber: b } = prefill
      setDraft(d => ({ ...d, name, phone, ...(b ? { barber: b } : {}) }))
      await botSay(`Bem-vindo de volta, ${name.split(' ')[0]}! ✂️`, DELAY.short)
      await botSay('Vamos escolher um novo horário. O que você quer fazer?', DELAY.mid)
      setStep(b ? 'category' : 'barber')
      return
    }

    // Agendamento futuro do cliente recorrente — mostra antes do fluxo normal
    if (upcomingBooking) {
      const barberName = barbers.find(b => b.id === upcomingBooking.barber_id)?.name || 'seu barbeiro'
      const svcList = (upcomingBooking.services || []).map(s => s.name).join(' + ')
      await botSay(msgs.welcome, DELAY.short)
      await botSay(
        `${savedClient ? savedClient.name.split(' ')[0] + ', você' : 'Você'} já tem um agendamento confirmado:\n\n` +
        `📅 ${formatDateLabel(upcomingBooking.date)} às ${upcomingBooking.time}\n` +
        `✂️ ${barberName}\n` +
        `💈 ${svcList}`,
        DELAY.mid
      )
      setStep('mybooking')
      return
    }

    await startNormalFlow()
  }

  async function chooseReturning(isReturning) {
    if (isReturning) {
      userSay('Sim, sou eu ✓')
      setDraft(d => ({ ...d, name: savedClient.name, phone: savedClient.phone }))
      await botSay(msgs.returningYes(savedClient.name.split(' ')[0]))
      if (preselectedSlug) {
        await botSay(msgs.askCategory, DELAY.short)
        setStep('category')
      } else {
        await botSay(msgs.askBarber, DELAY.short)
        setStep('barber')
      }
    } else {
      userSay('Não, sou outra pessoa')
      setSavedClient(null)
      await botSay(msgs.returningNo)
      await botSay(msgs.askName, DELAY.short)
      setStep('name')
    }
  }

  async function chooseBarber(barber) {
    userSay(barber.name)
    const newDraft = { ...draft, barber }
    setDraft(d => ({ ...d, barber }))
    if (barber.id === '__primeiro__') {
      await botSay(msgs.primeiroDisp)
    } else {
      await botSay(msgs.barberChosen(barber.name.split(' ')[0]))
    }
    // Auto-skip category when only one is available
    const bsIds = barberServicesMap[barber.id] || null
    const vis = bsIds ? services.filter(s => bsIds.includes(s.id)) : services
    const cats = [...new Set(vis.filter(s => !s.is_addon).map(s => s.category))]
    if (cats.length === 1) {
      setDraft(d => ({ ...d, barber, category: cats[0] }))
      await botSay(msgs.askService, DELAY.short)
      setStep('service')
    } else {
      await botSay(msgs.askCategory, DELAY.short)
      setStep('category')
    }
    setInput('')
  }

  async function submitName(e) {
    e?.preventDefault()
    if (!input.trim()) return
    const name = input.trim()
    userSay(name)
    setDraft(d => ({ ...d, name }))
    setInput('')
    await botSay(msgs.greetName(name.split(' ')[0]))
    await botSay(msgs.askPhone, DELAY.short)
    setStep('phone')
  }

  async function submitPhone(e) {
    e?.preventDefault()
    const digits = input.replace(/\D/g, '')
    const valid = /^[1-9]{2}(9\d{8}|\d{8})$/.test(digits)
    if (!valid) {
      setPhoneError('Número inválido. Ex: (14) 99999-9999')
      return
    }
    setPhoneError('')
    userSay(input.trim())
    setDraft(d => ({ ...d, phone: digits }))
    setInput('')
    // Se barbeiro já foi pré-selecionado (URL /agendar/:slug), pula escolha de profissional
    if (preselectedSlug) {
      await botSay(msgs.askCategory)
      setStep('category')
    } else {
      await botSay(msgs.askBarber)
      setStep('barber')
    }
  }

  async function chooseCategory(cat) {
    userSay(CATEGORY_LABELS[cat] || cat)
    setDraft(d => ({ ...d, category: cat, service: null, addons: [] }))
    await botSay(msgs.askService)
    setStep('service')
  }

  async function chooseSoloAddon() {
    userSay('✨ Só um Adicional')
    setDraft(d => ({ ...d, category: 'adicional', service: null, addons: [] }))
    await botSay(msgs.askAddonsSolo)
    setStep('addons')
  }

  async function chooseService(svc) {
    userSay(svc.name)
    setDraft(d => ({ ...d, service: svc }))
    if (addonServices.length > 0) {
      await botSay(msgs.askAddons)
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
    if (draft.category === 'adicional' && draft.addons.length === 0) {
      await botSay(msgs.selectAddon)
      return
    }
    const labels = draft.addons.map(a => a.name).join(', ')
    userSay(draft.addons.length > 0 ? labels : 'Sem adicionais')
    await goToDate(draft)
  }

  async function goToDate(currentDraft) {
    await botSay(msgs.askDate)
    setDraft(d => ({ ...d, ...currentDraft }))
    setStep('date')
  }

  async function chooseDate(date) {
    // Melhoria 2 — branch especial para "Primeiro Disponível"
    if (draft.barber?.id === '__primeiro__') {
      userSay(formatDateLabel(date))
      setDraft(d => ({ ...d, date, time: null }))
      await botSay(msgs.checking, DELAY.short)

      const totalMinutes = (draft.service?.duration_minutes || 0)
        + draft.addons.reduce((s, a) => s + a.duration_minutes, 0)

      let foundBarber = null
      let foundSlots  = []

      const selectedServiceIds = [
        ...(draft.service ? [draft.service.id] : []),
        ...draft.addons.map(a => a.id),
      ]
      const realBarbers = barbers
        .filter(b => b.id !== '__primeiro__')
        .filter(b => selectedServiceIds.length === 0 ||
          selectedServiceIds.every(sid => (barberServicesMap[b.id] || []).includes(sid)))
        .sort(() => Math.random() - 0.5) // embaralha para distribuição justa em caso de empate
      const dow = new Date(date + 'T12:00:00').getDay()
      const results = await Promise.all(
        realBarbers.map(async b => {
          const [{ data: avail }, { data: bookings }] = await Promise.all([
            supabase.from('availability')
              .select('*').eq('barber_id', b.id).eq('day_of_week', dow).single(),
            supabase.from('bookings')
              .select('time, total_minutes, status').eq('barber_id', b.id)
              .eq('date', date).neq('status', 'cancelado'),
          ])
          return { barber: b, slots: calcSlots(b, avail, bookings || [], totalMinutes, date) }
        })
      )
      // Pega o barbeiro com o slot mais cedo naquele dia, não o primeiro da lista
      const available = results.filter(r => r.slots.length > 0)
      const found = available.length > 0
        ? available.reduce((best, curr) => (curr.slots[0] < best.slots[0] ? curr : best))
        : null
      if (found) { foundBarber = found.barber; foundSlots = found.slots }

      if (!foundBarber) {
        setExhaustedDates(prev => [...prev, date])
        await botSay(msgs.noBarber)
        setStep('date')
      } else {
        setDraft(d => ({ ...d, barber: foundBarber, date }))
        setAvailSlots(foundSlots)
        await botSay(msgs.foundBarber(foundBarber.name.split(' ')[0]))
        setStep('time')
      }
      return
    }

    userSay(formatDateLabel(date))
    setDraft(d => ({ ...d, date, time: null }))
    setLoadingSlots(true)
    await botSay(msgs.checkingSlots, DELAY.short)

    const barberId     = draft.barber?.id
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
      // Melhoria 4 — marca data como esgotada
      setExhaustedDates(prev => [...prev, date])
      await botSay(msgs.noSlots)
      setStep('date')
    } else {
      await botSay(msgs.chooseTime, DELAY.short)
      setStep('time')
    }
  }

  async function chooseTime(time) {
    userSay(time)
    setDraft(d => ({ ...d, time }))
    const d        = { ...draft, time }
    const total    = (d.service?.price || 0) + d.addons.reduce((s, a) => s + a.price, 0)
    const totalMin = (d.service?.duration_minutes || 0) + d.addons.reduce((s, a) => s + a.duration_minutes, 0)
    const priceLabel = d.service?.price_type === 'from'
      ? `a partir de R$ ${total.toFixed(2).replace('.', ',')}`
      : `R$ ${total.toFixed(2).replace('.', ',')}`
    await botSay(
      `Confirmando:\n\n` +
      `✂️ ${d.barber?.name}\n` +
      `👤 ${d.name} · ${d.phone}\n` +
      `💈 ${d.service?.name}${d.addons.length ? ' + ' + d.addons.map(a => a.name).join(', ') : ''}\n` +
      `📅 ${formatDateLabel(d.date)} às ${time}\n` +
      `⏱ ${totalMin} min\n` +
      `💰 ${priceLabel}`
    )
    setStep('confirm')
  }

  async function confirmBooking() {
    if (!supabase || confirming) return
    setConfirming(true)
    const d        = draft
    const total    = (d.service?.price || 0) + d.addons.reduce((s, a) => s + a.price, 0)
    const totalMin = (d.service?.duration_minutes || 0) + d.addons.reduce((s, a) => s + a.duration_minutes, 0)

    userSay('Confirmar agendamento')
    await botSay(msgs.registering, DELAY.short)

    // Gera cancel_token client-side — elimina a necessidade de .select() após insert
    const cancelToken = crypto.randomUUID()

    const { error } = await supabase.from('bookings').insert({
      client_name: d.name, client_phone: d.phone,
      barber_id: d.barber.id, services: [...(d.service ? [d.service] : []), ...d.addons],
      date: d.date, time: d.time,
      total_minutes: totalMin, total, status: 'confirmado',
      cancel_token: cancelToken,
    })

    if (error) {
      setConfirming(false)
      if (error.code === '23505') {
        await botSay(msgs.slotTaken)
        setStep('time')
        await chooseDate(d.date)
      } else {
        await botSay(msgs.error)
      }
      return
    }

    const booking = {
      client_name: d.name, client_phone: d.phone,
      barber_id: d.barber.id,
      services: [...(d.service ? [d.service] : []), ...d.addons],
      date: d.date, time: d.time,
      total_minutes: totalMin, total, status: 'confirmado',
      cancel_token: cancelToken,
    }

    // Monta waUrl com mensagem completa ao barbeiro (inclui serviços, preço, link de cancelamento).
    // Sempre navega para /confirmado — o usuário clica no botão para abrir o WhatsApp.
    // Resolve o bug anterior onde /confirmado nunca era exibido para barbeiros com phone cadastrado.
    const baseUrl    = import.meta.env.VITE_APP_URL || window.location.origin
    const cancelUrl  = `${baseUrl}/cancelar/${cancelToken}`
    let waUrl = null
    if (d.barber?.phone) {
      const serviceList = [...(d.service ? [d.service] : []), ...d.addons].map(s => s.name).join(' + ')
      const priceLabel  = d.service?.price_type === 'from'
        ? `a partir de R$ ${total.toFixed(2).replace('.', ',')}`
        : `R$ ${total.toFixed(2).replace('.', ',')}`
      const msg =
        `Ola, ${d.barber.name.split(' ')[0]}! Confirmei meu agendamento:\n\n` +
        `Data: ${formatDateLabel(d.date)} as ${d.time}\n` +
        `Servico: ${serviceList}\n` +
        `Cliente: ${d.name}\n` +
        `Telefone: ${d.phone}\n` +
        `Total: ${priceLabel}\n\n` +
        `Link para cancelar:\n${cancelUrl}`
      waUrl = `https://wa.me/${d.barber.phone}?text=${encodeURIComponent(msg)}`
    }
    // Salva cliente para pré-preencher no próximo agendamento
    try { localStorage.setItem('mk_client', JSON.stringify({ name: d.name, phone: d.phone })) } catch {}
    navigate('/confirmado', { state: { booking, barber: d.barber, waUrl } })
  }

  const days        = getNextDays(20)
  const progressIdx = getProgressState(step)
  const showBack    = !typing && !NO_BACK.includes(step)

  const AVATAR_MAP = {
    maikon:  '/barbeiro-maikon.png',
    gabriel: '/barbeiro-gabriel.png',
    daniel:  '/barbeiro-daniel.png',
  }

  // Melhoria 4 — today string para chips
  const todayStr = formatDate(new Date())

  // Datas bloqueadas considerando barbeiro selecionado
  const barberId = draft.barber?.id
  const effectiveBlocked = new Set([
    ...allBlockedRows.filter(r => r.barber_id === null).map(r => r.date),
    ...(barberId && barberId !== '__primeiro__'
      ? allBlockedRows.filter(r => r.barber_id === barberId).map(r => r.date)
      : []),
  ])

  if (loadError) {
    return (
      <div className="booking-page">
        <div className="booking-load-error">
          <div className="booking-load-error__icon">✂️</div>
          <h2 className="booking-load-error__title">Ops, algo deu errado</h2>
          <p className="booking-load-error__msg">Não conseguimos carregar as informações. Verifique sua conexão e tente novamente.</p>
          <button className="booking-load-error__btn" onClick={() => { setLoadError(false); window.location.reload() }}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-page">
      {/* ── Header ── */}
      <header className="booking-header">
        <div className="booking-header__inner">
          <img className="booking-header__logo" src="/logo-semfundo.png" alt="MK e BALÃO" />
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
          {['Você', 'Profissional', 'Serviço', 'Horário', 'OK'].map((label, i) => {
            const state = i < progressIdx ? 'done' : i === progressIdx ? 'active' : 'idle'
            return (
              <div key={label} className="step-item" style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
                <div className={`step-node${state === 'active' ? ' step-node--active' : state === 'done' ? ' step-node--done' : ''}`}>
                  {state === 'done' ? '✓' : i + 1}
                </div>
                <span className={`step-label${state === 'active' ? ' step-label--active' : ''}`} style={{ marginLeft: '0.375rem' }}>{label}</span>
                {i < 4 && <div className="step-divider" />}
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
              {m.text.split('\n').map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
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

          {/* Botão voltar — aparece em todos os steps exceto o primeiro e success */}
          {showBack && (
            <button className="back-btn" onClick={goBack}>← Voltar</button>
          )}

          {/* Cliente retornando — confirma identidade */}
          {step === 'returning' && (
            <div className="action-list">
              <button className="chat-action-btn primary" onClick={() => chooseReturning(true)}>
                ✓ Sim, sou eu
              </button>
              <button className="chat-action-btn" onClick={() => chooseReturning(false)}>
                Não, sou outra pessoa
              </button>
            </div>
          )}

          {/* Seleção de barbeiro — círculos horizontais */}
          {step === 'barber' && barbers.length > 0 && (
            <div className="barber-grid">
              {/* Primeiro Disponível integrado ao grid */}
              <div className="barber-card barber-card--primeiro" onClick={() => chooseBarber(PRIMEIRO_DISPONIVEL)}>
                <div className="barber-card__avatar">⚡</div>
                <div className="barber-card__name">1º Disp.</div>
              </div>
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
                </div>
              ))}
            </div>
          )}

          {/* Nome */}
          {step === 'name' && (
            <form className="chat-input-wrap" onSubmit={submitName}>
              <input
                className="mk-input" type="text" value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Seu nome completo" autoFocus
              />
              <button type="submit" className="chat-send">→</button>
            </form>
          )}

          {/* Telefone — com máscara e validação */}
          {step === 'phone' && (
            <>
              <form className="chat-input-wrap" onSubmit={submitPhone}>
                <input
                  className="mk-input" type="tel" value={input}
                  onChange={e => { setInput(applyPhoneMask(e.target.value)); setPhoneError('') }}
                  placeholder="(14) 99999-9999" autoFocus
                />
                <button type="submit" className="chat-send">→</button>
              </form>
              {phoneError && <p className="phone-error">{phoneError}</p>}
            </>
          )}

          {/* Categorias com emojis */}
          {step === 'category' && (
            <div className="action-list">
              {categories.map(c => (
                <button key={c} className="chat-action-btn" onClick={() => chooseCategory(c)}>
                  <span className="category-emoji">{CATEGORY_EMOJI[c]}</span>
                  {CATEGORY_LABELS[c] || c}
                </button>
              ))}
              {addonServices.length > 0 && (
                <button className="chat-action-btn" onClick={chooseSoloAddon}>
                  <span className="category-emoji">✨</span>
                  Só um Adicional
                </button>
              )}
            </div>
          )}

          {/* Serviços — badge / nome / preço */}
          {step === 'service' && (
            <div className="action-list">
              {mainServices.map(s => (
                <button key={s.id} className="chat-action-btn service-row" onClick={() => chooseService(s)}>
                  {s.badge && <span className="service-badge">{s.badge}</span>}
                  <span className="service-name">{s.name}</span>
                  <span className="service-price">
                    {s.price_type === 'from' ? 'a partir de ' : ''}R$ {Number(s.price).toFixed(2).replace('.', ',')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Meu agendamento (cliente recorrente com booking futuro) */}
          {step === 'mybooking' && upcomingBooking && (
            <div className="action-list">
              <button className="chat-action-btn" onClick={async () => {
                setUpcomingBooking(null)
                userSay('Agendar novo horário')
                await startNormalFlow()
              }}>
                Agendar novo horário ✂️
              </button>
              <button className="chat-action-btn" style={{ borderColor: 'rgba(211,43,47,0.45)', color: 'var(--red)' }}
                onClick={() => navigate(`/cancelar/${upcomingBooking.cancel_token}`)}>
                Cancelar este agendamento
              </button>
            </div>
          )}

          {/* Adicionais */}
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
              {draft.addons.length > 0 && (
                <div className="addon-total-preview">
                  <span className="addon-total-preview__label">Total estimado:</span>
                  <span className="addon-total-preview__value">
                    R$ {((draft.service?.price || 0) + draft.addons.reduce((s, a) => s + (Number(a.price) || 0), 0)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <button className="chat-action-btn primary" onClick={confirmAddons}>
                  {draft.addons.length > 0
                    ? `Confirmar adicionais (${draft.addons.length}) ✓`
                    : 'Sem adicionais →'}
                </button>
              </div>
            </>
          )}

          {/* Datas — hoje até 20 dias, sem domingo — com chips esgotados (Melhoria 4) */}
          {step === 'date' && (
            <div className="date-scroll">
              {days.map(d => {
                const dt        = new Date(d + 'T12:00:00')
                const day       = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()
                const num       = dt.getDate()
                const month     = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
                const isToday   = d === todayStr
                const exhausted = exhaustedDates.includes(d) || effectiveBlocked.has(d)
                return (
                  <div
                    key={d}
                    className={`date-chip${draft.date === d ? ' active' : ''}${exhausted ? ' exhausted' : ''}`}
                    onClick={() => !exhausted && chooseDate(d)}
                  >
                    {isToday && <div className="date-chip__today">HOJE</div>}
                    <div className="date-chip__day">{day}</div>
                    <div className="date-chip__num">{num}</div>
                    <div className="date-chip__month">{month}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Horários */}
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

          {/* Confirmação — "Corrigir" volta para categoria/serviço */}
          {step === 'confirm' && (
            <div className="action-list">
              <button className="chat-action-btn primary" onClick={confirmBooking} disabled={confirming}>
                {confirming ? 'Aguarde…' : 'Confirmar ✓'}
              </button>
              <button className="chat-action-btn" onClick={() => {
                setDraft(d => ({ ...d, category: null, service: null, addons: [], date: null, time: null }))
                setStep('category')
              }}>
                Corrigir serviço
              </button>
            </div>
          )}

        </div>
      )}

      <footer className="booking-footer" />
    </div>
  )
}
