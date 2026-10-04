import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_LABEL = { pendente: 'Pendente', pago: 'Pago', cancelado: 'Cancelado' }

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

function buildWaMsg(fiado) {
  const phone = fiado.client_phone.replace(/\D/g, '')
  const full = phone.startsWith('55') ? phone : `55${phone}`
  const due  = new Date(fiado.due_date + 'T12:00:00').toLocaleDateString('pt-BR')
  const val  = Number(fiado.amount).toFixed(2).replace('.', ',')
  const msg = [
    `Olá ${fiado.client_name}! 👋`,
    ``,
    `Passando para lembrar que o serviço *${fiado.service_desc}* ficou em aberto.`,
    ``,
    `💈 Valor: R$ ${val}`,
    `📅 Vencimento: ${due}`,
    ``,
    `Qualquer dúvida é só falar! Obrigado.`,
    `— MK e BALÃO Barbearia ✂️`,
  ].join('\n')
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`
}

const EMPTY_FORM = {
  client_name: '', client_phone: '', service_desc: '',
  service_date: today(), due_date: '', amount: '', notes: '',
}

export default function FiadoPanel({ barber, isAdmin = false }) {
  const [fiados,      setFiados]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [formOpen,    setFormOpen]    = useState(false)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState(null)
  const [filter,      setFilter]      = useState('pendente')
  const [search,      setSearch]      = useState('')
  const [actionState, setActionState] = useState({})
  const [allBarbers,  setAllBarbers]  = useState([])

  const todayStr = today()

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    let q = supabase.from('fiados').select('*, barbers(name, slug)').order('due_date')
    if (filter !== 'todos') q = q.eq('status', filter)
    if (!isAdmin && barber?.id) q = q.eq('barber_id', barber.id)
    const { data } = await q
    setFiados(data || [])
    setLoading(false)

    if (isAdmin) {
      const { data: br } = await supabase.from('barbers').select('id, name, slug').neq('role', 'admin').order('sort_order')
      setAllBarbers(br || [])
    }
  }

  async function save() {
    setSaveError(null)
    if (!form.client_name.trim()) { setSaveError('Nome do cliente obrigatório.'); return }
    if (!form.client_phone.trim()) { setSaveError('Telefone obrigatório.'); return }
    if (!form.service_desc.trim()) { setSaveError('Serviço obrigatório.'); return }
    if (!form.due_date) { setSaveError('Data de vencimento obrigatória.'); return }

    setSaving(true)
    const payload = {
      barber_id:    isAdmin ? (form.barber_id || barber?.id) : barber?.id,
      client_name:  form.client_name.trim(),
      client_phone: form.client_phone.trim(),
      service_desc: form.service_desc.trim(),
      service_date: form.service_date,
      due_date:     form.due_date,
      amount:       Number(form.amount) || 0,
      notes:        form.notes.trim() || null,
      status:       'pendente',
    }
    const { error } = await supabase.from('fiados').insert(payload)
    setSaving(false)
    if (error) { setSaveError('Erro ao salvar. Tente novamente.'); return }
    setForm(EMPTY_FORM)
    setFormOpen(false)
    setFilter('pendente')
    load()
  }

  async function markPago(id) {
    setActionState(s => ({ ...s, [id]: 'loading' }))
    const { error } = await supabase.from('fiados').update({ status: 'pago' }).eq('id', id)
    if (error) {
      setActionState(s => ({ ...s, [id]: 'error' }))
      setTimeout(() => setActionState(s => ({ ...s, [id]: null })), 3000)
    } else {
      setActionState(s => ({ ...s, [id]: null }))
      load()
    }
  }

  async function markCancelado(id) {
    if (!window.confirm('Cancelar este fiado?')) return
    setActionState(s => ({ ...s, [id]: 'loading' }))
    const { error } = await supabase.from('fiados').update({ status: 'cancelado' }).eq('id', id)
    if (error) {
      setActionState(s => ({ ...s, [id]: 'error' }))
      setTimeout(() => setActionState(s => ({ ...s, [id]: null })), 3000)
    } else {
      setActionState(s => ({ ...s, [id]: null }))
      load()
    }
  }

  // Fiados vencendo hoje (status pendente)
  const vencendoHoje = fiados.filter(f => f.due_date === todayStr && f.status === 'pendente')
  // Fiados já vencidos (due_date < hoje, status pendente)
  const vencidos     = fiados.filter(f => f.due_date < todayStr  && f.status === 'pendente')

  const totalPendente = fiados
    .filter(f => f.status === 'pendente')
    .reduce((s, f) => s + Number(f.amount), 0)

  return (
    <div className="fiado-panel">

      {/* ── Banner vencimentos hoje ── */}
      {vencendoHoje.length > 0 && (
        <div className="fiado-alert fiado-alert--today">
          <span className="fiado-alert__icon">⏰</span>
          <span className="fiado-alert__text">
            <strong>{vencendoHoje.length} fiado{vencendoHoje.length > 1 ? 's' : ''} vence{vencendoHoje.length > 1 ? 'm' : ''} hoje!</strong>
            {' '}Clique em "WA" para cobrar.
          </span>
        </div>
      )}

      {/* ── Banner fiados vencidos ── */}
      {vencidos.length > 0 && (
        <div className="fiado-alert fiado-alert--overdue">
          <span className="fiado-alert__icon">🔴</span>
          <span className="fiado-alert__text">
            <strong>{vencidos.length} fiado{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''}</strong>
            {' '}— em atraso.
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="fiado-header">
        <div>
          <div className="fiado-header__title">📋 Fiado</div>
          {totalPendente > 0 && (
            <div className="fiado-header__total">
              Total pendente: <strong>R$ {totalPendente.toFixed(2).replace('.', ',')}</strong>
            </div>
          )}
        </div>
        <button className="fiado-add-btn" onClick={() => { setFormOpen(v => !v); setSaveError(null) }}>
          {formOpen ? '✕ Fechar' : '+ Novo Fiado'}
        </button>
      </div>

      {/* ── Formulário ── */}
      {formOpen && (
        <div className="fiado-form">
          <div className="fiado-form__title">Novo lançamento</div>

          <div className="fiado-form__grid">
            <div className="fiado-form__field">
              <label>Nome do cliente *</label>
              <input
                value={form.client_name}
                onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="fiado-form__field">
              <label>Telefone *</label>
              <input
                value={form.client_phone}
                onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                inputMode="tel"
              />
            </div>
            <div className="fiado-form__field fiado-form__field--wide">
              <label>Serviço *</label>
              <input
                value={form.service_desc}
                onChange={e => setForm(f => ({ ...f, service_desc: e.target.value }))}
                placeholder="Ex: Corte Fade + Sobrancelha"
              />
            </div>
            <div className="fiado-form__field">
              <label>Data do serviço *</label>
              <input
                type="date"
                value={form.service_date}
                onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))}
              />
            </div>
            <div className="fiado-form__field">
              <label>Data de vencimento *</label>
              <input
                type="date"
                value={form.due_date}
                min={todayStr}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div className="fiado-form__field">
              <label>Valor (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            {isAdmin && allBarbers.length > 0 && (
              <div className="fiado-form__field">
                <label>Barbeiro</label>
                <select
                  value={form.barber_id || ''}
                  onChange={e => setForm(f => ({ ...f, barber_id: e.target.value }))}
                >
                  <option value="">Selecionar…</option>
                  {allBarbers.map(b => (
                    <option key={b.id} value={b.id}>{b.name.split(' ')[0]}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="fiado-form__field fiado-form__field--wide">
              <label>Observações</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Opcional — ex: cliente vai pagar no dia 10"
              />
            </div>
          </div>

          {saveError && <div className="fiado-form__error">{saveError}</div>}

          <div className="fiado-form__footer">
            <button className="fiado-form__cancel" onClick={() => { setFormOpen(false); setSaveError(null) }}>
              Cancelar
            </button>
            <button className="fiado-form__save" onClick={save} disabled={saving}>
              {saving ? 'Salvando…' : '✓ Registrar Fiado'}
            </button>
          </div>
        </div>
      )}

      {/* ── Filtros + Busca ── */}
      <div className="fiado-filters">
        {['pendente', 'pago', 'cancelado', 'todos'].map(s => (
          <button
            key={s}
            className={`fiado-filter-chip${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="fiado-search">
        <input
          className="fiado-search__input"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome do cliente…"
        />
        {search && (
          <button className="fiado-search__clear" onClick={() => setSearch('')} aria-label="Limpar busca">✕</button>
        )}
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" />Carregando…</div>
      ) : fiados.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__icon">📋</div>
          <div className="admin-empty__text">Nenhum fiado {filter !== 'todos' ? STATUS_LABEL[filter].toLowerCase() : ''} registrado.</div>
        </div>
      ) : (
        <div className="fiado-list">
          {fiados.filter(f => !search || f.client_name.toLowerCase().includes(search.toLowerCase())).map(f => {
            const overdue   = f.due_date < todayStr && f.status === 'pendente'
            const dueToday  = f.due_date === todayStr && f.status === 'pendente'
            const dueLabel  = new Date(f.due_date + 'T12:00:00').toLocaleDateString('pt-BR')
            const svcLabel  = new Date(f.service_date + 'T12:00:00').toLocaleDateString('pt-BR')
            return (
              <div
                key={f.id}
                className={`fiado-card${overdue ? ' fiado-card--overdue' : ''}${dueToday ? ' fiado-card--today' : ''}${f.status === 'pago' ? ' fiado-card--pago' : ''}${f.status === 'cancelado' ? ' fiado-card--cancelado' : ''}`}
              >
                <div className="fiado-card__head">
                  <div className="fiado-card__client">{f.client_name}</div>
                  <span className={`fiado-status fiado-status--${f.status}`}>
                    {overdue ? '⚠️ Vencido' : dueToday ? '⏰ Hoje' : STATUS_LABEL[f.status]}
                  </span>
                </div>

                <div className="fiado-card__service">{f.service_desc}</div>

                <div className="fiado-card__meta">
                  <span>📅 Serviço: {svcLabel}</span>
                  <span>🗓 Vence: {dueLabel}</span>
                  {isAdmin && f.barbers && <span>✂️ {f.barbers.name?.split(' ')[0]}</span>}
                </div>

                {f.notes && <div className="fiado-card__notes">{f.notes}</div>}

                <div className="fiado-card__foot">
                  <div className="fiado-card__amount">
                    R$ {Number(f.amount).toFixed(2).replace('.', ',')}
                  </div>
                  <div className="fiado-card__actions">
                    {/* WA cobrança */}
                    {f.status === 'pendente' && (
                      <a
                        href={buildWaMsg(f)}
                        target="_blank"
                        rel="noreferrer"
                        className="fiado-btn fiado-btn--wa"
                        aria-label="Cobrar via WhatsApp"
                      >
                        📱 WA
                      </a>
                    )}
                    {/* Marcar pago */}
                    {f.status === 'pendente' && (
                      <button
                        className={`fiado-btn fiado-btn--pago${actionState[f.id] === 'error' ? ' fiado-btn--error' : ''}`}
                        onClick={() => markPago(f.id)}
                        disabled={actionState[f.id] === 'loading'}
                      >
                        {actionState[f.id] === 'loading' ? '…' : actionState[f.id] === 'error' ? 'Erro' : '✓ Pago'}
                      </button>
                    )}
                    {/* Cancelar */}
                    {f.status === 'pendente' && (
                      <button
                        className="fiado-btn fiado-btn--cancel"
                        onClick={() => markCancelado(f.id)}
                        disabled={actionState[f.id] === 'loading'}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
