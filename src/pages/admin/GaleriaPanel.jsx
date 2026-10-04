import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const BUCKET = 'gallery-images'
const MAX_FILE_MB = 5

export default function GaleriaPanel() {
  const [photos,    setPhotos]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [deletingId,setDeletingId]= useState(null)
  const [msg,       setMsg]       = useState('')
  const [msgType,   setMsgType]   = useState('ok')
  const [dragOver,  setDragOver]  = useState(false)
  const inputRef = useRef()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    // Admin usa política que bypassa o active=true do public select
    const { data } = await supabase
      .from('gallery').select('*').order('sort_order').order('created_at')
    setPhotos(data || [])
    setLoading(false)
  }

  function flash(text, type = 'ok') {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 3500)
  }

  // ── Upload ──
  async function uploadFiles(files) {
    if (!files?.length) return
    const validFiles = Array.from(files).filter(f => {
      if (!f.type.startsWith('image/')) { flash(`${f.name}: apenas imagens.`, 'error'); return false }
      if (f.size > MAX_FILE_MB * 1024 * 1024) { flash(`${f.name}: máximo ${MAX_FILE_MB}MB.`, 'error'); return false }
      return true
    })
    if (!validFiles.length) return

    setUploading(true)
    let successCount = 0

    for (const file of validFiles) {
      const ext  = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '31536000', upsert: false,
      })
      if (upErr) { flash(`Erro ao enviar ${file.name}.`, 'error'); continue }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

      const { error: dbErr } = await supabase.from('gallery').insert({
        url:        publicUrl,
        label:      file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        sort_order: photos.length + successCount,
        active:     true,
      })
      if (dbErr) { flash(`Foto enviada mas erro ao salvar: ${dbErr.message}`, 'error'); continue }
      successCount++
    }

    setUploading(false)
    if (successCount > 0) { flash(`${successCount} foto${successCount > 1 ? 's' : ''} adicionada${successCount > 1 ? 's' : ''}!`); load() }
  }

  function onFileInput(e) { uploadFiles(e.target.files); e.target.value = '' }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }

  // ── Editar label ──
  function startEdit(photo) {
    setEditingId(photo.id); setEditLabel(photo.label)
  }

  async function saveLabel(id) {
    const { error } = await supabase.from('gallery').update({ label: editLabel.trim() }).eq('id', id)
    if (error) { flash('Erro ao salvar legenda.', 'error'); return }
    setEditingId(null); flash('Legenda salva!'); load()
  }

  // ── Toggle ativo ──
  async function toggleActive(photo) {
    await supabase.from('gallery').update({ active: !photo.active }).eq('id', photo.id)
    load()
  }

  // ── Reordenar (mover cima/baixo) ──
  async function movePhoto(idx, dir) {
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= photos.length) return
    const a = photos[idx]; const b = photos[swapIdx]
    await Promise.all([
      supabase.from('gallery').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('gallery').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    load()
  }

  // ── Deletar ──
  async function deletePhoto(photo) {
    if (!window.confirm(`Remover "${photo.label}"? A imagem será excluída do storage.`)) return
    setDeletingId(photo.id)

    // Extrai o path do storage a partir da URL pública
    const urlPath = photo.url.split(`${BUCKET}/`)[1]
    if (urlPath) await supabase.storage.from(BUCKET).remove([urlPath])

    const { error } = await supabase.from('gallery').delete().eq('id', photo.id)
    setDeletingId(null)
    if (error) { flash('Erro ao remover.', 'error'); return }
    flash('Foto removida.'); load()
  }

  return (
    <div className="galeria-panel">
      {msg && <div className={`mgmt-toast${msgType === 'error' ? ' mgmt-toast--error' : ''}`}>{msg}</div>}

      {/* ── Header ── */}
      <div className="galeria-panel__header">
        <div>
          <div className="galeria-panel__title">🖼 Trabalhos Recentes</div>
          <div className="galeria-panel__sub">
            {photos.length} foto{photos.length !== 1 ? 's' : ''} · as {photos.filter(p => p.active).length} ativas aparecem no site
          </div>
        </div>
        <button className="mgmt-btn-new" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? '⏳ Enviando…' : '+ Adicionar Fotos'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onFileInput} />
      </div>

      {/* ── Drop zone ── */}
      <div
        className={`galeria-dropzone${dragOver ? ' galeria-dropzone--over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <span className="galeria-dropzone__icon">📸</span>
        <span className="galeria-dropzone__text">
          {uploading ? 'Enviando…' : 'Arraste imagens aqui ou clique para selecionar'}
        </span>
        <span className="galeria-dropzone__hint">JPG, PNG, WEBP · máx {MAX_FILE_MB}MB por arquivo</span>
      </div>

      {/* ── Grid de fotos ── */}
      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" />Carregando…</div>
      ) : photos.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__icon">🖼</div>
          <div className="admin-empty__text">Nenhuma foto ainda.</div>
          <div className="admin-empty__sub">Adicione a primeira foto usando o botão acima.</div>
        </div>
      ) : (
        <div className="galeria-grid">
          {photos.map((photo, idx) => (
            <div key={photo.id} className={`galeria-card${!photo.active ? ' galeria-card--inactive' : ''}`}>

              {/* Imagem */}
              <div className="galeria-card__img-wrap">
                <img src={photo.url} alt={photo.label} className="galeria-card__img" loading="lazy" />
                {!photo.active && <div className="galeria-card__inactive-badge">Oculto</div>}
              </div>

              {/* Label editável */}
              <div className="galeria-card__body">
                {editingId === photo.id ? (
                  <div className="galeria-card__edit">
                    <input
                      className="galeria-card__input"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveLabel(photo.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                    />
                    <button className="galeria-card__save-btn" onClick={() => saveLabel(photo.id)}>✓</button>
                    <button className="galeria-card__cancel-btn" onClick={() => setEditingId(null)}>✕</button>
                  </div>
                ) : (
                  <div className="galeria-card__label" onClick={() => startEdit(photo)} title="Clique para editar">
                    {photo.label || <span className="galeria-card__label--empty">Sem legenda</span>}
                    <span className="galeria-card__edit-hint">✏</span>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="galeria-card__actions">
                <button
                  className="galeria-card__act-btn"
                  onClick={() => movePhoto(idx, -1)}
                  disabled={idx === 0}
                  title="Mover para frente"
                >←</button>
                <button
                  className="galeria-card__act-btn"
                  onClick={() => movePhoto(idx, 1)}
                  disabled={idx === photos.length - 1}
                  title="Mover para trás"
                >→</button>
                <button
                  className={`galeria-card__act-btn${photo.active ? ' galeria-card__act-btn--active' : ' galeria-card__act-btn--inactive'}`}
                  onClick={() => toggleActive(photo)}
                  title={photo.active ? 'Ocultar do site' : 'Mostrar no site'}
                >
                  {photo.active ? '👁 Visível' : '🙈 Oculto'}
                </button>
                <button
                  className="galeria-card__act-btn galeria-card__act-btn--del"
                  onClick={() => deletePhoto(photo)}
                  disabled={deletingId === photo.id}
                  title="Remover foto"
                >
                  {deletingId === photo.id ? '…' : '🗑'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
