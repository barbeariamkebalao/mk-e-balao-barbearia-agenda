import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateLabel } from '../lib/slots'
import { STATUS_LABEL, STATUS_CYCLE } from './admin/constants'
import ServicosPanel      from './admin/ServicosPanel'
import EquipePanel        from './admin/EquipePanel'
import BarberServicesPanel from './admin/BarberServicesPanel'
import AnalyticsPanel     from './admin/AnalyticsPanel'
import AgendaPanel        from './admin/AgendaPanel'
import ConfigPanel        from './admin/ConfigPanel'
import ClubePanel         from './admin/ClubePanel'
import ChatAgendaPanel    from './admin/ChatAgendaPanel'
import FiadoPanel         from './admin/FiadoPanel'
import GaleriaPanel       from './admin/GaleriaPanel'

const PAGE_SIZE = 50

function getGreeting(barberName) {
  const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours()
  const period = h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite'
  const first = (barberName || 'Admin').split(' ')[0]
  return `Boa ${period}, ${first}!`
}

export default function Admin({ barber }) {
  const navigate    = useNavigate()
  const [tab,       setTab]       = useState('hoje')
  const [bookings,  setBookings]  = useState([])
  const [allBarbers, setAllBarbers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('todos')
  const [search,    setSearch]    = useState('')
  const [navOpen,   setNavOpen]   = useState(false)
  const [actionState, setActionState] = useState({})
  const [page,      setPage]      = useState(0)
  const [totalCount, setTotalCount] = useState(null)
  const [realtimeMsg, setRealtimeMsg] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installable,   setInstallable]   = useState(false)
  const [kpiMonth,      setKpiMonth]      = useState(null)
  const [kpiWeek,       setKpiWeek]       = useState(null)
  const navRef = useRef()
  const realtimeTimer = useRef(null)

  // PWA install prompt
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

  const today       = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const isBookingTab = tab === 'hoje' || tab === 'todos'

  const monthStart = (() => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()
  const weekStart = (() => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    d.setDate(d.getDate() - 6)
    return d.toLocaleDateString('sv-SE')
  })()

  // KPIs mensais/semanais — função nomeada para reutilizar no realtime
  async function loadKpis() {
    const [{ data: month }, { data: week }] = await Promise.all([
      supabase.from('bookings').select('total').neq('status', 'cancelado').gte('date', monthStart),
      supabase.from('bookings').select('total').neq('status', 'cancelado').gte('date', weekStart),
    ])
    setKpiMonth({
      receita: (month || []).reduce((s, b) => s + Number(b.total), 0),
      count:   (month || []).length,
    })
    setKpiWeek({
      receita: (week || []).reduce((s, b) => s + Number(b.total), 0),
      count:   (week || []).length,
    })
  }

  useEffect(() => { loadKpis() }, [])

  useEffect(() => {
    function onOutside(e) { if (navRef.current && !navRef.current.contains(e.target)) setNavOpen(false) }
    function onEscape(e)   { if (e.key === 'Escape') setNavOpen(false) }
    if (navOpen) {
      document.addEventListener('mousedown', onOutside)
      document.addEventListener('keydown',   onEscape)
    }
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown',   onEscape)
    }
  }, [navOpen])

  useEffect(() => {
    if (isBookingTab) loadBookings()
    setActionState({})
    setPage(0)
  }, [tab])

  // Supabase Realtime — auto-refresh on INSERT/UPDATE in bookings
  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
        if (isBookingTab) loadBookings()
        loadKpis()
        if (payload.eventType === 'INSERT') {
          setRealtimeMsg('Novo agendamento recebido')
          clearTimeout(realtimeTimer.current)
          realtimeTimer.current = setTimeout(() => setRealtimeMsg(null), 4000)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel); clearTimeout(realtimeTimer.current) }
  }, [tab])

  useEffect(() => {
    if (tab === 'todos') loadBookings()
  }, [page])

  async function loadBookings() {
    setLoading(true)
    let bkQuery = supabase.from('bookings')
      .select('*, barbers(name, slug)', tab === 'todos' ? { count: 'exact' } : undefined)
      .order('date').order('time')

    if (tab === 'hoje') {
      bkQuery = bkQuery.eq('date', today)
    } else {
      bkQuery = bkQuery.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    }

    const [bkResult, { data: br }] = await Promise.all([
      bkQuery,
      supabase.from('barbers').select('*').order('sort_order'),
    ])

    setBookings(bkResult.data || [])
    if (tab === 'todos') setTotalCount(bkResult.count ?? null)
    setAllBarbers(br || [])
    setLoading(false)
  }

  async function advanceStatus(id, current) {
    const next = STATUS_CYCLE[current]
    if (next === current) return
    setActionState(s => ({ ...s, [id]: 'loading' }))
    const { error } = await supabase.from('bookings').update({ status: next }).eq('id', id)
    if (error) {
      setActionState(s => ({ ...s, [id]: 'error' }))
      setTimeout(() => setActionState(s => ({ ...s, [id]: null })), 3000)
    } else {
      setActionState(s => ({ ...s, [id]: null }))
      loadBookings()
    }
  }

  async function cancelBooking(id) {
    if (!confirm('Cancelar este agendamento?')) return
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
    window.location.href = '/login'
  }

  const byBarber = filter === 'todos' ? bookings : bookings.filter(b => b.barbers?.slug === filter)
  const filtered = search.trim().length >= 2
    ? byBarber.filter(b =>
        b.client_name.toLowerCase().includes(search.toLowerCase()) ||
        b.client_phone.includes(search.replace(/\D/g, ''))
      )
    : byBarber

  const kpi = {
    total:      bookings.filter(b => b.status !== 'cancelado').length,
    confirmado: bookings.filter(b => b.status === 'confirmado').length,
    receita:    bookings.filter(b => b.status !== 'cancelado').reduce((s, b) => s + Number(b.total), 0),
  }

  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : null

  const NAV_ITEMS = [
    { icon: '◈',  label: 'Dashboard',       desc: 'Métricas e agendamentos de hoje',       value: 'hoje'            },
    { icon: '📅', label: 'Agendamentos',     desc: 'Todos os agendamentos',                 value: 'todos'           },
    { icon: '📊', label: 'Analytics',        desc: 'Relatórios e métricas do período',      value: 'analytics'       },
    { icon: '📆', label: 'Disponibilidade',  desc: 'Horários por barbeiro',                 value: 'agenda'          },
    { icon: '✂',  label: 'Serviços',         desc: 'Preços e catálogo',                     value: 'servicos'        },
    { icon: '🗃',  label: 'Serv./Barbeiro',  desc: 'Quais serviços cada barbeiro realiza',  value: 'barber_services' },
    { icon: '👤', label: 'Equipe',           desc: 'Perfis, fotos e dados',                 value: 'equipe'          },
    { icon: '💬', label: 'Chat & Agenda',    desc: 'Configurações do fluxo de agendamento', value: 'chat'            },
    { icon: '🏆', label: 'Clube',            desc: 'Planos de assinatura',                  value: 'clube'           },
    { icon: '📋', label: 'Fiado',           desc: 'Atendimentos a prazo e cobranças',       value: 'fiado'           },
    { icon: '🖼', label: 'Galeria',         desc: 'Trabalhos recentes — fotos do site',     value: 'galeria'         },
    { icon: '⚙',  label: 'Configurações',   desc: 'Dados e parâmetros da barbearia',       value: 'config'          },
  ]

  const NAV_EXTERNAL = [
    { icon: '📲', label: 'Social Media', desc: 'Posts e conteúdo visual',   path: '/portal' },
    { icon: '📖', label: 'Manual',       desc: 'Guia de uso da marca',      path: '/manual' },
    { icon: '🎨', label: 'Marca',        desc: 'Identidade visual',         path: '/marca'  },
    { icon: '🗂',  label: 'Hub',         desc: 'Central de links',          path: '/hub'    },
  ]

  const currentNav = NAV_ITEMS.find(n => n.value === tab) || NAV_ITEMS[0]

  function handleNav(item) {
    setNavOpen(false)
    if (item.path) navigate(item.path)
    else setTab(item.value)
  }

  return (
    <div className="adm-shell">

      {/* ── Header ── */}
      <header className="adm-topbar">
        <div className="adm-topbar__left">

          <div className="adm-brand">
            <div className="adm-brand__box">MK</div>
            <div className="adm-brand__info">
              <span className="adm-brand__title">Painel Admin</span>
              <span className="adm-brand__sub">MK e BALÃO</span>
            </div>
          </div>

          <div className="adm-topbar__sep" />

          <div className="adm-nav-wrap" ref={navRef}>
            <button className="adm-nav-trigger" onClick={() => setNavOpen(v => !v)}>
              <span className="adm-nav-trigger__icon">{currentNav.icon}</span>
              <span>{currentNav.label}</span>
              <span className="adm-nav-trigger__caret">▾</span>
            </button>

            {navOpen && (
              <div className="adm-nav-panel">
                <div className="adm-nav-panel__label">Navegação</div>
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.value}
                    className={`adm-nav-panel__item${tab === item.value ? ' active' : ''}`}
                    onClick={() => handleNav(item)}
                  >
                    <span className="adm-nav-panel__icon">{item.icon}</span>
                    <span className="adm-nav-panel__body">
                      <span className="adm-nav-panel__name">{item.label}</span>
                      <span className="adm-nav-panel__desc">{item.desc}</span>
                    </span>
                  </button>
                ))}
                <div className="adm-nav-panel__sep" />
                {NAV_EXTERNAL.map(item => (
                  <button key={item.path} className="adm-nav-panel__item" onClick={() => handleNav(item)}>
                    <span className="adm-nav-panel__icon">{item.icon}</span>
                    <span className="adm-nav-panel__body">
                      <span className="adm-nav-panel__name">{item.label}</span>
                      <span className="adm-nav-panel__desc">{item.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="adm-topbar__right">
          <div className="adm-status-pill">
            <span className="adm-status-pill__dot" />
            Barbearia Aberta
          </div>
          {installable && (
            <button className="adm-install-btn" onClick={handleInstall} title="Instalar app na tela inicial">
              📲 Instalar
            </button>
          )}
          <a href="/" target="_blank" rel="noreferrer" className="adm-site-btn">Ver Site ↗</a>
          <button className="adm-logout" onClick={logout}>Sair</button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="adm-main">

        {/* ── Dashboard (hoje / todos) ── */}
        {isBookingTab && (
          <div className="adm-dashboard">

            <div className="adm-db-header">
              <div>
                <div className="adm-db-eyebrow">Visão Geral</div>
                <h1 className="adm-db-greeting">{getGreeting(barber?.name)}</h1>
                {kpi.total > 0 && (
                  <p className="adm-db-alert">
                    <span className="adm-db-alert__dot" />
                    Você tem <strong>{kpi.total}</strong> agendamento{kpi.total !== 1 ? 's' : ''} {tab === 'hoje' ? 'hoje.' : 'nesta página.'}
                  </p>
                )}
              </div>
              <div className="adm-db-actions">
                <a href="/" target="_blank" rel="noreferrer" className="adm-btn adm-btn--ghost">↗ Novo Agendamento</a>
                <button className="adm-btn adm-btn--red" onClick={loadBookings}>↺ Atualizar</button>
              </div>
            </div>

            {/* KPI cards */}
            <div className="adm-kpi-grid adm-kpi-grid--6">
              <div className="adm-kpi-card">
                <div className="adm-kpi-card__top">
                  <div className="adm-kpi-card__icon">📅</div>
                  <div className="adm-kpi-card__meta">
                    <span className="adm-kpi-card__label">Agendamentos</span>
                    <span className={`adm-kpi-card__sub adm-kpi-card__sub--${tab === 'hoje' ? 'green' : 'dim'}`}>{tab === 'hoje' ? 'Hoje' : 'Esta página'}</span>
                  </div>
                </div>
                <div className="adm-kpi-card__val-row">
                  <span className="adm-kpi-card__val">{kpi.total}</span>
                  <span className="adm-kpi-card__unit">clientes</span>
                </div>
              </div>
              <div className="adm-kpi-card">
                <div className="adm-kpi-card__top">
                  <div className="adm-kpi-card__icon adm-kpi-card__icon--green">✓</div>
                  <div className="adm-kpi-card__meta">
                    <span className="adm-kpi-card__label">Confirmados</span>
                    <span className="adm-kpi-card__sub adm-kpi-card__sub--green">Aguardando</span>
                  </div>
                </div>
                <div className="adm-kpi-card__val-row">
                  <span className="adm-kpi-card__val adm-kpi-card__val--green">{kpi.confirmado}</span>
                </div>
              </div>
              <div className="adm-kpi-card">
                <div className="adm-kpi-card__top">
                  <div className="adm-kpi-card__icon adm-kpi-card__icon--green" style={{ fontSize: '0.85rem', fontWeight: 700 }}>R$</div>
                  <div className="adm-kpi-card__meta">
                    <span className="adm-kpi-card__label">Receita</span>
                    <span className={`adm-kpi-card__sub adm-kpi-card__sub--${tab === 'hoje' ? 'green' : 'dim'}`}>{tab === 'hoje' ? 'Estimado hoje' : 'Esta página'}</span>
                  </div>
                </div>
                <div className="adm-kpi-card__val-row">
                  <span className="adm-kpi-card__val adm-kpi-card__val--gold" style={{ fontSize: '1.75rem' }}>
                    {kpi.receita.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  </span>
                  <span className="adm-kpi-card__unit">,00</span>
                </div>
              </div>
              <div className="adm-kpi-card">
                <div className="adm-kpi-card__top">
                  <div className="adm-kpi-card__icon adm-kpi-card__icon--blue">↗</div>
                  <div className="adm-kpi-card__meta">
                    <span className="adm-kpi-card__label">Ticket Médio</span>
                    <span className="adm-kpi-card__sub adm-kpi-card__sub--dim">por atendimento</span>
                  </div>
                </div>
                <div className="adm-kpi-card__val-row">
                  <span className="adm-kpi-card__val" style={{ fontSize: '1.75rem' }}>
                    {kpi.total > 0 ? `R$ ${(kpi.receita / kpi.total).toFixed(0)}` : '—'}
                  </span>
                </div>
              </div>
              <div className="adm-kpi-card">
                <div className="adm-kpi-card__top">
                  <div className="adm-kpi-card__icon">📊</div>
                  <div className="adm-kpi-card__meta">
                    <span className="adm-kpi-card__label">Últimos 7 dias</span>
                    <span className="adm-kpi-card__sub adm-kpi-card__sub--dim">{kpiWeek ? `${kpiWeek.count} atend.` : '…'}</span>
                  </div>
                </div>
                <div className="adm-kpi-card__val-row">
                  <span className="adm-kpi-card__val adm-kpi-card__val--gold" style={{ fontSize: '1.75rem' }}>
                    {kpiWeek ? `R$ ${kpiWeek.receita.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : '…'}
                  </span>
                </div>
              </div>
              <div className="adm-kpi-card adm-kpi-card--highlight">
                <div className="adm-kpi-card__top">
                  <div className="adm-kpi-card__icon adm-kpi-card__icon--gold" style={{ fontSize: '0.8rem', fontWeight: 800 }}>MÊS</div>
                  <div className="adm-kpi-card__meta">
                    <span className="adm-kpi-card__label">Mês atual</span>
                    <span className="adm-kpi-card__sub adm-kpi-card__sub--dim">{kpiMonth ? `${kpiMonth.count} atend.` : '…'}</span>
                  </div>
                </div>
                <div className="adm-kpi-card__val-row">
                  <span className="adm-kpi-card__val adm-kpi-card__val--gold" style={{ fontSize: '1.75rem' }}>
                    {kpiMonth ? `R$ ${kpiMonth.receita.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : '…'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="admin-filters">
              <button className={`filter-chip${filter === 'todos' ? ' active' : ''}`} onClick={() => setFilter('todos')}>Todos</button>
              {allBarbers.filter(b => b.role !== 'admin').map(b => (
                <button key={b.id} className={`filter-chip${filter === b.slug ? ' active' : ''}`} onClick={() => setFilter(b.slug)}>
                  {b.name.split(' ')[0]}
                </button>
              ))}
              <div className="admin-search-wrap">
                <input className="admin-search-input" type="text" value={search}
                  onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone…" />
                {search && <button className="admin-search-clear" onClick={() => setSearch('')}>×</button>}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="admin-loading">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="admin-empty">{search ? 'Nenhum resultado para a busca.' : 'Nenhum agendamento encontrado.'}</div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Data / Hora</th><th>Cliente</th><th>Barbeiro</th>
                        <th>Serviços</th><th>Total</th><th>Status</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div className="td-time">{b.time.slice(0, 5)}</div>
                            <div className="td-date">{formatDateLabel(b.date)}</div>
                          </td>
                          <td>
                            <div>{b.client_name}</div>
                            <a href={`https://wa.me/55${b.client_phone}`} target="_blank" rel="noreferrer" className="td-phone">{b.client_phone}</a>
                          </td>
                          <td>{b.barbers?.name}</td>
                          <td className="td-svc">{Array.isArray(b.services) ? b.services.map(s => s.name).join(', ') : '—'}</td>
                          <td className="td-total">R$ {Number(b.total).toFixed(2).replace('.', ',')}</td>
                          <td><span className={`pill pill--${b.status}`}>{STATUS_LABEL[b.status]}</span></td>
                          <td>
                            <div className="td-actions">
                              {b.status !== 'cancelado' && b.status !== 'concluido' && (
                                <button
                                  className={`action-btn-sm${actionState[b.id] === 'error' ? ' action-btn-sm--error' : ''}`}
                                  onClick={() => advanceStatus(b.id, b.status)}
                                  disabled={actionState[b.id] === 'loading'}
                                >
                                  {actionState[b.id] === 'loading' ? '…' : actionState[b.id] === 'error' ? 'Erro' : 'Avançar →'}
                                </button>
                              )}
                              {b.status !== 'cancelado' && (
                                <button
                                  className="action-btn-sm action-btn-sm--danger"
                                  onClick={() => cancelBooking(b.id)}
                                  disabled={actionState[b.id] === 'loading'}
                                >
                                  {actionState[b.id] === 'loading' ? '…' : 'Cancelar'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination — only for "todos" */}
                {tab === 'todos' && totalPages !== null && totalPages > 1 && (
                  <div className="admin-pagination">
                    <button
                      className="admin-pagination__btn"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >← Anterior</button>
                    <span className="admin-pagination__info">
                      Página {page + 1} de {totalPages}
                      {totalCount !== null && ` · ${totalCount} registros`}
                    </span>
                    <button
                      className="admin-pagination__btn"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >Próxima →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Other panels with section title ── */}
        {!isBookingTab && (
          <div className="adm-section-title">{currentNav.label}</div>
        )}

        <div className={isBookingTab ? '' : 'admin-body'}>
          {tab === 'analytics'       && <AnalyticsPanel />}
          {tab === 'agenda'          && <AgendaPanel />}
          {tab === 'servicos'        && <ServicosPanel />}
          {tab === 'barber_services' && <BarberServicesPanel />}
          {tab === 'equipe'          && <EquipePanel />}
          {tab === 'chat'            && <ChatAgendaPanel />}
          {tab === 'clube'           && <ClubePanel />}
          {tab === 'fiado'           && <FiadoPanel barber={barber} isAdmin={true} />}
          {tab === 'galeria'         && <GaleriaPanel />}
          {tab === 'config'          && <ConfigPanel />}
        </div>
      </main>

      {/* ── Bottom Nav (mobile) ── */}
      <nav className="adm-bottom-nav" aria-label="Navegação rápida">
        {[
          { icon: '◈',  label: 'Hoje',    value: 'hoje'      },
          { icon: '📅', label: 'Todos',   value: 'todos'     },
          { icon: '📊', label: 'Analytics', value: 'analytics' },
          { icon: '💬', label: 'Chat',    value: 'chat'      },
          { icon: '⚙',  label: 'Config',  value: 'config'    },
        ].map(item => (
          <button
            key={item.value}
            className={`adm-bottom-nav__item${tab === item.value ? ' active' : ''}`}
            onClick={() => setTab(item.value)}
            aria-label={item.label}
            aria-current={tab === item.value ? 'page' : undefined}
          >
            <span className="adm-bottom-nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="adm-bottom-nav__label">{item.label}</span>
          </button>
        ))}
        <button
          className="adm-bottom-nav__item adm-bottom-nav__item--logout"
          onClick={logout}
          aria-label="Sair"
        >
          <span className="adm-bottom-nav__icon" aria-hidden="true">↩</span>
          <span className="adm-bottom-nav__label">Sair</span>
        </button>
      </nav>

      {/* ── Realtime toast ── */}
      <div className={`realtime-toast${realtimeMsg ? ' visible' : ''}`} role="status" aria-live="polite">
        <span className="realtime-toast__dot" aria-hidden="true" />
        {realtimeMsg}
      </div>
    </div>
  )
}
