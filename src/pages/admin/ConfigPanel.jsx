import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

export default function ConfigPanel() {
  const [settings,      setSettings]      = useState(null)
  const [blocked,       setBlocked]       = useState([])
  const [barbers,       setBarbers]       = useState([])
  const [newDate,       setNewDate]       = useState('')
  const [newReason,     setNewReason]     = useState('')
  const [newBarber,     setNewBarber]     = useState('')
  const [saving,        setSaving]        = useState(false)
  const [msg,           setMsg]           = useState('')
  const [creds,         setCreds]         = useState([])
  const [newCred,       setNewCred]       = useState({ label: '', username: '', password: '', url: '' })
  const [savingCreds,   setSavingCreds]   = useState(false)
  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: bd }, { data: br }] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('blocked_dates').select('*').order('date'),
      supabase.from('barbers').select('id, name, slug').neq('role', 'admin').order('sort_order'),
    ])
    setSettings(s || {})
    setBlocked(bd || [])
    setBarbers(br || [])
    setCreds(Array.isArray(s?.credentials_json) ? s.credentials_json : [])
  }

  async function saveCredentials(updated) {
    setSavingCreds(true)
    const { error } = await supabase.from('settings').update({ credentials_json: updated }).eq('id', 1)
    setSavingCreds(false)
    if (error) { setMsg('Erro ao salvar credenciais.'); return }
    setCreds(updated)
    setMsg('Credenciais salvas!')
    setTimeout(() => setMsg(''), 2500)
  }

  function addCred() {
    if (!newCred.label || !newCred.username) return
    const updated = [...creds, { ...newCred }]
    setNewCred({ label: '', username: '', password: '', url: '' })
    saveCredentials(updated)
  }

  function removeCred(idx) {
    if (!confirm('Remover esta credencial?')) return
    saveCredentials(creds.filter((_, i) => i !== idx))
  }

  function togglePass(idx) {
    setShowPasswords(p => ({ ...p, [idx]: !p[idx] }))
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
    const barber_id = newBarber || null
    await supabase.from('blocked_dates').insert({ barber_id, date: newDate, reason: newReason || null })
    setNewDate(''); setNewReason(''); setNewBarber(''); load()
  }

  async function removeBlocked(id) {
    if (!confirm('Remover este bloqueio?')) return
    await supabase.from('blocked_dates').delete().eq('id', id); load()
  }

  if (!settings) return <div className="admin-loading">Carregando…</div>

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
        <div className="mgmt-group__title">Dias Bloqueados</div>
        <div className="mgmt-blocked-form">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          <select
            value={newBarber}
            onChange={e => setNewBarber(e.target.value)}
            style={{ fontFamily: 'var(--font-heading)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.45rem 0.625rem', background: 'var(--surface)', border: '1px solid var(--border)', color: newBarber ? 'var(--chalk)' : 'rgba(244,244,242,0.45)', cursor: 'pointer' }}
          >
            <option value="">Barbearia toda</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name.split(' ')[0]}</option>)}
          </select>
          <input type="text" placeholder="Motivo (ex: Feriado, Férias…)" value={newReason}
            onChange={e => setNewReason(e.target.value)} />
          <button className="mgmt-btn mgmt-btn--save" onClick={addBlocked}>+ Bloquear</button>
        </div>
        {blocked.length === 0 ? (
          <div className="mgmt-empty">Nenhum dia bloqueado no momento.</div>
        ) : (
          <div className="mgmt-blocked-list">
            {blocked.map(bd => {
              const barberName = bd.barber_id
                ? (barbers.find(b => b.id === bd.barber_id)?.name?.split(' ')[0] || '?')
                : null
              return (
                <div key={bd.id} className="mgmt-blocked-item">
                  <span className="mgmt-blocked-date">
                    {new Date(bd.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  {barberName
                    ? <span className="mgmt-blocked-barber">{barberName}</span>
                    : <span className="mgmt-blocked-barber" style={{ color: 'rgba(244,244,242,0.3)' }}>Todos</span>
                  }
                  <span className="mgmt-blocked-reason">{bd.reason || '—'}</span>
                  <button className="mgmt-remove-btn" onClick={() => removeBlocked(bd.id)}>×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Credenciais digitais */}
      <div className="mgmt-group">
        <div className="mgmt-group__title">Acesso Digital — Credenciais</div>
        {creds.length === 0 ? (
          <div className="mgmt-empty" style={{ margin: '0 1rem 0.75rem' }}>Nenhuma credencial cadastrada.</div>
        ) : (
          <div className="cred-list">
            {creds.map((c, i) => (
              <div key={i} className="cred-row">
                <div className="cred-row__info">
                  <span className="cred-row__label">{c.label}</span>
                  <span className="cred-row__user">{c.username}</span>
                  {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="cred-row__url">{c.url}</a>}
                </div>
                <div className="cred-row__pass">
                  <span className="cred-row__passval">
                    {showPasswords[i] ? c.password : '••••••••'}
                  </span>
                  <button className="mgmt-edit-btn" onClick={() => togglePass(i)}>
                    {showPasswords[i] ? 'Ocultar' : 'Ver'}
                  </button>
                  <button className="mgmt-remove-btn" onClick={() => removeCred(i)}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="cred-add-form">
          <div className="mgmt-field-row">
            <div className="mgmt-field">
              <label>Label</label>
              <input placeholder="ex: Instagram" value={newCred.label}
                onChange={e => setNewCred(d => ({ ...d, label: e.target.value }))} />
            </div>
            <div className="mgmt-field">
              <label>Usuário / Email</label>
              <input placeholder="@usuario ou email" value={newCred.username}
                onChange={e => setNewCred(d => ({ ...d, username: e.target.value }))} />
            </div>
          </div>
          <div className="mgmt-field-row">
            <div className="mgmt-field">
              <label>Senha</label>
              <input type="password" placeholder="••••••" value={newCred.password}
                onChange={e => setNewCred(d => ({ ...d, password: e.target.value }))} />
            </div>
            <div className="mgmt-field">
              <label>URL (opcional)</label>
              <input placeholder="https://..." value={newCred.url}
                onChange={e => setNewCred(d => ({ ...d, url: e.target.value }))} />
            </div>
          </div>
          <div className="mgmt-actions" style={{ padding: '0 0 0.5rem' }}>
            <button className="mgmt-btn mgmt-btn--save" onClick={addCred}
              disabled={savingCreds || !newCred.label || !newCred.username}>
              {savingCreds ? 'Salvando…' : '+ Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
