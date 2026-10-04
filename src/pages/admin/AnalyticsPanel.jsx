import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function periodFrom(p) {
  const nowBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  if (p === 'semana') {
    const d = new Date(nowBR); d.setDate(d.getDate() - d.getDay()); return d.toLocaleDateString('sv-SE')
  }
  if (p === 'mes') return new Date(nowBR.getFullYear(), nowBR.getMonth(), 1).toLocaleDateString('sv-SE')
  if (p === '30d') { const d = new Date(nowBR); d.setDate(d.getDate() - 30); return d.toLocaleDateString('sv-SE') }
  // 'total' — cap a 2 anos para evitar query ilimitada com o crescimento do histórico
  if (p === 'total') { const d = new Date(nowBR); d.setFullYear(d.getFullYear() - 2); return d.toLocaleDateString('sv-SE') }
  return null
}

const PERIODS = [
  ['semana', 'Esta semana'], ['mes', 'Este mês'], ['30d', 'Últimos 30 dias'], ['total', 'Todo período'],
]

export default function AnalyticsPanel() {
  const [period, setPeriod] = useState('mes')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [period])

  async function load() {
    setLoading(true)
    const from = periodFrom(period)

    let q = supabase.from('bookings').select('*, barbers(name)')
    if (from) q = q.gte('date', from)
    const { data: all } = await q.order('date')

    const bookings  = (all || []).filter(b => b.status !== 'cancelado')
    const cancelled = (all || []).filter(b => b.status === 'cancelado')

    const receita    = bookings.reduce((s, b) => s + (Number(b.total) || 0), 0)
    const ticketMedio = bookings.length > 0 ? receita / bookings.length : 0
    const cancelRate = (all?.length ?? 0) > 0 ? Math.round((cancelled.length / all.length) * 100) : 0

    const byBarber = {}
    bookings.forEach(b => {
      const k = b.barbers?.name || '—'
      byBarber[k] = byBarber[k] || { name: k, count: 0, receita: 0 }
      byBarber[k].count++
      byBarber[k].receita += (Number(b.total) || 0)
    })

    setStats({
      total: bookings.length, receita, ticketMedio, cancelRate,
      barbers: Object.values(byBarber).sort((a, b) => b.receita - a.receita),
    })
    setLoading(false)
  }

  const maxReceita = stats?.barbers?.[0]?.receita || 1

  return (
    <div className="mgmt-panel">
      <div className="admin-filters">
        {PERIODS.map(([k, l]) => (
          <button key={k} className={`filter-chip${period === k ? ' active' : ''}`} onClick={() => setPeriod(k)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="admin-loading">Carregando…</div> : !stats ? null : (
        <>
          <div className="analytics-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Receita</div>
              <div className="kpi-value kpi-value--gold">R$ {stats.receita.toFixed(2).replace('.', ',')}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Agendamentos</div>
              <div className="kpi-value">{stats.total}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Ticket médio</div>
              <div className="kpi-value">R$ {stats.ticketMedio.toFixed(2).replace('.', ',')}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Cancelamentos</div>
              <div className="kpi-value">{stats.cancelRate}%</div>
            </div>
          </div>

          {stats.barbers.length > 0 && (
            <div className="mgmt-group">
              <div className="mgmt-group__title">Por Barbeiro</div>
              <div className="analytics-barber-list">
                {stats.barbers.map(b => (
                  <div key={b.name} className="analytics-barber-row">
                    <div className="analytics-barber-name">{b.name}</div>
                    <div className="analytics-bar-wrap">
                      <div className="analytics-bar" style={{ width: `${(b.receita / maxReceita) * 100}%` }} />
                    </div>
                    <div className="analytics-barber-stats">
                      <span>{b.count} atend.</span>
                      <span className="kpi-value--gold">R$ {b.receita.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.total === 0 && (
            <div className="mgmt-empty">Nenhum agendamento no período selecionado.</div>
          )}
        </>
      )}
    </div>
  )
}
