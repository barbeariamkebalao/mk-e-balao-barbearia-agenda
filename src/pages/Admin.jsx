import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { formatDateLabel } from '../lib/slots'

const STATUS_LABEL = { pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }
const STATUS_CYCLE = { pendente: 'confirmado', confirmado: 'concluido', concluido: 'concluido', cancelado: 'cancelado' }
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const CAT_LABEL = { cabelo: 'Cabelo', barba: 'Barba', combo: 'Combo', colorimetria: 'Colorimetria', adicional: 'Adicional' }

// ── SERVIÇOS ───────────────────────────────────────────────────
function ServicosPanel() {
  const [services, setServices] = useState([])
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('services').select('*').order('sort_order')
    setServices(data || [])
  }

  function startEdit(svc) {
    setEditing(svc.id)
    setDraft({ price: svc.price, price_type: svc.price_type, description: svc.description || '', active: svc.active })
    setMsg('')
  }

  async function save(id) {
    setSaving(true)
    const { error } = await supabase.from('services').update({
      price: Number(draft.price), price_type: draft.price_type,
      description: draft.description, active: draft.active,
    }).eq('id', id)
    setSaving(false)
    if (error) { setMsg('Erro ao salvar.'); return }
    setEditing(null); setMsg('Salvo!'); load()
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
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mgmt-group">
          <div className="mgmt-group__title">{CAT_LABEL[cat] || cat}</div>
          {items.map(svc => (
            <div key={svc.id} className={`mgmt-row${!svc.active ? ' mgmt-row--inactive' : ''}`}>
              <div className="mgmt-row__main">
                <div className="mgmt-row__name">
                  {svc.name}
                  {svc.is_addon && <span className="mgmt-badge">adicional</span>}
                </div>
                {editing === svc.id ? (
                  <div className="mgmt-edit-form">
                    <div className="mgmt-field-row">
                      <div className="mgmt-field">
                        <label>Preço (R$)</label>
                        <input type="number" step="0.01" min="0" value={draft.price}
                          onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} />
                      </div>
                      <div className="mgmt-field">
                        <label>Tipo</label>
                        <select value={draft.price_type}
                          onChange={e => setDraft(d => ({ ...d, price_type: e.target.value }))}>
                          <option value="fixed">Fixo</option>
                          <option value="from">A partir de</option>
                        </select>
                      </div>
                      <div className="mgmt-field">
                        <label>Status</label>
                        <label className="mgmt-toggle">
                          <input type="checkbox" checked={draft.active}
                            onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
                          <span>{draft.active ? 'Ativo' : 'Inativo'}</span>
                        </label>
                      </div>
                    </div>
                    <div className="mgmt-field mgmt-field--full">
                      <label>Descrição</label>
                      <textarea value={draft.description} rows={2}
                        onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
                    </div>
                    <div className="mgmt-actions">
                      <button className="mgmt-btn mgmt-btn--save" onClick={() => save(svc.id)} disabled={saving}>
                        {saving ? 'Salvando…' : 'Salvar'}
                      </button>
                      <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="mgmt-row__desc">{svc.description}</div>
                )}
              </div>
              {editing !== svc.id && (
                <div className="mgmt-row__side">
                  <div className="mgmt-row__price">
                    {svc.price_type === 'from' && <span className="mgmt-from">a partir de</span>}
                    R$ {Number(svc.price).toFixed(2).replace('.', ',')}
                  </div>
                  <span className={`pill pill--${svc.active ? 'confirmado' : 'cancelado'}`}>
                    {svc.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button className="mgmt-edit-btn" onClick={() => startEdit(svc)}>Editar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── EQUIPE ─────────────────────────────────────────────────────
function EquipePanel() {
  const [barbers, setBarbers] = useState([])
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('barbers').select('*').order('sort_order')
    setBarbers((data || []).filter(b => b.role !== 'admin'))
  }

  function startEdit(b) {
    setEditing(b.id)
    setDraft({ bio: b.bio || '', quote: b.quote || '', speciality: b.speciality || '', avatar_url: b.avatar_url || '' })
    setMsg('')
  }

  async function uploadPhoto(file) {
    const b = barbers.find(x => x.id === editing)
    if (!b) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `barbeiro-${b.slug}.${ext}`
    const { error } = await supabase.storage.from('barber-images').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { setMsg('Erro no upload.'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('barber-images').getPublicUrl(path)
    setDraft(d => ({ ...d, avatar_url: publicUrl }))
    setUploading(false)
    setMsg('Foto carregada — clique em Salvar para confirmar.')
  }

  async function save(id) {
    setSaving(true)
    const { error } = await supabase.from('barbers').update({
      bio: draft.bio, quote: draft.quote, speciality: draft.speciality, avatar_url: draft.avatar_url,
    }).eq('id', id)
    setSaving(false)
    if (error) { setMsg('Erro ao salvar.'); return }
    setEditing(null); setMsg('Perfil atualizado!'); load()
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="mgmt-panel">
      {msg && <div className="mgmt-toast">{msg}</div>}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) uploadPhoto(f); e.target.value = '' }} />
      {barbers.map(b => (
        <div key={b.id} className="mgmt-barber-card">
          <div className="mgmt-barber-card__avatar">
            <img src={editing === b.id ? draft.avatar_url || b.avatar_url : b.avatar_url}
              alt={b.name} onError={e => { e.target.src = '/logo-escudo.jpg' }} />
            {editing === b.id && (
              <button className="mgmt-photo-btn" onClick={() => fileRef.current.click()} disabled={uploading} title="Trocar foto">
                {uploading ? '…' : '📷'}
              </button>
            )}
          </div>
          <div className="mgmt-barber-card__body">
            <div className="mgmt-barber-card__name">{b.name}</div>
            {editing === b.id ? (
              <div className="mgmt-edit-form">
                <div className="mgmt-field mgmt-field--full">
                  <label>Especialidade</label>
                  <input value={draft.speciality} onChange={e => setDraft(d => ({ ...d, speciality: e.target.value }))} />
                </div>
                <div className="mgmt-field mgmt-field--full">
                  <label>Frase do barbeiro</label>
                  <input value={draft.quote} onChange={e => setDraft(d => ({ ...d, quote: e.target.value }))} />
                </div>
                <div className="mgmt-field mgmt-field--full">
                  <label>Bio</label>
                  <textarea value={draft.bio} rows={3} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} />
                </div>
                <div className="mgmt-actions">
                  <button className="mgmt-btn mgmt-btn--save" onClick={() => save(b.id)} disabled={saving}>
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setEditing(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mgmt-barber-card__speciality">{b.speciality}</div>
                <div className="mgmt-barber-card__quote">"{b.quote}"</div>
                <div className="mgmt-barber-card__bio">{b.bio}</div>
                <button className="mgmt-edit-btn" onClick={() => startEdit(b)}>Editar perfil</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ANALYTICS ──────────────────────────────────────────────────
function AnalyticsPanel() {
  const [period, setPeriod] = useState('mes')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [period])

  function periodFrom(p) {
    const now = new Date()
    if (p === 'semana') {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]
    }
    if (p === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    if (p === '30d') { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] }
    return null
  }

  async function load() {
    setLoading(true)
    const from = periodFrom(period)

    let q = supabase.from('bookings').select('*, barbers(name)')
    if (from) q = q.gte('date', from)
    const { data: all } = await q.order('date')

    const bookings = (all || []).filter(b => b.status !== 'cancelado')
    const cancelled = (all || []).filter(b => b.status === 'cancelado')

    const receita = bookings.reduce((s, b) => s + Number(b.total), 0)
    const ticketMedio = bookings.length > 0 ? receita / bookings.length : 0
    const cancelRate = all?.length > 0 ? Math.round((cancelled.length / all.length) * 100) : 0

    const byBarber = {}
    bookings.forEach(b => {
      const k = b.barbers?.name || '—'
      byBarber[k] = byBarber[k] || { name: k, count: 0, receita: 0 }
      byBarber[k].count++
      byBarber[k].receita += Number(b.total)
    })

    setStats({
      total: bookings.length, receita, ticketMedio, cancelRate,
      barbers: Object.values(byBarber).sort((a, b) => b.receita - a.receita),
    })
    setLoading(false)
  }

  const PERIODS = [
    ['semana', 'Esta semana'], ['mes', 'Este mês'], ['30d', 'Últimos 30 dias'], ['total', 'Todo período'],
  ]

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

// ── AGENDA (disponibilidade) ────────────────────────────────────
function AgendaPanel() {
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
    setSaving(barberId)
    const rows = Object.values(avail[barberId] || {})
    for (const row of rows) {
      await supabase.from('availability').upsert(
        { barber_id: barberId, day_of_week: row.day_of_week, start_time: row.start_time, end_time: row.end_time, active: row.active },
        { onConflict: 'barber_id,day_of_week' }
      )
    }
    setSaving(null)
    setMsg('Agenda salva!')
    setTimeout(() => setMsg(''), 2500)
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

// ── CONFIG ────────────────────────────────────────────────────
function ConfigPanel() {
  const [settings, setSettings] = useState(null)
  const [blocked, setBlocked] = useState([])
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: bd }] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('blocked_dates').select('*').is('barber_id', null).order('date'),
    ])
    setSettings(s || {})
    setBlocked(bd || [])
  }

  async function saveSettings() {
    setSaving(true)
    const { id: _, ...payload } = settings
    const { error } = await supabase.from('settings').update(payload).eq('id', 1)
    setSaving(false)
    if (error) { setMsg('Erro ao salvar.'); return }
    setMsg('Configurações salvas!')
    setTimeout(() => setMsg(''), 2500)
  }

  async function addBlocked() {
    if (!newDate) return
    await supabase.from('blocked_dates').insert({ barber_id: null, date: newDate, reason: newReason || null })
    setNewDate(''); setNewReason(''); load()
  }

  async function removeBlocked(id) {
    if (!confirm('Remover este bloqueio?')) return
    await supabase.from('blocked_dates').delete().eq('id', id); load()
  }

  if (!settings) return <div className="admin-loading">Carregando…</div>

  const FIELDS = [
    { key: 'name',           label: 'Nome da barbearia' },
    { key: 'tagline',        label: 'Tagline' },
    { key: 'address',        label: 'Endereço' },
    { key: 'city',           label: 'Cidade — UF' },
    { key: 'whatsapp',       label: 'WhatsApp (DDI+DDD+número)' },
    { key: 'hours_weekday',  label: 'Horário Seg–Sex' },
    { key: 'hours_saturday', label: 'Horário Sábado' },
    { key: 'instagram',      label: 'Instagram (URL)' },
    { key: 'maps_url',       label: 'Google Maps (URL)' },
  ]

  return (
    <div className="mgmt-panel">
      {msg && <div className="mgmt-toast">{msg}</div>}
      <div className="mgmt-group">
        <div className="mgmt-group__title">Informações da Barbearia</div>
        <div className="mgmt-settings-grid">
          {FIELDS.map(f => (
            <div key={f.key} className="mgmt-field mgmt-field--full">
              <label>{f.label}</label>
              <input value={settings[f.key] || ''}
                onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="mgmt-actions" style={{ padding: '0 1rem 1rem' }}>
          <button className="mgmt-btn mgmt-btn--save" onClick={saveSettings} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar configurações'}
          </button>
        </div>
      </div>
      <div className="mgmt-group">
        <div className="mgmt-group__title">Dias Bloqueados — Barbearia Fechada</div>
        <div className="mgmt-blocked-form">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          <input type="text" placeholder="Motivo (ex: Feriado, Férias…)" value={newReason}
            onChange={e => setNewReason(e.target.value)} />
          <button className="mgmt-btn mgmt-btn--save" onClick={addBlocked}>+ Bloquear</button>
        </div>
        {blocked.length === 0 ? (
          <div className="mgmt-empty">Nenhum dia bloqueado no momento.</div>
        ) : (
          <div className="mgmt-blocked-list">
            {blocked.map(bd => (
              <div key={bd.id} className="mgmt-blocked-item">
                <span className="mgmt-blocked-date">
                  {new Date(bd.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                <span className="mgmt-blocked-reason">{bd.reason || '—'}</span>
                <button className="mgmt-remove-btn" onClick={() => removeBlocked(bd.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── CLUBE ─────────────────────────────────────────────────────
function PlanForm({ draft, setDraft, onSave, onCancel, saving }) {
  return (
    <div className="mgmt-edit-form" style={{ padding: '1rem' }}>
      <div className="mgmt-field-row">
        <div className="mgmt-field">
          <label>Nome do plano</label>
          <input value={draft.name || ''} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
        </div>
        <div className="mgmt-field">
          <label>Tagline</label>
          <input value={draft.tagline || ''} onChange={e => setDraft(d => ({ ...d, tagline: e.target.value }))} />
        </div>
      </div>
      <div className="mgmt-field mgmt-field--full">
        <label>Benefícios (um por linha)</label>
        <textarea rows={5} value={draft.features_text || ''}
          onChange={e => setDraft(d => ({ ...d, features_text: e.target.value }))}
          placeholder="2 Cortes no mês&#10;1 Barba Completa&#10;10% OFF em Produtos" />
      </div>
      <div className="mgmt-field-row">
        <div className="mgmt-field">
          <label>Telefone WhatsApp (CTA)</label>
          <input value={draft.cta_phone || ''} onChange={e => setDraft(d => ({ ...d, cta_phone: e.target.value }))} placeholder="5514999999999" />
        </div>
        <div className="mgmt-field">
          <label>Texto CTA</label>
          <input value={draft.cta_text || ''} onChange={e => setDraft(d => ({ ...d, cta_text: e.target.value }))} placeholder="GARANTIR PLANO" />
        </div>
      </div>
      <div className="mgmt-field mgmt-field--full">
        <label>Mensagem WhatsApp</label>
        <input value={draft.cta_message || ''} onChange={e => setDraft(d => ({ ...d, cta_message: e.target.value }))} />
      </div>
      <div className="mgmt-field-row">
        <div className="mgmt-field">
          <label>Ordem</label>
          <input type="number" value={draft.sort_order || 0} onChange={e => setDraft(d => ({ ...d, sort_order: e.target.value }))} />
        </div>
        <div className="mgmt-field" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <label className="mgmt-toggle">
            <input type="checkbox" checked={!!draft.highlight}
              onChange={e => setDraft(d => ({ ...d, highlight: e.target.checked }))} />
            <span>Destaque</span>
          </label>
        </div>
        <div className="mgmt-field" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <label className="mgmt-toggle">
            <input type="checkbox" checked={draft.active !== false}
              onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
            <span>Ativo</span>
          </label>
        </div>
      </div>
      <div className="mgmt-actions">
        <button className="mgmt-btn mgmt-btn--save" onClick={onSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar plano'}
        </button>
        <button className="mgmt-btn mgmt-btn--ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

function ClubePanel() {
  const [plans, setPlans] = useState([])
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('plans').select('*').order('sort_order')
    setPlans(data || [])
  }

  function startNew() {
    setEditing('new')
    setDraft({ name: '', tagline: '', features_text: '', cta_text: '', cta_phone: '', cta_message: '', highlight: false, active: true, sort_order: plans.length + 1 })
    setMsg('')
  }

  function startEdit(p) {
    setEditing(p.id)
    setDraft({ ...p, features_text: (p.features || []).join('\n') })
    setMsg('')
  }

  async function save() {
    setSaving(true)
    const payload = {
      name: draft.name,
      slug: draft.slug || draft.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'),
      tagline: draft.tagline,
      features: (draft.features_text || '').split('\n').map(f => f.trim()).filter(Boolean),
      cta_text: draft.cta_text,
      cta_phone: draft.cta_phone,
      cta_message: draft.cta_message,
      highlight: draft.highlight,
      active: draft.active !== false,
      sort_order: Number(draft.sort_order) || 0,
    }
    const { error } = editing === 'new'
      ? await supabase.from('plans').insert(payload)
      : await supabase.from('plans').update(payload).eq('id', editing)
    setSaving(false)
    if (error) { setMsg('Erro ao salvar.'); return }
    setEditing(null)
    setMsg(editing === 'new' ? 'Plano criado!' : 'Plano atualizado!')
    load()
    setTimeout(() => setMsg(''), 2500)
  }

  async function deletePlan(id) {
    if (!confirm('Excluir este plano?')) return
    await supabase.from('plans').delete().eq('id', id); load()
  }

  return (
    <div className="mgmt-panel">
      {msg && <div className="mgmt-toast">{msg}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="mgmt-btn mgmt-btn--save" onClick={startNew}>+ Novo Plano</button>
      </div>
      {editing === 'new' && (
        <div className="mgmt-group">
          <div className="mgmt-group__title">Novo Plano</div>
          <PlanForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}
      {plans.map(p => (
        <div key={p.id} className={`mgmt-plan-card${p.highlight ? ' mgmt-plan-card--highlight' : ''}`}>
          {editing === p.id ? (
            <>
              <div className="mgmt-group__title" style={{ padding: '0.625rem 1rem', borderBottom: '2px solid var(--border)' }}>Editando: {p.name}</div>
              <PlanForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setEditing(null)} saving={saving} />
            </>
          ) : (
            <div style={{ padding: '1rem' }}>
              <div className="mgmt-plan-card__header">
                <div>
                  <div className="mgmt-plan-card__name">{p.name}</div>
                  <div className="mgmt-barber-card__speciality" style={{ marginBottom: 0 }}>{p.tagline}</div>
                </div>
                {p.highlight && <span className="mgmt-badge" style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>destaque</span>}
              </div>
              <ul className="mgmt-plan-card__features">
                {(p.features || []).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <div className="mgmt-actions" style={{ marginTop: '0.75rem' }}>
                <button className="mgmt-edit-btn" onClick={() => startEdit(p)}>Editar</button>
                <button className="mgmt-btn mgmt-btn--ghost" onClick={() => deletePlan(p.id)}>Excluir</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {plans.length === 0 && !editing && (
        <div className="mgmt-empty">Nenhum plano cadastrado. Clique em "+ Novo Plano" para começar.</div>
      )}
    </div>
  )
}

// ── ADMIN (main) ───────────────────────────────────────────────
export default function Admin({ barber }) {
  const [tab,      setTab]      = useState('hoje')
  const [bookings, setBookings] = useState([])
  const [allBarbers, setAllBarbers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('todos')
  const [search,   setSearch]   = useState('')

  const today = new Date().toISOString().split('T')[0]
  const isBookingTab = tab === 'hoje' || tab === 'todos'

  useEffect(() => {
    if (isBookingTab) loadBookings()
  }, [tab])

  async function loadBookings() {
    setLoading(true)
    let bkQuery = supabase.from('bookings')
      .select('*, barbers(name, slug)').order('date').order('time')
    if (tab === 'hoje') bkQuery = bkQuery.eq('date', today)
    const [{ data: bk }, { data: br }] = await Promise.all([
      bkQuery,
      supabase.from('barbers').select('*').order('sort_order'),
    ])
    setBookings(bk || [])
    setAllBarbers(br || [])
    setLoading(false)
  }

  async function advanceStatus(id, current) {
    const next = STATUS_CYCLE[current]
    if (next === current) return
    await supabase.from('bookings').update({ status: next }).eq('id', id)
    loadBookings()
  }

  async function cancelBooking(id) {
    if (!confirm('Cancelar este agendamento?')) return
    await supabase.from('bookings').update({ status: 'cancelado' }).eq('id', id)
    loadBookings()
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

  const NAV = [
    { icon: '📅', label: 'Hoje',       value: 'hoje' },
    { icon: '📋', label: 'Todos',      value: 'todos' },
    { icon: '📊', label: 'Analytics',  value: 'analytics' },
    { icon: '📆', label: 'Agenda',     value: 'agenda' },
    { icon: '✂️', label: 'Serviços',   value: 'servicos' },
    { icon: '👤', label: 'Equipe',     value: 'equipe' },
    { icon: '🏆', label: 'Clube',      value: 'clube' },
    { icon: '⚙️', label: 'Config',     value: 'config' },
  ]

  const TAB_TITLE = {
    hoje:      `Hoje — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
    todos:     'Todos os agendamentos',
    analytics: 'Analytics',
    agenda:    'Disponibilidade por Barbeiro',
    servicos:  'Serviços & Preços',
    equipe:    'Equipe',
    clube:     'Clube de Assinaturas',
    config:    'Configurações',
  }

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/logo-semfundo.png" alt="MK e BALÃO" />
          <div className="admin-sidebar__label">Admin</div>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV.map(n => (
            <button key={n.value} className={`nav-item${tab === n.value ? ' active' : ''}`} onClick={() => setTab(n.value)}>
              <span className="nav-item__icon">{n.icon}</span>
              {n.label}
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
          <div className="admin-topbar__title">{TAB_TITLE[tab]}</div>
        </div>

        <div className="admin-body">

          {/* ── Agendamentos ── */}
          {isBookingTab && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-label">Agendamentos</div>
                  <div className="kpi-value">{kpi.total}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Confirmados</div>
                  <div className="kpi-value">{kpi.confirmado}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Receita</div>
                  <div className="kpi-value kpi-value--gold">R$ {kpi.receita.toFixed(2).replace('.', ',')}</div>
                </div>
              </div>

              <div className="admin-filters">
                <button className={`filter-chip${filter === 'todos' ? ' active' : ''}`} onClick={() => setFilter('todos')}>Todos</button>
                {allBarbers.filter(b => b.role !== 'admin').map(b => (
                  <button key={b.id} className={`filter-chip${filter === b.slug ? ' active' : ''}`}
                    onClick={() => setFilter(b.slug)}>
                    {b.name.split(' ')[0]}
                  </button>
                ))}
                <div className="admin-search-wrap">
                  <input
                    className="admin-search-input"
                    type="text" value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou telefone…"
                  />
                  {search && <button className="admin-search-clear" onClick={() => setSearch('')}>×</button>}
                </div>
              </div>

              {loading ? (
                <div className="admin-loading">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="admin-empty">{search ? 'Nenhum resultado para a busca.' : 'Nenhum agendamento encontrado.'}</div>
              ) : (
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
                            <a href={`https://wa.me/55${b.client_phone}`} target="_blank" rel="noreferrer"
                              className="td-phone">{b.client_phone}</a>
                          </td>
                          <td>{b.barbers?.name}</td>
                          <td className="td-svc">
                            {Array.isArray(b.services) ? b.services.map(s => s.name).join(', ') : '—'}
                          </td>
                          <td className="td-total">R$ {Number(b.total).toFixed(2).replace('.', ',')}</td>
                          <td><span className={`pill pill--${b.status}`}>{STATUS_LABEL[b.status]}</span></td>
                          <td>
                            <div className="td-actions">
                              {b.status !== 'cancelado' && b.status !== 'concluido' && (
                                <button className="action-btn-sm" onClick={() => advanceStatus(b.id, b.status)}>Avançar →</button>
                              )}
                              {b.status !== 'cancelado' && (
                                <button className="action-btn-sm action-btn-sm--danger" onClick={() => cancelBooking(b.id)}>Cancelar</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'analytics' && <AnalyticsPanel />}
          {tab === 'agenda'    && <AgendaPanel />}
          {tab === 'servicos'  && <ServicosPanel />}
          {tab === 'equipe'    && <EquipePanel />}
          {tab === 'clube'     && <ClubePanel />}
          {tab === 'config'    && <ConfigPanel />}
        </div>
      </main>
    </div>
  )
}
