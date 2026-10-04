import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

export default function ClubePanel() {
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
    if (!draft.name?.trim()) { setMsg('Nome do plano é obrigatório.'); return }
    if (!draft.cta_phone?.trim()) { setMsg('Telefone WhatsApp é obrigatório.'); return }
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
