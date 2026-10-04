import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { DAYS_PT } from './constants'

export default function AgendaPanel() {
  const [barbers, setBarbers] = useState([])
  const [avail, setAvail] = useState({})
  const [saving, setSaving] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: b }, { data: a }] = await Promise.all([
      supabase.from('barbers').select('*').neq('role', 'admin').order('sort_order'),
      supabase.from('availability').select('*'),
    ])
    setBarbers(b || [])
    const map = {}
    for (const row of (a || [])) {
      map[row.barber_id] = map[row.barber_id] || {}
      map[row.barber_id][row.day_of_week] = { ...row }
    }
    setAvail(map)
  }

  function updateSlot(barberId, day, field, value) {
    setAvail(prev => ({
      ...prev,
      [barberId]: {
        ...(prev[barberId] || {}),
        [day]: {
          start_time: '09:00', end_time: '19:00', active: false,
          ...(prev[barberId]?.[day] || {}),
          barber_id: barberId, day_of_week: day, [field]: value,
        },
      },
    }))
  }

  async function saveBarber(barberId) {
    const rows = Object.values(avail[barberId] || {})
    const invalid = rows.filter(r => r.active && r.start_time >= r.end_time)
    if (invalid.length > 0) {
      setMsg('Horário de início deve ser anterior ao horário de fim.')
      setTimeout(() => setMsg(''), 3000)
      return
    }
    setSaving(barberId)
    try {
      for (const row of rows) {
        await supabase.from('availability').upsert(
          { barber_id: barberId, day_of_week: row.day_of_week, start_time: row.start_time, end_time: row.end_time, active: row.active },
          { onConflict: 'barber_id,day_of_week' }
        )
      }
      setMsg('Agenda salva!')
      setTimeout(() => setMsg(''), 2500)
    } catch {
      setMsg('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mgmt-panel">
      {msg && <div className="mgmt-toast">{msg}</div>}
      {barbers.map(b => {
        const bAvail = avail[b.id] || {}
        return (
          <div key={b.id} className="mgmt-group">
            <div className="mgmt-group__title">{b.name}</div>
            <div className="avail-grid">
              {[0, 1, 2, 3, 4, 5, 6].map(day => {
                const slot = bAvail[day] || { start_time: '09:00', end_time: '19:00', active: false }
                return (
                  <div key={day} className={`avail-day${slot.active ? ' avail-day--open' : ''}`}>
                    <div className="avail-day__label">{DAYS_PT[day]}</div>
                    <label className="mgmt-toggle">
                      <input type="checkbox" checked={!!slot.active}
                        onChange={e => updateSlot(b.id, day, 'active', e.target.checked)} />
                      <span>{slot.active ? 'Aberto' : 'Fechado'}</span>
                    </label>
                    {slot.active && (
                      <div className="avail-times">
                        <input type="time" className="avail-time-input" value={slot.start_time}
                          onChange={e => updateSlot(b.id, day, 'start_time', e.target.value)} />
                        <span className="avail-sep">–</span>
                        <input type="time" className="avail-time-input" value={slot.end_time}
                          onChange={e => updateSlot(b.id, day, 'end_time', e.target.value)} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mgmt-actions" style={{ padding: '1rem' }}>
              <button className="mgmt-btn mgmt-btn--save" onClick={() => saveBarber(b.id)} disabled={saving === b.id}>
                {saving === b.id ? 'Salvando…' : `Salvar agenda de ${b.name.split(' ')[0]}`}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
