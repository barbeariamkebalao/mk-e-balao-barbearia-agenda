import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDateLabel } from '../lib/slots'

const STATUS_LABEL = { pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }

export default function Barbeiro({ barber }) {
  const [bookings,  setBookings]  = useState([])
  const [tab,       setTab]       = useState('hoje')
  const [loading,   setLoading]   = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadBookings() }, [tab, barber?.id])

  async function loadBookings() {
    if (!barber?.id) return
    setLoading(true)
    let query = supabase
      .from('bookings')
      .select('*')
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

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header__brand">✂️ {barber?.name}</div>
        <nav className="admin-nav">
          {[['hoje','Hoje'],['semana','Semana'],['pendente','Pendentes']].map(([v, l]) => (
            <button key={v} className={`admin-nav__btn${tab === v ? ' active' : ''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </nav>
        <button className="admin-logout" onClick={logout}>Sair</button>
      </header>

      <div className="admin-body">
        <div className="admin-kpis">
          <div className="admin-kpi">
            <div className="admin-kpi__value">{bookings.filter(b => b.status !== 'cancelado').length}</div>
            <div className="admin-kpi__label">Agendamentos</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi__value">R$ {receita.toFixed(2).replace('.', ',')}</div>
            <div className="admin-kpi__label">Receita</div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Carregando...</div>
        ) : bookings.length === 0 ? (
          <div className="admin-empty">Nenhum agendamento neste período.</div>
        ) : (
          <div className="barbeiro-cards">
            {bookings.map(b => (
              <div key={b.id} className={`barb-card barb-card--${b.status}`}>
                <div className="barb-card__time">{b.time.slice(0,5)}</div>
                <div className="barb-card__date">{formatDateLabel(b.date)}</div>
                <div className="barb-card__client">{b.client_name}</div>
                <a
                  href={`https://wa.me/55${b.client_phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="barb-card__phone"
                >
                  📱 {b.client_phone}
                </a>
                <div className="barb-card__services">
                  {Array.isArray(b.services) ? b.services.map(s => s.name).join(' + ') : '—'}
                </div>
                <div className="barb-card__total">R$ {Number(b.total).toFixed(2).replace('.', ',')}</div>
                <div className="barb-card__status">
                  <span className={`status-pill status-pill--${b.status}`}>{STATUS_LABEL[b.status]}</span>
                </div>
                <div className="barb-card__actions">
                  {b.status === 'pendente'   && <button className="action-btn action-btn--green" onClick={() => confirm(b.id)}>Confirmar</button>}
                  {b.status === 'confirmado' && <button className="action-btn" onClick={() => conclude(b.id)}>Concluir</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
