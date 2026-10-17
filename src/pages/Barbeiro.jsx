import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateLabel, timeToMinutes } from '../lib/slots'
import { STATUS_LABEL } from './admin/constants'
import FiadoPanel from './admin/FiadoPanel'

const EMPTY_MSG = {
  hoje:    { icon: '✂️', text: 'Nenhum agendamento hoje.', sub: 'Aproveite o dia!' },
  semana:  { icon: '🗓', text: 'Agenda limpa para a semana.', sub: null },
  pendente:{ icon: '⏳', text: 'Nenhum agendamento pendente.', sub: null },
}

function buildClientWA(b, type = 'confirm') {
  const phone    = `55${b.client_phone}`
  const services = Array.isArray(b.services) ? b.services.map(s => s.name).join(' + ') : ''
  const msg = type === 'late'
    ? `Olá ${b.client_name.split(' ')[0]}! Aviso que estou com um pequeno atraso. Já chego! MK e BALÃO ✂️`
    : `Olá ${b.client_name.split(' ')[0]}! ✅ Confirmado: ${services} em ${formatDateLabel(b.date)} às ${b.time.slice(0, 5)} na MK e BALÃO ✂️`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

export default function Barbeiro({ barber }) {
  const navigate = useNavigate()

  // ── Agendamentos ──
  const [bookings,    setBookings]    = useState([])
  const [tab,         setTab]         = useState('hoje')
  const [loading,     setLoading]     = useState(true)
  const [actionState, setActionState] = useState({})
  const [lastRefresh, setLastRefresh] = useState(null)
  const [copied,      setCopied]      = useState(false)
  const [realtimeMsg, setRealtimeMsg] = useState(null)
  const realtimeTimer = useRef(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installable,   setInstallable]   = useState(false)

  // KPIs
  const [kpiMonth, setKpiMonth] = useState(null)
  const [kpiWeek,  setKpiWeek]  = useState(null)
  const [kpiFiado, setKpiFiado] = useState(null)

  // Q3 — Bloqueio de dias
  const [barberBlocks, setBarberBlocks] = useState([])
  const [blockSection, setBlockSection] = useState(false)
  const [blockDate,    setBlockDate]    = useState('')
  const [blockReason,  setBlockReason]  = useState('')
  const [blockSaving,  setBlockSaving]  = useState(false)

  // S1 — Histórico do cliente
  const [historyModal,    setHistoryModal]    = useState(null) // { name, phone }
  const [historyBookings, setHistoryBookings] = useState([])
  const [historyLoading,  setHistoryLoading]  = useState(false)

  // S3 — Intervalo self-service
  const [localInterval,  setLocalInterval]  = useState(barber?.interval_minutes || 50)
  const [intervalSaving, setIntervalSaving] = useState(false)
  const [intervalSaved,  setIntervalSaved]  = useState(false)

  // ── PWA install prompt ──
  useEffect(() => {
    const onPrompt    = (e) => { e.preventDefault(); setInstallPrompt(e); setInstallable(true) }
    const onInstalled = () => setInstallable(false)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallable(false)
    setInstallPrompt(null)
  }

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

  const monthStart = (() => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()
  const weekStart = (() => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    d.setDate(d.getDate() - 6)
    return d.toLocaleDateString('sv-SE')
  })()

  useEffect(() => { loadBookings() }, [tab, barber?.id])

  // KPIs pessoais
  useEffect(() => {
    if (!barber?.id) return
    async function loadKpis() {
      const [{ data: month }, { data: week }, { data: fiados }] = await Promise.all([
        supabase.from('bookings').select('total')
          .eq('barber_id', barber.id).neq('status', 'cancelado').gte('date', monthStart),
        supabase.from('bookings').select('total')
          .eq('barber_id', barber.id).neq('status', 'cancelado').gte('date', weekStart),
        supabase.from('fiados').select('amount')
          .eq('barber_id', barber.id).eq('status', 'pendente'),
      ])
      setKpiMonth({ receita: (month  || []).reduce((s, b) => s + Number(b.total),  0), count: (month  || []).length })
      setKpiWeek ({  receita: (week   || []).reduce((s, b) => s + Number(b.total),  0), count: (week   || []).length })
      setKpiFiado({ total:   (fiados || []).reduce((s, f) => s + Number(f.amount), 0), count: (fiados || []).length })
    }
    loadKpis()
  }, [barber?.id])

  // Q3 — carrega dias bloqueados deste barbeiro
  useEffect(() => {
    if (!barber?.id) return
    loadBarberBlocks()
  }, [barber?.id])

  async function loadBarberBlocks() {
    const { data } = await supabase
      .from('blocked_dates').select('*')
      .eq('barber_id', barber.id).gte('date', today).order('date')
    setBarberBlocks(data || [])
  }

  async function saveBlock() {
    if (!blockDate) return
    setBlockSaving(true)
    const { error } = await supabase.from('blocked_dates').insert({
      barber_id: barber.id,
      date: blockDate,
      reason: blockReason.trim() || null,
    })
    setBlockSaving(false)
    if (!error) { setBlockDate(''); setBlockReason(''); loadBarberBlocks() }
  }

  async function deleteBlock(id) {
    await supabase.from('blocked_dates').delete().eq('id', id)
    loadBarberBlocks()
  }

  // S1 — Histórico do cliente
  async function openHistory(b) {
    setHistoryModal({ name: b.client_name, phone: b.client_phone })
    setHistoryLoading(true)
    setHistoryBookings([])
    const { data } = await supabase.from('bookings')
      .select('*').eq('barber_id', barber.id)
      .eq('client_phone', b.client_phone)
      .neq('status', 'cancelado')
      .order('date', { ascending: false }).limit(20)
    setHistoryBookings(data || [])
    setHistoryLoading(false)
  }

  // S3 — Salva intervalo
  async function saveInterval() {
    setIntervalSaving(true)
    const { error } = await supabase.from('barbers')
      .update({ interval_minutes: localInterval }).eq('id', barber.id)
    setIntervalSaving(false)
    if (!error) { setIntervalSaved(true); setTimeout(() => setIntervalSaved(false), 2500) }
  }

  // Realtime
  useEffect(() => {
    if (!barber?.id) return
    const channel = supabase
      .channel(`barbeiro-bookings-${barber.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings',
        filter: `barber_id=eq.${barber.id}` }, payload => {
        loadBookings()
        if (payload.eventType === 'INSERT') {
          setRealtimeMsg('Novo agendamento!')
          clearTimeout(realtimeTimer.current)
          realtimeTimer.current = setTimeout(() => setRealtimeMsg(null), 4000)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel); clearTimeout(realtimeTimer.current) }
  }, [barber?.id, tab])

  async function loadBookings() {
    if (!barber?.id) return
    setLoading(true)
    let query = supabase
      .from('bookings').select('*')
      .eq('barber_id', barber.id)
      .order('date').order('time')

    if (tab === 'hoje')     query = query.eq('date', today)
    if (tab === 'semana')   query = query.gte('date', today).neq('status', 'cancelado')
    if (tab === 'pendente') query = query.eq('status', 'pendente').gte('date', today)

    const { data } = await query
    setBookings(data || [])
    setLoading(false)
    setLastRefresh(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }

  function handleShareLink() {
    const url = `${window.location.origin}/agendar/${barber?.slug}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  async function conclude(id) {
    setActionState(s => ({ ...s, [id]: 'loading' }))
    const { error } = await supabase.from('bookings').update({ status: 'concluido' }).eq('id', id)
    if (error) {
      setActionState(s => ({ ...s, [id]: 'error' }))
      setTimeout(() => setActionState(s => ({ ...s, [id]: null })), 3000)
    } else {
      setActionState(s => ({ ...s, [id]: null }))
      loadBookings()
    }
  }

  async function cancel(id) {
    if (!window.confirm('Cancelar este agendamento?')) return
    setActionState(s => ({ ...s, [id]: 'loading' }))
    const { error } = await supabase.from('bookings').update({ status: 'cancelado' }).eq('id', id)
    if (error) {
      setActionState(s => ({ ...s, [id]: 'error' }))
      setTimeout(() => setActionState(s => ({ ...s, [id]: null })), 3000)
    } else {
      setActionState(s => ({ ...s, [id]: null }))
      loadBookings()
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  const receitaTab = bookings
    .filter(b => b.status !== 'cancelado')
    .reduce((s, b) => s + Number(b.total), 0)

  // Q2 — próximo agendamento do dia
  const nowMinutesBR = (() => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    return d.getHours() * 60 + d.getMinutes()
  })()

  const nextBookingId = tab === 'hoje' ? (() => {
    const active = bookings.filter(b => b.status !== 'cancelado' && b.status !== 'concluido')
    const future = active.filter(b => timeToMinutes(b.time) >= nowMinutesBR)
    return future.length > 0 ? future[0].id : null
  })() : null

  const TABS_SIDEBAR = [
    ['hoje',    '📅', 'Hoje'],
    ['semana',  '🗓', 'Semana'],
    ['pendente','⏳', 'Pendentes'],
    ['fiado',   '📋', 'Fiado'],
    ['config',  '⚙️', 'Config'],
    ['portal',  '📲', 'Social'],
    ['manual',  '📖', 'Manual'],
    ['marca',   '🎨', 'Marca'],
    ['hub',     '🗂️', 'Hub'],
  ]

  const TABS_BOTTOM = [
    ['hoje',    '📅', 'Hoje'],
    ['semana',  '🗓', 'Semana'],
    ['pendente','⏳', 'Pendentes'],
    ['fiado',   '📋', 'Fiado'],
  ]

  function handleTabClick(v) {
    if (v === 'portal') navigate('/portal')
    else if (v === 'manual') navigate('/manual')
    else if (v === 'marca') navigate('/marca')
    else if (v === 'hub') navigate('/hub')
    else setTab(v)
  }

  const firstName        = barber?.name?.split(' ')[0] ?? ''
  const activeTabLabel   = TABS_SIDEBAR.find(([v]) => v === tab)?.[2] ?? ''
  const emptyMsg         = EMPTY_MSG[tab]
  const fmtVal           = (v) => v == null ? '—' : `R$ ${v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

  const isBookingTab = !['fiado', 'config'].includes(tab)

  return (
    <div className="admin-layout">

      {/* ── Sidebar (desktop) ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/logo-semfundo.png" alt="MK e BALÃO" />
          <div className="admin-sidebar__label">{firstName}</div>
        </div>
        <nav className="admin-sidebar__nav">
          {TABS_SIDEBAR.map(([v, icon, l]) => (
            <button key={v} className={`nav-item${tab === v ? ' active' : ''}`} onClick={() => handleTabClick(v)}>
              <span className="nav-item__icon">{icon}</span>{l}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <button className="admin-logout" onClick={logout}>Sair</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar__title">
            <span className="admin-topbar__name">✂️ {firstName}</span>
            <span className="admin-topbar__tab-label">{activeTabLabel}</span>
          </div>
        </div>

        <div className="admin-body">

          {/* ── KPI grid ── */}
          <div className="kpi-grid kpi-grid--4">
            <div className="kpi-card">
              <div className="kpi-label">Hoje</div>
              <div className="kpi-value">
                {tab === 'hoje' ? bookings.filter(b => b.status !== 'cancelado').length : '—'}
              </div>
              <div className="kpi-sub">agendamentos</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Receita hoje</div>
              <div className="kpi-value kpi-value--gold">
                {tab === 'hoje' ? `R$ ${receitaTab.toFixed(0)}` : '—'}
              </div>
              <div className="kpi-sub">estimado</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Últimos 7 dias</div>
              <div className="kpi-value">{kpiWeek ? kpiWeek.count : '…'}</div>
              <div className="kpi-sub">{kpiWeek ? fmtVal(kpiWeek.receita) : '…'}</div>
            </div>
            <div className="kpi-card kpi-card--highlight">
              <div className="kpi-label">Mês atual</div>
              <div className="kpi-value kpi-value--gold">{kpiMonth ? fmtVal(kpiMonth.receita) : '…'}</div>
              <div className="kpi-sub">{kpiMonth ? `${kpiMonth.count} atendimentos` : '…'}</div>
            </div>
            {kpiFiado !== null && kpiFiado.count > 0 && (
              <div className="kpi-card kpi-card--fiado" onClick={() => setTab('fiado')} style={{ cursor: 'pointer' }}>
                <div className="kpi-label">Fiado em aberto</div>
                <div className="kpi-value kpi-value--red">{kpiFiado.count}</div>
                <div className="kpi-sub">{fmtVal(kpiFiado.total)} pendente</div>
              </div>
            )}
          </div>

          {/* ── Ações rápidas ── */}
          <div className="barb-quick-actions">
            <button className="barb-qa-btn" onClick={() => navigate(`/agendar/${barber?.slug}`)}>
              📋 Agendar para cliente
            </button>
            <button className="barb-qa-btn" onClick={handleShareLink}>
              {copied ? '✓ Copiado!' : '🔗 Compartilhar link'}
            </button>
            <button
              className={`barb-qa-btn${blockSection ? ' barb-qa-btn--active' : ''}`}
              onClick={() => setBlockSection(s => !s)}
            >
              🚫 Bloquear dia
            </button>
            <button className="barb-qa-btn barb-qa-btn--refresh" onClick={loadBookings} disabled={loading}>
              🔄 {loading ? 'Atualizando…' : 'Atualizar'}
              {lastRefresh && !loading && <span className="barb-qa-refresh-ts">{lastRefresh}</span>}
            </button>
            {installable && (
              <button className="barb-qa-btn barb-qa-btn--install" onClick={handleInstall}>
                📲 Instalar App
              </button>
            )}
          </div>

          {/* ── Q3: Bloquear dia ── */}
          {blockSection && (
            <div className="barb-block-section">
              <div className="barb-block-section__title">Bloquear dia na sua agenda</div>
              <div className="barb-block-row">
                <input
                  type="date"
                  className="barb-block-input"
                  value={blockDate}
                  min={today}
                  onChange={e => setBlockDate(e.target.value)}
                />
                <input
                  type="text"
                  className="barb-block-input barb-block-input--reason"
                  placeholder="Motivo (opcional)"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                />
                <button className="barb-qa-btn" onClick={saveBlock} disabled={!blockDate || blockSaving}>
                  {blockSaving ? '…' : 'Bloquear'}
                </button>
              </div>
              {barberBlocks.length > 0 ? (
                <div className="barb-block-list">
                  {barberBlocks.map(bl => (
                    <div key={bl.id} className="barb-block-item">
                      <span className="barb-block-item__date">{formatDateLabel(bl.date)}</span>
                      {bl.reason && <span className="barb-block-item__reason">{bl.reason}</span>}
                      <button className="barb-block-item__del" onClick={() => deleteBlock(bl.id)}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="barb-block-empty">Nenhum dia bloqueado no futuro.</div>
              )}
            </div>
          )}

          {/* ── Tab: Fiado ── */}
          {tab === 'fiado' && <FiadoPanel barber={barber} isAdmin={false} />}

          {/* ── Tab: Config (S3 — intervalo self-service) ── */}
          {tab === 'config' && (
            <div className="mgmt-panel">
              <div className="mgmt-group">
                <div className="mgmt-group__title">Intervalo de atendimento</div>
                <div style={{ padding: '1rem' }}>
                  <p style={{ color: 'var(--dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Tempo mínimo entre agendamentos. Afeta os horários que os clientes veem ao agendar com você.
                  </p>
                  <div className="mgmt-field-row">
                    <div className="mgmt-field">
                      <label>Meu intervalo</label>
                      <select
                        value={localInterval}
                        onChange={e => setLocalInterval(Number(e.target.value))}
                      >
                        <option value={30}>30 min</option>
                        <option value={40}>40 min</option>
                        <option value={50}>50 min</option>
                        <option value={60}>60 min (1h)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mgmt-actions" style={{ marginTop: '1rem' }}>
                    <button
                      className="mgmt-btn mgmt-btn--save"
                      onClick={saveInterval}
                      disabled={intervalSaving}
                    >
                      {intervalSaved ? '✓ Salvo!' : intervalSaving ? 'Salvando…' : 'Salvar intervalo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tabs de agendamentos ── */}
          {isBookingTab && (
            loading ? (
              <div className="admin-loading">
                <div className="admin-loading__spinner" aria-hidden="true" />
                Carregando...
              </div>
            ) : bookings.length === 0 ? (
              <div className="admin-empty">
                {emptyMsg ? (
                  <>
                    <div className="admin-empty__icon" aria-hidden="true">{emptyMsg.icon}</div>
                    <div className="admin-empty__text">{emptyMsg.text}</div>
                    {emptyMsg.sub && <div className="admin-empty__sub">{emptyMsg.sub}</div>}
                  </>
                ) : 'Nenhum agendamento neste período.'}
              </div>
            ) : (
              <div className="barbeiro-cards">
                {bookings.map(b => {
                  const isNext   = b.id === nextBookingId
                  const diffMin  = isNext ? timeToMinutes(b.time) - nowMinutesBR : null
                  const nextLabel = isNext
                    ? (diffMin <= 0 ? 'AGORA' : diffMin <= 90 ? `em ${diffMin} min` : null)
                    : null
                  const isActive = b.status === 'pendente' || b.status === 'confirmado'

                  return (
                    <div
                      key={b.id}
                      className={[
                        'barb-card',
                        b.status === 'cancelado' ? 'barb-card--cancelado' : '',
                        isNext ? 'barb-card--next' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <div className="barb-card__head">
                        <div className="barb-card__time-block">
                          <div className="barb-card__time">{b.time.slice(0, 5)}</div>
                          <div className="barb-card__date">{formatDateLabel(b.date)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {nextLabel && (
                            <span className={`barb-next-badge${diffMin <= 0 ? ' barb-next-badge--now' : ''}`}>
                              {nextLabel}
                            </span>
                          )}
                          <span className={`pill pill--${b.status}`}>{STATUS_LABEL[b.status]}</span>
                        </div>
                      </div>

                      {/* S1 — nome clicável abre histórico */}
                      <button
                        className="barb-card__client barb-card__client--btn"
                        onClick={() => openHistory(b)}
                        title="Ver histórico do cliente"
                      >
                        {b.client_name}
                      </button>

                      {/* Q1 — WA direto + confirmar por WA */}
                      <div className="barb-card__phone-row">
                        <a
                          href={`https://wa.me/55${b.client_phone}`}
                          target="_blank" rel="noreferrer"
                          className="barb-card__phone"
                          aria-label={`WhatsApp de ${b.client_name}`}
                        >📱 {b.client_phone}</a>
                        {isActive && (
                          <a
                            href={buildClientWA(b, 'confirm')}
                            target="_blank" rel="noreferrer"
                            className="barb-card__wa-confirm"
                            title="Enviar confirmação no WhatsApp"
                          >✓ WA</a>
                        )}
                      </div>

                      <div className="barb-card__services">
                        {Array.isArray(b.services) ? b.services.map(s => s.name).join(' + ') : '—'}
                      </div>

                      <div className="barb-card__foot">
                        <div className="barb-card__total">
                          R$ {Number(b.total).toFixed(2).replace('.', ',')}
                        </div>
                        <div className="barb-card__actions">
                          {/* S2 — Estou atrasado */}
                          {isActive && (
                            <a
                              href={buildClientWA(b, 'late')}
                              target="_blank" rel="noreferrer"
                              className="action-btn-sm action-btn-sm--late"
                              title="Avisar cliente sobre atraso"
                            >
                              Atrasado
                            </a>
                          )}
                          {isActive && (
                            <button
                              className={`action-btn-sm${actionState[b.id] === 'error' ? ' action-btn-sm--error' : ''}`}
                              onClick={() => conclude(b.id)}
                              disabled={actionState[b.id] === 'loading'}
                              aria-label="Concluir agendamento"
                            >
                              {actionState[b.id] === 'loading' ? '…' : actionState[b.id] === 'error' ? 'Erro — tentar' : 'Concluir'}
                            </button>
                          )}
                          {isActive && (
                            <button
                              className="action-btn-sm action-btn-sm--danger"
                              onClick={() => cancel(b.id)}
                              disabled={actionState[b.id] === 'loading'}
                              aria-label="Cancelar agendamento"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </main>

      {/* ── Realtime toast ── */}
      <div className={`realtime-toast${realtimeMsg ? ' visible' : ''}`} role="status" aria-live="polite">
        <span className="realtime-toast__dot" aria-hidden="true" />
        {realtimeMsg}
      </div>

      {/* ── S1: Modal de histórico do cliente ── */}
      {historyModal && (
        <div className="barb-history-overlay" onClick={() => setHistoryModal(null)}>
          <div className="barb-history-modal" onClick={e => e.stopPropagation()}>
            <div className="barb-history-modal__head">
              <div>
                <div className="barb-history-modal__name">{historyModal.name}</div>
                <div className="barb-history-modal__phone">📱 {historyModal.phone}</div>
              </div>
              <button className="barb-history-modal__close" onClick={() => setHistoryModal(null)}>✕</button>
            </div>
            {historyLoading ? (
              <div className="barb-history-modal__loading">Carregando histórico…</div>
            ) : (
              <>
                <div className="barb-history-modal__stats">
                  <div className="barb-history-stat">
                    <div className="barb-history-stat__val">{historyBookings.length}</div>
                    <div className="barb-history-stat__label">visitas</div>
                  </div>
                  <div className="barb-history-stat">
                    <div className="barb-history-stat__val">
                      R$ {historyBookings.reduce((s, b) => s + Number(b.total), 0).toFixed(0)}
                    </div>
                    <div className="barb-history-stat__label">total gasto</div>
                  </div>
                </div>
                <div className="barb-history-modal__list">
                  {historyBookings.length === 0 ? (
                    <div style={{ color: 'var(--dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      Nenhum histórico encontrado.
                    </div>
                  ) : historyBookings.map(b => (
                    <div key={b.id} className="barb-history-item">
                      <div className="barb-history-item__date">
                        {formatDateLabel(b.date)} às {b.time.slice(0, 5)}
                      </div>
                      <div className="barb-history-item__services">
                        {Array.isArray(b.services) ? b.services.map(s => s.name).join(' + ') : '—'}
                      </div>
                      <div className="barb-history-item__total">
                        R$ {Number(b.total).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Navigation (mobile only) ── */}
      <nav className="bottom-nav" aria-label="Navegação principal">
        {TABS_BOTTOM.map(([v, icon, l]) => (
          <button
            key={v}
            className={`bottom-nav__item${tab === v ? ' active' : ''}`}
            onClick={() => handleTabClick(v)}
            aria-label={l}
            aria-current={tab === v ? 'page' : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">{icon}</span>
            <span className="bottom-nav__label">{l}</span>
          </button>
        ))}
        <button
          className="bottom-nav__item bottom-nav__item--logout"
          onClick={logout}
          aria-label="Sair"
        >
          <span className="bottom-nav__icon" aria-hidden="true">↩</span>
          <span className="bottom-nav__label">Sair</span>
        </button>
      </nav>
    </div>
  )
}
