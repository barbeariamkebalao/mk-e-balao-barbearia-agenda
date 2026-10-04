import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CAT_LABEL } from './constants'

export default function BarberServicesPanel() {
  const [barbers,     setBarbers]     = useState([])
  const [services,    setServices]    = useState([])
  const [assignments, setAssignments] = useState({})
  const [saving,      setSaving]      = useState(null)
  const [msg,         setMsg]         = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: b }, { data: s }, { data: bs }] = await Promise.all([
      supabase.from('barbers').select('*').neq('role', 'admin').order('sort_order'),
      supabase.from('services').select('*').eq('active', true).order('sort_order'),
      supabase.from('barber_services').select('*'),
    ])
    setBarbers(b || [])
    setServices(s || [])
    const map = {}
    for (const barber of (b || [])) {
      map[barber.id] = new Set((bs || []).filter(x => x.barber_id === barber.id).map(x => x.service_id))
    }
    setAssignments(map)
  }

  function toggle(barberId, serviceId) {
    setAssignments(prev => {
      const set = new Set(prev[barberId] || [])
      if (set.has(serviceId)) set.delete(serviceId)
      else set.add(serviceId)
      return { ...prev, [barberId]: set }
    })
  }

  async function saveBarber(barberId) {
    setSaving(barberId)
    const serviceIds = [...(assignments[barberId] || [])]
    await supabase.from('barber_services').delete().eq('barber_id', barberId)
    if (serviceIds.length > 0) {
      await supabase.from('barber_services').insert(
        serviceIds.map(sid => ({ barber_id: barberId, service_id: sid }))
      )
    }
    setSaving(null)
    setMsg('Serviços salvos!')
    setTimeout(() => setMsg(''), 2500)
  }

  const grouped = services.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="mgmt-panel">
      {msg && <div className="mgmt-toast">{msg}</div>}
      {barbers.map(b => (
        <div key={b.id} className="mgmt-group">
          <div className="mgmt-group__title">{b.name}</div>
          <div className="bs-grid">
            {Object.entries(grouped).map(([cat, svcs]) => (
              <div key={cat} className="bs-cat">
                <div className="bs-cat__title">{CAT_LABEL[cat] || cat}</div>
                {svcs.map(svc => (
                  <label key={svc.id} className="bs-check">
                    <input
                      type="checkbox"
                      checked={assignments[b.id]?.has(svc.id) ?? false}
                      onChange={() => toggle(b.id, svc.id)}
                    />
                    <span>{svc.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className="mgmt-actions" style={{ padding: '0.75rem 1rem 1rem' }}>
            <button className="mgmt-btn mgmt-btn--save" onClick={() => saveBarber(b.id)} disabled={saving === b.id}>
              {saving === b.id ? 'Salvando…' : `Salvar serviços de ${b.name.split(' ')[0]}`}
            </button>
          </div>
        </div>
      ))}
      {barbers.length === 0 && <div className="mgmt-empty">Nenhum barbeiro encontrado.</div>}
    </div>
  )
}
