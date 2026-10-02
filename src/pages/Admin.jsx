import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDateLabel } from '../lib/slots'

const STATUS_LABEL = { pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }
const STATUS_CYCLE = { pendente: 'confirmado', confirmado: 'concluido', concluido: 'concluido', cancelado: 'cancelado' }

export default function Admin({ barber }) {
  const [tab,      setTab]      = useState('hoje')
  const [bookings, setBookings] = useState([])
  const [barbers,  setBarbers]  = useState([])
  const [services, setServices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('todos')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadAll() }, [tab])

  async function loadAll() {
    setLoading(true)
    const [{ data: bk }, { data: br }, { data: sv }] = await Promise.all([
      supabase.from('bookings')
        .select('*, barbers(name, slug)')
        .eq(tab === 'hoje' ? 'date' : 'status', tab === 'hoje' ? today : tab === 'todos' ? undefined : tab)
        .order('date').order('time'),
      supabase.from('barbers').select('*').order('sort_order'),
      supabase.from('services').select('*').order('sort_order'),
    ])
    setBookings(bk || [])
    setBarbers(br || [])
    setServices(sv || [])
    setLoading(false)
  }

  async function advanceStatus(id, current) {
    const next = STATUS_CYCLE[current]
    if (next === current) return
    await supabase.from('bookings').update({ status: next }).eq('id', id)
    loadAll()
  }

  async function cancelBooking(id) {
    if (!confirm('Cancelar este agendamento?')) return
    await supabase.from('bookings').update({ status: 'cancelado' }).eq('id', id)
    loadAll()
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const filtered = filter === 'todos' ? bookings : bookings.filter(b => b.barbers?.slug === filter)
  const kpi = {
    total:      bookings.filter(b => b.status !== 'cancelado').length,
    confirmado: bookings.filter(b => b.status === 'confirmado').length,
    receita:    bookings.filter(b => b.status !== 'cancelado').reduce((s, b) => s + Number(b.total), 0),
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header__brand">MK e BALÃO · Admin</div>
        <nav className="admin-nav">
          {['hoje','todos'].map(t => (
            <button key={t} className={`admin-nav__btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'hoje' ? 'Hoje' : 'Todos'}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={logout}>Sair</button>
      </header>

      <div className="admin-body">
        {/* KPIs */}
        <div className="admin-kpis">
          <div className="admin-kpi">
            <div className="admin-kpi__value">{kpi.total}</div>
            <div className="admin-kpi__label">Agendamentos</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi__value">{kpi.confirmado}</div>
            <div className="admin-kpi__label">Confirmados</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi__value">R$ {kpi.receita.toFixed(2).replace('.', ',')}</div>
            <div className="admin-kpi__label">Receita</div>
          </div>
        </div>

        {/* Filtro por barbeiro */}
        <div className="admin-filters">
          <button className={`filter-btn${filter === 'todos' ? ' active' : ''}`} onClick={() => setFilter('todos')}>Todos</button>
          {barbers.filter(b => b.role !== 'admin').map(b => (
            <button key={b.id} className={`filter-btn${filter === b.slug ? ' active' : ''}`} onClick={() => setFilter(b.slug)}>
              {b.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Tabela de agendamentos */}
        {loading ? (
          <div className="admin-loading">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">Nenhum agendamento encontrado.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Cliente</th>
                  <th>Barbeiro</th>
                  <th>Serviços</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div>{formatDateLabel(b.date)}</div>
                      <div className="admin-table__time">{b.time.slice(0,5)}</div>
                    </td>
                    <td>
                      <div>{b.client_name}</div>
                      <a href={`https://wa.me/55${b.client_phone}`} target="_blank" rel="noreferrer" className="admin-table__phone">
                        {b.client_phone}
                      </a>
                    </td>
                    <td>{b.barbers?.name}</td>
                    <td className="admin-table__services">
                      {Array.isArray(b.services) ? b.services.map(s => s.name).join(', ') : '—'}
                    </td>
                    <td>R$ {Number(b.total).toFixed(2).replace('.', ',')}</td>
                    <td>
                      <span className={`status-pill status-pill--${b.status}`}>
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                    <td className="admin-table__actions">
                      {b.status !== 'cancelado' && b.status !== 'concluido' && (
                        <button className="action-btn" onClick={() => advanceStatus(b.id, b.status)}>
                          Avançar →
                        </button>
                      )}
                      {b.status !== 'cancelado' && (
                        <button className="action-btn action-btn--danger" onClick={() => cancelBooking(b.id)}>
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
