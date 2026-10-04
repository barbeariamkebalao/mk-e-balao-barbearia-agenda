import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const POSTS = [
  { file: 'post-001.png',                    tag: 'portfolio',  label: 'Post 01' },
  { file: 'post-002.png',                    tag: 'portfolio',  label: 'Post 02' },
  { file: 'post-003.png',                    tag: 'portfolio',  label: 'Post 03' },
  { file: 'post-004.png',                    tag: 'portfolio',  label: 'Post 04' },
  { file: 'post-005.png',                    tag: 'portfolio',  label: 'Post 05' },
  { file: 'post-006.png',                    tag: 'portfolio',  label: 'Post 06' },
  { file: 'post-007.png',                    tag: 'portfolio',  label: 'Post 07' },
  { file: 'post-008.png',                    tag: 'portfolio',  label: 'Post 08' },
  { file: 'post-009.png',                    tag: 'portfolio',  label: 'Post 09' },
  { file: 'post-010.png',                    tag: 'portfolio',  label: 'Post 10' },
  { file: 'post-011.png',                    tag: 'portfolio',  label: 'Post 11' },
  { file: 'post-012.png',                    tag: 'portfolio',  label: 'Post 12' },
  { file: 'post-013.png',                    tag: 'portfolio',  label: 'Post 13' },
  { file: 'post-014.png',                    tag: 'portfolio',  label: 'Post 14' },
  { file: 'post-estamos-esperando-1.png',    tag: 'campanha',   label: 'Estamos Esperando 1' },
  { file: 'post-estamos-esperando-2.png',    tag: 'campanha',   label: 'Estamos Esperando 2' },
  { file: 'post-estamos-esperando-3.png',    tag: 'campanha',   label: 'Estamos Esperando 3' },
  { file: 'post-estamos-esperando-4.png',    tag: 'campanha',   label: 'Estamos Esperando 4' },
  { file: 'post-seja-tratado-como-rei.png',  tag: 'campanha',   label: 'Seja Tratado como Rei' },
  { file: 'post-transforme-seu-estilo.png',  tag: 'campanha',   label: 'Transforme seu Estilo' },
]

export default function Portal({ role = 'barber' }) {
  const navigate    = useNavigate()
  const [filter,    setFilter]    = useState('todos')
  const [search,    setSearch]    = useState('')
  const [lightbox,  setLightbox]  = useState(null)
  const [copied,    setCopied]    = useState(null)

  const backPath = role === 'admin' ? '/admin' : '/barbeiro'

  const filtered = POSTS
    .filter(p => filter === 'todos' || p.tag === filter)
    .filter(p => !search.trim() || p.label.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setLightbox(null) }
    if (lightbox) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  function handleDownload(file) {
    const a = document.createElement('a')
    a.href = `/social-media/${file}`
    a.download = file
    a.click()
  }

  function handleDownloadAll() {
    filtered.forEach((p, i) => setTimeout(() => handleDownload(p.file), i * 200))
  }

  function handleCopyLink(file) {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
    navigator.clipboard.writeText(`${baseUrl}/social-media/${file}`).then(() => {
      setCopied(file)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const FILTERS = [
    { value: 'todos',     label: 'Todos' },
    { value: 'portfolio', label: 'Portfólio' },
    { value: 'campanha',  label: 'Campanha' },
  ]

  return (
    <div className="portal-shell">

      {/* Header */}
      <header className="portal-header">
        <button className="portal-header__back" onClick={() => navigate(backPath)}>← Voltar</button>
        <span className="portal-header__title">Social Media</span>
        <button className="portal-header__dl-btn" onClick={handleDownloadAll}>
          ⬇ Baixar {filter === 'todos' ? 'todos' : filtered.length}
        </button>
      </header>

      {/* Body */}
      <div className="portal-body">

        {/* Controls */}
        <div className="portal-controls">
          <div className="portal-filters">
            {FILTERS.map(f => (
              <button
                key={f.value}
                className={`portal-filter-btn${filter === f.value ? ' active' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className="portal-search"
            type="text"
            placeholder="Buscar post…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Masonry grid */}
        {filtered.length === 0 ? (
          <div className="mgmt-empty">Nenhum post encontrado.</div>
        ) : (
          <div className="portal-masonry">
            {filtered.map(p => (
              <div key={p.file} className="portal-masonry-item">
                <button
                  className="portal-masonry-item__img"
                  onClick={() => setLightbox(p)}
                  aria-label={`Ver ${p.label}`}
                  style={{ background: 'none', border: 'none', padding: 0, width: '100%' }}
                >
                  <img src={`/social-media/${p.file}`} alt={p.label} loading="lazy" />
                  <div className="portal-masonry-item__overlay">
                    <span className="portal-masonry-item__overlay-icon">Ver</span>
                  </div>
                </button>
                <div className="portal-masonry-item__foot">
                  <span className="portal-masonry-item__label">{p.label}</span>
                  <div className="portal-masonry-item__actions">
                    <button
                      className="portal-action-btn"
                      title="Baixar"
                      onClick={() => handleDownload(p.file)}
                    >⬇</button>
                    <button
                      className="portal-action-btn"
                      title={copied === p.file ? 'Copiado!' : 'Copiar link'}
                      onClick={() => handleCopyLink(p.file)}
                    >{copied === p.file ? '✓' : '🔗'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="portal-lightbox" onClick={() => setLightbox(null)}>
          <div className="portal-lightbox__box" onClick={e => e.stopPropagation()}>
            <button className="portal-lightbox__close" onClick={() => setLightbox(null)}>×</button>
            <img className="portal-lightbox__img" src={`/social-media/${lightbox.file}`} alt={lightbox.label} />
            <div className="portal-lightbox__foot">
              <span className="portal-lightbox__label">{lightbox.label}</span>
              <div className="portal-lightbox__actions">
                <button
                  className="portal-lightbox__btn"
                  onClick={() => handleCopyLink(lightbox.file)}
                >{copied === lightbox.file ? '✓ Copiado' : '🔗 Copiar link'}</button>
                <button
                  className="portal-lightbox__btn portal-lightbox__btn--primary"
                  onClick={() => handleDownload(lightbox.file)}
                >⬇ Baixar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
