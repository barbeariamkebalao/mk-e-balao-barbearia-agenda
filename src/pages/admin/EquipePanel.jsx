import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY_DRAFT = {
  name: '', slug: '', phone: '', speciality: '', bio: '', quote: '',
  interval_minutes: 50, sort_order: 0, active: true,
}

function toSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function EquipePanel() {
  const [barbers,   setBarbers]   = useState([])
  const [editing,   setEditing]   = useState(null) // id or 'new'
  const [draft,     setDraft]     = useState({})
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState('')
  const [newInfo,   setNewInfo]   = useState(null) // slug of newly created barber
  const fileRef = useRef()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('barbers').select('*').order('sort_order')
    setBarbers((data || []).filter(b => b.role !== 'admin'))
  }

  function startNew() {
    setEditing('new')
    setDraft({ ...EMPTY_DRAFT, sort_order: barbers.length + 1 })
    setMsg('')
    setNewInfo(null)
  }

  function startEdit(b) {
    setEditing(b.id)
    setDraft({
      name: b.name || '', slug: b.slug || '', phone: b.phone || '',
      speciality: b.speciality || '', bio: b.bio || '', quote: b.quote || '',
      avatar_url: b.avatar_url || '', interval_minutes: b.interval_minutes || 50,
      sort_order: b.sort_order || 0, active: b.active !== false,
    })
    setMsg('')
    setNewInfo(null)
  }

  function cancel() {
    setEditing(null)
    setDraft({})
    setMsg('')
  }

  async function uploadPhoto(file) {
    if (!file.type.startsWith('image/')) { setMsg('Arquivo inválido. Envie uma imagem (JPG, PNG, etc.).'); return }
    if (file.size > 5 * 1024 * 1024)    { setMsg('Imagem muito grande. Limite: 5 MB.'); return }
    const slug = draft.slug || (editing !== 'new' ? barbers.find(x => x.id === editing)?.slug : null)
    if (!slug) { setMsg('Salve o barbeiro primeiro para poder enviar a foto.'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `barbeiro-${slug}.${ext}`
    const { error } = await supabase.storage.from('barber-images').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { setMsg('Erro no upload.'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('barber-images').getPublicUrl(path)
    setDraft(d => ({ ...d, avatar_url: publicUrl }))
    setUploading(false)
    setMsg('Foto carregada — clique em Salvar para confirmar.')
  }

  async function saveNew() {
    if (!draft.name.trim()) { setMsg('Nome é obrigatório.'); return }
    if (!draft.slug.trim()) { setMsg('Slug é obrigatório.'); return }
    setSaving(true)

    const payload = {
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      phone: draft.phone.trim() || null,
      speciality: draft.speciality.trim() || null,
      bio: draft.bio.trim() || null,
      quote: draft.quote.trim() || null,
      avatar_url: draft.avatar_url || null,
      interval_minutes: Number(draft.interval_minutes) || 50,
      sort_order: Number(draft.sort_order) || 0,
      active: draft.active,
      role: 'barber',
    }

    const { data: newBarber, error } = await supabase
      .from('barbers').insert(payload).select().single()

    if (error) {
      setSaving(false)
      setMsg(error.code === '23505' ? 'Esse slug já existe. Escolha outro.' : 'Erro ao criar barbeiro.')
      return
    }

    // Auto-cria disponibilidade Seg–Sáb 09:00–19:00
    const availRows = [1, 2, 3, 4, 5, 6].map(day => ({
      barber_id: newBarber.id, day_of_week: day,
      start_time: '09:00', end_time: day === 6 ? '20:00' : '19:00', active: true,
    }))
    await supabase.from('availability').insert(availRows)

    setSaving(false)
    setEditing(null)
    setNewInfo(newBarber.slug)
    load()
    setTimeout(() => setNewInfo(null), 12000)
  }

  async function saveEdit(id) {
    setSaving(true)
    const { error } = await supabase.from('barbers').update({
      name: draft.name.trim(),
      phone: draft.phone.trim() || null,
      speciality: draft.speciality.trim() || null,
      bio: draft.bio.trim() || null,
      quote: draft.quote.trim() || null,
      avatar_url: draft.avatar_url || null,
      interval_minutes: Number(draft.interval_minutes) || 50,
      sort_order: Number(draft.sort_order) || 0,
      active: draft.active,
    }).eq('id', id)
    setSaving(false)
    if (error) { setMsg('Erro ao salvar.'); return }
    setEditing(null); setMsg('Perfil atualizado!'); load()
    setTimeout(() => setMsg(''), 2500)
  }

  async function toggleActive(b) {
    await supabase.from('barbers').update({ active: !b.active }).eq('id', b.id)
    load()
  }

  async function deleteBarber(b) {
    if (!confirm(`Excluir ${b.name}? Esta ação remove o barbeiro e não pode ser desfeita.`)) return
    await supabase.from('barbers').delete().eq('id', b.id)
    setMsg(`${b.name} removido.`)
    load()
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="mgmt-panel">
      {msg && <div className="mgmt-toast">{msg}</div>}

      {newInfo && (
        <div className="mgmt-info-banner">
          <strong>✓ Barbeiro criado!</strong> Já aparece no agendamento em{' '}
          <code>/agendar/{newInfo}</code>. Disponibilidade Seg–Sáb criada automaticamente.
          <br />
          <span style={{ color: 'rgba(244,244,242,0.5)', fontSize: '0.75rem' }}>
            Para habilitar login no painel: crie o usuário no Supabase Dashboard → Authentication → Users,
            depois execute: <code>UPDATE barbers SET user_id = 'uuid' WHERE slug = '{newInfo}';</code>
          </span>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) uploadPhoto(f); e.target.value = '' }} />

      {/* Botão criar */}
      {editing !== 'new' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button className="mgmt-btn mgmt-btn--save" onClick={startNew}>+ Novo Barbeiro</button>
        </div>
      )}

      {/* Form: novo barbeiro */}
      {editing === 'new' && (
        <div className="mgmt-group">
          <div className="mgmt-group__title">Novo Barbeiro</div>
          <div className="mgmt-edit-form" style={{ padding: '1rem' }}>
            <div className="mgmt-field-row">
              <div className="mgmt-field">
                <label>Nome completo *</label>
                <input
                  value={draft.name}
                  onChange={e => {
                    const name = e.target.value
                    setDraft(d => ({ ...d, name, slug: toSlug(name) }))
                  }}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="mgmt-field">
                <label>Slug (URL) *</label>
                <input
                  value={draft.slug}
                  onChange={e => setDraft(d => ({ ...d, slug: toSlug(e.target.value) }))}
                  placeholder="joao-silva"
                />
              </div>
            </div>
            <div className="mgmt-field-row">
              <div className="mgmt-field">
                <label>WhatsApp (com DDI+DDD)</label>
                <input value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="5514999999999" />
              </div>
              <div className="mgmt-field">
                <label>Especialidade</label>
                <input value={draft.speciality} onChange={e => setDraft(d => ({ ...d, speciality: e.target.value }))} placeholder="Corte + Barba" />
              </div>
            </div>
            <div className="mgmt-field-row">
              <div className="mgmt-field">
                <label>Intervalo entre atend.</label>
                <select value={draft.interval_minutes} onChange={e => setDraft(d => ({ ...d, interval_minutes: Number(e.target.value) }))}>
                  <option value={30}>30 min</option>
                  <option value={40}>40 min</option>
                  <option value={50}>50 min</option>
                  <option value={60}>60 min (1h)</option>
                </select>
              </div>
              <div className="mgmt-field">
                <label>Ordem na listagem</label>
                <input type="number" min="0" value={draft.sort_order}
                  onChange={e => setDraft(d => ({ ...d, sort_order: e.target.value }))} />
              </div>
            </div>
            <div className="mgmt-field mgmt-field--full">
              <label>Frase do barbeiro</label>
              <input value={draft.quote} onChange={e => setDraft(d => ({ ...d, quote: e.target.value }))} placeholder='"Transformo cabelo em estilo."' />
            </div>
            <div className="mgmt-field mgmt-field--full">
              <label>Bio</label>
              <textarea value={draft.bio} rows={2} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} placeholder="Breve apresentação do barbeiro" />
            </div>
            <div className="mgmt-actions">
              <button className="mgmt-btn mgmt-btn--save" onClick={saveNew} disabled={saving || !draft.name || !draft.slug}>
                {saving ? 'Criando…' : 'Criar Barbeiro'}
              </button>
              <button className="mgmt-btn mgmt-btn--ghost" onClick={cancel}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de barbeiros existentes */}
      {barbers.map(b => (
        <div key={b.id} className={`mgmt-barber-card${!b.active ? ' mgmt-barber-card--inactive' : ''}`}>
          <div className="mgmt-barber-card__avatar">
            <img
              src={editing === b.id ? draft.avatar_url || b.avatar_url : b.avatar_url}
              alt={b.name}
              onError={e => { e.target.src = '/logo-escudo.jpg' }}
            />
            {editing === b.id && (
              <button className="mgmt-photo-btn" onClick={() => fileRef.current.click()} disabled={uploading} title="Trocar foto">
                {uploading ? '…' : '📷'}
              </button>
            )}
          </div>
          <div className="mgmt-barber-card__body">
            <div className="mgmt-barber-card__name">
              {b.name}
              {!b.active && <span className="mgmt-badge" style={{ color: 'var(--dim)', borderColor: 'var(--border)', marginLeft: '0.5rem' }}>inativo</span>}
              {!b.user_id && <span className="mgmt-badge" style={{ color: 'rgba(244,244,242,0.35)', borderColor: 'rgba(244,244,242,0.15)', marginLeft: '0.5rem' }}>sem login</span>}
            </div>

            {editing === b.id ? (
              <div className="mgmt-edit-form">
                <div className="mgmt-field-row">
                  <div className="mgmt-field">
                    <label>Nome</label>
                    <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div className="mgmt-field">
                    <label>WhatsApp</label>
                    <input value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="5514999999999" />
                  </div>
                </div>
                <div className="mgmt-field-row">
                  <div className="mgmt-field">
                    <label>Especialidade</label>
                    <input value={draft.speciality} onChange={e => setDraft(d => ({ ...d, speciality: e.target.value }))} />
                  </div>
                  <div className="mgmt-field">
                    <label>Intervalo entre atend.</label>
                    <select value={draft.interval_minutes} onChange={e => setDraft(d => ({ ...d, interval_minutes: Number(e.target.value) }))}>
                      <option value={30}>30 min</option>
                      <option value={40}>40 min</option>
                      <option value={50}>50 min</option>
                      <option value={60}>60 min (1h)</option>
                    </select>
                  </div>
                </div>
                <div className="mgmt-field mgmt-field--full">
                  <label>Frase do barbeiro</label>
                  <input value={draft.quote} onChange={e => setDraft(d => ({ ...d, quote: e.target.value }))} />
                </div>
                <div className="mgmt-field mgmt-field--full">
                  <label>Bio</label>
                  <textarea value={draft.bio} rows={3} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} />
                </div>
                <div className="mgmt-field-row">
                  <div className="mgmt-field">
                    <label>Ordem</label>
                    <input type="number" min="0" value={draft.sort_order}
                      onChange={e => setDraft(d => ({ ...d, sort_order: e.target.value }))} />
                  </div>
                  <div className="mgmt-field" style={{ justifyContent: 'flex-end' }}>
                    <label>&nbsp;</label>
                    <label className="mgmt-toggle">
                      <input type="checkbox" checked={draft.active}
                        onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} />
                      <span>{draft.active ? 'Ativo' : 'Inativo'}</span>
                    </label>
                  </div>
                </div>
                <div className="mgmt-actions">
                  <button className="mgmt-btn mgmt-btn--save" onClick={() => saveEdit(b.id)} disabled={saving}>
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button className="mgmt-btn mgmt-btn--ghost" onClick={cancel}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mgmt-barber-card__speciality">{b.speciality}</div>
                {b.quote && <div className="mgmt-barber-card__quote">"{b.quote}"</div>}
                {b.bio   && <div className="mgmt-barber-card__bio">{b.bio}</div>}
                <div className="mgmt-barber-card__meta">
                  {b.phone && <span>📱 {b.phone}</span>}
                  <span>⏱ {b.interval_minutes || 50} min</span>
                  <span>🔗 /agendar/{b.slug}</span>
                </div>
                <div className="mgmt-actions" style={{ marginTop: '0.75rem' }}>
                  <button className="mgmt-edit-btn" onClick={() => startEdit(b)}>Editar perfil</button>
                  <button className="mgmt-btn mgmt-btn--ghost" onClick={() => toggleActive(b)}>
                    {b.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button className="mgmt-btn mgmt-btn--ghost" style={{ color: 'var(--red)', borderColor: 'rgba(211,43,47,0.4)' }}
                    onClick={() => deleteBarber(b)}>
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      {barbers.length === 0 && editing !== 'new' && (
        <div className="mgmt-empty">Nenhum barbeiro cadastrado.</div>
      )}
    </div>
  )
}
