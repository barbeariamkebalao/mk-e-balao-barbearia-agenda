import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDateLabel } from '../lib/slots'

const STATUS_LABEL = { pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }

export default function Barbeiro({ barber }) {
  const [bookings, setBookings] = useState([])
  const [tab,      setTab]      = useState('hoje')
  const [loading,  setLoading]  = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadBookings() }, [tab, barber?.id])

  async function loadBookings() {
    if (!barber?.id) return
    setLoading(true)
    let query = supabase
      .from('bookings').select('*')
      .eq('barber_id', barber.id)
      .order('date').order('time')

    if (tab === 'hoje')    query = query.eq('date', today)
    if (tab === 'semana')  query = query.gte('date', today)
    if (tab === 'pendente') query = query.eq('status', 'pendente')

    const { data } = await query
    setBookings(data || [])
    setLoading(false)
  }

  async function confirm(id) {
    await supabase.from('bookings').update({ status: 'confirmado' }).eq('id', id)
    loadBookings()
  }

  async function conclude(id) {
    await supabase.from('bookings').update({ status: 'concluido' }).eq('id', id)
    loadBookings()
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const receita = bookings
    .filter(b => b.status !== 'cancelado')
    .reduce((s, b) => s + Number(b.total), 0)

  const TABS = [['hoje','Hoje'],['semana','Semana'],['pendente','Pendentes']]

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/logo-semfundo.png" alt="MK e BALÃO" />
          <div className="admin-sidebar__label">{barber?.name?.split(' ')[0]}</div>
        </div>

        <nav className="admin-sidebar__nav">
          {TABS.map(([v, l]) => (
            <button
              key={v}
              className={`nav-item${tab === v ? ' active' : ''}`}
              onClick={() => setTab(v)}
            >
              <span className="nav-item__icon">
                {v === 'hoje' ? '📅' : v === 'semana' ? '🗓' : '⏳'}
              </span>
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
          <div className="admin-topbar__title">✂️ {barber?.name}</div>
        </div>

        <div className="admin-body">
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Agendamentos</div>
              <div className="kpi-value">{bookings.filter(b => b.status !== 'cancelado').length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Receita</div>
              <div className="kpi-value kpi-value--gold">R$ {receita.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="admin-loading">Carregando...</div>
          ) : bookings.length === 0 ? (
            <div className="admin-empty">Nenhum agendamento neste período.</div>
          ) : (
            <div className="barbeiro-cards">
              {bookings.map(b => (
                <div key={b.id} className={`barb-card${b.status === 'cancelado' ? ' barb-card--cancelado' : ''}`}>
                  <div className="barb-card__head">
                    <div>
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
                  >📱 {b.client_phone}</a>

                  <div className="barb-card__services">
                    {Array.isArray(b.services) ? b.services.map(s => s.name).join(' + ') : '—'}
                  </div>

                  <div className="barb-card__foot">
                    <div className="barb-card__total">R$ {Number(b.total).toFixed(2).replace('.', ',')}</div>
                    <div className="barb-card__actions">
                      {b.status === 'pendente' && (
                        <button className="action-btn-sm" onClick={() => confirm(b.id)}>Confirmar</button>
                      )}
                      {b.status === 'confirmado' && (
                        <button className="action-btn-sm" onClick={() => conclude(b.id)}>Concluir</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
