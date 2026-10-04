import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateLabel } from '../lib/slots'
import { STATUS_LABEL } from './admin/constants'
import FiadoPanel from './admin/FiadoPanel'

const EMPTY_MSG = {
  hoje:    { icon: '✂️', text: 'Nenhum agendamento hoje.', sub: 'Aproveite o dia!' },
  semana:  { icon: '🗓', text: 'Agenda limpa para a semana.', sub: null },
  pendente:{ icon: '⏳', text: 'Nenhum agendamento pendente.', sub: null },
}

export default function Barbeiro({ barber }) {
  const navigate   = useNavigate()
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

  // KPIs mensais / semanais / fiado
  const [kpiMonth, setKpiMonth] = useState(null)
  const [kpiWeek,  setKpiWeek]  = useState(null)
  const [kpiFiado, setKpiFiado] = useState(null)

  // PWA install prompt — captura o evento antes que o browser o descarte
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); setInstallable(true) }
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

  // Primeiro dia do mês corrente e 7 dias atrás
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

  // KPIs extras — carregam uma vez ao montar (não dependem do tab)
  useEffect(() => {
    if (!barber?.id) return
    async function loadKpis() {
      const [{ data: month }, { data: week }, { data: fiados }] = await Promise.all([
        supabase.from('bookings').select('total')
          .eq('barber_id', barber.id).neq('status', 'cancelado')
          .gte('date', monthStart),
        supabase.from('bookings').select('total')
          .eq('barber_id', barber.id).neq('status', 'cancelado')
          .gte('date', weekStart),
        supabase.from('fiados').select('amount')
          .eq('barber_id', barber.id).eq('status', 'pendente'),
      ])
      setKpiMonth({
        receita: (month || []).reduce((s, b) => s + Number(b.total), 0),
        count:   (month || []).length,
      })
      setKpiWeek({
        receita: (week || []).reduce((s, b) => s + Number(b.total), 0),
        count:   (week || []).length,
      })
      setKpiFiado({
        total: (fiados || []).reduce((s, f) => s + Number(f.amount), 0),
        count: (fiados || []).length,
      })
    }
    loadKpis()
  }, [barber?.id])

  // Supabase Realtime — auto-refresh on new/updated bookings for this barber
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

  async function confirm(id) {
    setActionState(s => ({ ...s, [id]: 'loading' }))
    const { error } = await supabase.from('bookings').update({ status: 'confirmado' }).eq('id', id)
    if (error) {
      setActionState(s => ({ ...s, [id]: 'error' }))
      setTimeout(() => setActionState(s => ({ ...s, [id]: null })), 3000)
    } else {
      setActionState(s => ({ ...s, [id]: null }))
      loadBookings()
    }
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

  const TABS_SIDEBAR = [
    ['hoje',    '📅', 'Hoje'],
    ['semana',  '🗓', 'Semana'],
    ['pendente','⏳', 'Pendentes'],
    ['fiado',   '📋', 'Fiado'],
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

  const firstName = barber?.name?.split(' ')[0] ?? ''
  const activeTabLabel = TABS_SIDEBAR.find(([v]) => v === tab)?.[2] ?? ''
  const emptyMsg = EMPTY_MSG[tab]

  const fmtVal = (v) => v == null ? '—' : `R$ ${v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

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
            <button
              key={v}
              className={`nav-item${tab === v ? ' active' : ''}`}
              onClick={() => handleTabClick(v)}
            >
              <span className="nav-item__icon">{icon}</span>
              {l}
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

          {/* ── KPI grid — sempre visível ── */}
          <div className="kpi-grid kpi-grid--4">
            <div className="kpi-card">
              <div className="kpi-label">Hoje</div>
              <div className="kpi-value">{bookings.filter(b => b.status !== 'cancelado' && tab === 'hoje').length || (tab !== 'hoje' ? '—' : 0)}</div>
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

          {/* ── Tab: Fiado ── */}
          {tab === 'fiado' && (
            <FiadoPanel barber={barber} isAdmin={false} />
          )}

          {/* ── Tabs de agendamentos ── */}
          {tab !== 'fiado' && (
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
                ) : (
                  'Nenhum agendamento neste período.'
                )}
              </div>
            ) : (
              <div className="barbeiro-cards">
                {bookings.map(b => (
                  <div key={b.id} className={`barb-card${b.status === 'cancelado' ? ' barb-card--cancelado' : ''}`}>
                    <div className="barb-card__head">
                      <div className="barb-card__time-block">
                        <div className="barb-card__time">{b.time.slice(0, 5)}</div>
                        <div className="barb-card__date">{formatDateLabel(b.date)}</div>
                      </div>
                      <span className={`pill pill--${b.status}`}>{STATUS_LABEL[b.status]}</span>
                    </div>

                    <div className="barb-card__client">{b.client_name}</div>
                    <a
                      href={`https://wa.me/55${b.client_phone}`}
                      target="_blank" rel="noreferrer"
                      className="barb-card__phone"
                      aria-label={`WhatsApp de ${b.client_name}`}
                    >📱 {b.client_phone}</a>

                    <div className="barb-card__services">
                      {Array.isArray(b.services) ? b.services.map(s => s.name).join(' + ') : '—'}
                    </div>

                    <div className="barb-card__foot">
                      <div className="barb-card__total">R$ {Number(b.total).toFixed(2).replace('.', ',')}</div>
                      <div className="barb-card__actions">
                        {b.status === 'pendente' && (
                          <button
                            className={`action-btn-sm${actionState[b.id] === 'error' ? ' action-btn-sm--error' : ''}`}
                            onClick={() => confirm(b.id)}
                            disabled={actionState[b.id] === 'loading'}
                            aria-label="Confirmar agendamento"
                          >
                            {actionState[b.id] === 'loading' ? '…' : actionState[b.id] === 'error' ? 'Erro — tentar' : 'Confirmar'}
                          </button>
                        )}
                        {b.status === 'confirmado' && (
                          <button
                            className={`action-btn-sm${actionState[b.id] === 'error' ? ' action-btn-sm--error' : ''}`}
                            onClick={() => conclude(b.id)}
                            disabled={actionState[b.id] === 'loading'}
                            aria-label="Concluir agendamento"
                          >
                            {actionState[b.id] === 'loading' ? '…' : actionState[b.id] === 'error' ? 'Erro — tentar' : 'Concluir'}
                          </button>
                        )}
                        {(b.status === 'pendente' || b.status === 'confirmado') && (
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
                ))}
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
