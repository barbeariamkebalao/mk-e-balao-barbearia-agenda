import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CAT_LABEL } from './constants'

const CATS = ['cabelo', 'barba', 'combo', 'colorimetria', 'adicional']

const EMPTY_NEW = {
  name: '', slug: '', category: 'cabelo', duration_minutes: 50,
  price: '', price_type: 'fixed', is_addon: false, badge: '', description: '', active: true,
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ServicosPanel() {
  const [services,   setServices]   = useState([])
  const [editing,    setEditing]    = useState(null)   // id being edited
  const [draft,      setDraft]      = useState({})
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(null)   // id being deleted
  const [showNew,    setShowNew]    = useState(false)
  const [newSvc,     setNewSvc]     = useState(EMPTY_NEW)
  const [savingNew,  setSavingNew]  = useState(false)
  const [msg,        setMsg]        = useState('')
  const [msgType,    setMsgType]    = useState('ok')   // 'ok' | 'error'

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('services').select('*').order('sort_order')
    setServices(data || [])
  }

  function flash(text, type = 'ok') {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 3000)
  }

  // ── Editar ──
  function startEdit(svc) {
    setEditing(svc.id)
    setDraft({
      name: svc.name, price: svc.price, price_type: svc.price_type,
      duration_minutes: svc.duration_minutes, description: svc.description || '',
      badge: svc.badge || '', active: svc.active,
    })
  }

  async function saveEdit(id) {
    setSaving(true)
    const { error } = await supabase.from('services').update({
      name:             draft.name,
      price:            Number(draft.price),
      price_type:       draft.price_type,
      duration_minutes: Number(draft.duration_minutes),
      description:      draft.description,
      badge:            draft.badge || null,
      active:           draft.active,
    }).eq('id', id)
    setSaving(false)
    if (error) { flash('Erro ao salvar.', 'error'); return }
    setEditing(null); flash('Salvo!'); load()
  }

  // ── Deletar ──
  async function deleteService(id, name) {
    if (!window.confirm(`Deletar o serviço "${name}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(id)
    const { error } = await supabase.from('services').delete().eq('id', id)
    setDeleting(null)
    if (error) { flash('Erro ao deletar. Verifique se o serviço está vinculado a agendamentos.', 'error'); return }
    flash('Serviço removido.'); load()
  }

  // ── Criar novo ──
  async function createService() {
    if (!newSvc.name.trim())              { flash('Nome obrigatório.', 'error'); return }
    if (!newSvc.duration_minutes || newSvc.duration_minutes < 1)
                                          { flash('Duração obrigatória (mín 1 min).', 'error'); return }
    if (newSvc.price === '' || isNaN(Number(newSvc.price)))
                                          { flash('Preço obrigatório.', 'error'); return }

    const slug = slugify(newSvc.name) || `servico-${Date.now()}`
    setSavingNew(true)
    const { error } = await supabase.from('services').insert({
      name:             newSvc.name.trim(),
      slug,
      category:         newSvc.category,
      duration_minutes: Number(newSvc.duration_minutes),
      price:            Number(newSvc.price),
      price_type:       newSvc.price_type,
      is_addon:         newSvc.is_addon,
      badge:            newSvc.badge.trim() || null,
      description:      newSvc.description.trim() || null,
      active:           true,
    })
    setSavingNew(false)
    if (error) {
      flash(error.code === '23505' ? 'Já existe um serviço com esse nome.' : 'Erro ao criar serviço.', 'error')
      return
    }
    setNewSvc(EMPTY_NEW); setShowNew(false); flash('Serviço criado!'); load()
  }

  const grouped = services.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="mgmt-panel">
      {msg && <div className={`mgmt-toast${msgType === 'error' ? ' mgmt-toast--error' : ''}`}>{msg}</div>}

      {/* ── Botão Novo Serviço ── */}
      <div className="mgmt-panel-header">
        <button className="mgmt-btn-new" onClick={() => { setShowNew(v => !v); setMsg('') }}>
          {showNew ? '✕ Fechar' : '+ Novo Serviço'}
        </button>
      </div>

      {/* ── Formulário de criação ── */}
      {showNew && (
        <div className="mgmt-new-form">
          <div className="mgmt-new-form__title">Novo Serviço</div>
          <div className="mgmt-field-grid">
            <div className="mgmt-field mgmt-field--wide">
              <label>Nome *</label>
              <input
                value={newSvc.name}
                onChange={e => setNewSvc(s => ({ ...s, name: e.target.value }))}
                placeholder="Ex: Corte Clássico"
              />
            </div>
            <div className="mgmt-field">
              <label>Categoria *</label>
              <select value={newSvc.category} onChange={e => setNewSvc(s => ({ ...s, category: e.target.value }))}>
                {CATS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
            </div>
            <div className="mgmt-field">
              <label>Duração (min) *</label>
              <input
                type="number" min="1" step="1"
                value={newSvc.duration_minutes}
                onChange={e => setNewSvc(s => ({ ...s, duration_minutes: e.target.value }))}
              />
            </div>
            <div className="mgmt-field">
              <label>Preço (R$) *</label>
              <input
                type="number" min="0" step="0.01"
                value={newSvc.price}
                onChange={e => setNewSvc(s => ({ ...s, price: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div className="mgmt-field">
              <label>Tipo de preço</label>
              <select value={newSvc.price_type} onChange={e => setNewSvc(s => ({ ...s, price_type: e.target.value }))}>
                <option value="fixed">Fixo</option>
                <option value="from">A partir de</option>
              </select>
            </div>
            <div className="mgmt-field">
              <label>Badge (opcional)</label>
              <input
                value={newSvc.badge}
                onChange={e => setNewSvc(s => ({ ...s, badge: e.target.value }))}
                placeholder="Ex: NOVO, PREMIUM"
              />
            </div>
            <div className="mgmt-field mgmt-field--wide">
              <label>Descrição (opcional)</label>
              <textarea
                rows={2} value={newSvc.description}
                onChange={e => setNewSvc(s => ({ ...s, description: e.target.value }))}
                placeholder="Descrição breve do serviço"
              />
            </div>
            <div className="mgmt-field">
              <label className="mgmt-toggle">
                <input type="checkbox" checked={newSvc.is_addon}
                  onChange={e => setNewSvc(s => ({ ...s, is_addon: e.target.checked }))} />
                <span>Serviço adicional</span>
              </label>
            </div>
          </div>
          <div className="mgmt-actions">
            <button className="mgmt-btn mgmt-btn--save" onClick={createService} disabled={savingNew}>
              {savingNew ? 'Criando…' : '✓ Criar Serviço'}
            </button>
            <button className="mgmt-btn mgmt-btn--ghost" onClick={() => { setShowNew(false); setNewSvc(EMPTY_NEW) }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Lista agrupada por categoria ── */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mgmt-group">
          <div className="mgmt-group__title">{CAT_LABEL[cat] || cat}</div>
          {items.map(svc => (
            <div key={svc.id} className={`mgmt-row${!svc.active ? ' mgmt-row--inactive' : ''}`}>
              <div className="mgmt-row__main">
                <div className="mgmt-row__name">
                  {svc.name}
                  {svc.is_addon && <span className="mgmt-badge">adicional</span>}
                  {svc.badge && <span className="mgmt-badge mgmt-badge--gold">{svc.badge}</span>}
                </div>

                {editing === svc.id ? (
                  <div className="mgmt-edit-form">
                    <div className="mgmt-field-row">
                      <div className="mgmt-field">
                        <label>Nome</label>
                        <input value={draft.name}
                          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div className="mgmt-field">
                        <label>Duração (min)</label>
                        <input type="number" min="1" value={draft.duration_minutes}
                          onChange={e => setDraft(d => ({ ...d, duration_minutes: e.target.value }))} />
                      </div>
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
                        <label>Badge</label>
                        <input value={draft.badge}
                          onChange={e => setDraft(d => ({ ...d, badge: e.target.value }))}
                          placeholder="Ex: NOVO" />
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
                      <button className="mgmt-btn mgmt-btn--save" onClick={() => saveEdit(svc.id)} disabled={saving}>
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
                  <div className="mgmt-row__dur">{svc.duration_minutes} min</div>
                  <span className={`pill pill--${svc.active ? 'confirmado' : 'cancelado'}`}>
                    {svc.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button className="mgmt-edit-btn" onClick={() => startEdit(svc)}>Editar</button>
                  <button
                    className="mgmt-del-btn"
                    onClick={() => deleteService(svc.id, svc.name)}
                    disabled={deleting === svc.id}
                    title="Remover serviço"
                  >
                    {deleting === svc.id ? '…' : '✕'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
