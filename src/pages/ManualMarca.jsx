import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const COLORS = [
  { name: 'Midnight',      hex: '#0A0A0A', desc: 'Fundo principal',      light: false },
  { name: 'Surface',       hex: '#141414', desc: 'Cards, inputs',         light: false },
  { name: 'Chalk',         hex: '#F4F4F2', desc: 'Texto, bordas',         light: true  },
  { name: 'Heritage Red',  hex: '#D32B2F', desc: 'Ação, destaque',        light: false, nameColor: '#D32B2F' },
  { name: 'Heritage Blue', hex: '#1E4371', desc: 'Polo, elegância',       light: false, nameColor: '#1E4371' },
  { name: 'Heritage Gold', hex: '#D4AF37', desc: 'Premium, combos',       light: true,  nameColor: '#D4AF37' },
  { name: 'WhatsApp',      hex: '#25D366', desc: 'Botão WhatsApp',        light: true,  nameColor: '#25D366' },
]

const LOGOS = [
  { src: '/logo-semfundo.png', name: 'Versão Principal', info: 'PNG transparente' },
  { src: '/logo-escudo.jpg',   name: 'Versão Escudo',    info: 'JPG • uso em impressos' },
  { src: '/logo-fundo-preto.jpg', name: 'Fundo Escuro',  info: 'JPG • fundo preto' },
]

const SERVICES = [
  {
    group: '🏢 Presença Digital',
    items: [
      'Perfil profissional criado no Google',
      'Instagram criado — @barbeariamkebalao',
      'Email empresarial criado',
    ],
  },
  {
    group: '🎨 Marca & Identidade',
    items: [
      'Logotipo desenvolvido',
      'Identidade visual criada',
      'Paleta de cores definida',
      'Estrutura de Social Media — Barbearia Geral',
    ],
  },
  {
    group: '👤 Social Media Pessoal — Barbeiros',
    items: [
      'Criação e estruturação dos perfis pessoais dos barbeiros',
    ],
  },
  {
    group: '🌐 Site & Sistema de Agendamento',
    items: [
      'Site institucional desenvolvido e publicado',
      'Sistema de agendamento online — assistente conversacional',
      'Portal interno com galeria de posts para download',
    ],
  },
  {
    group: '📸 Instagram — Destaques & Stories',
    items: [
      'Imagens de Destaques para o Instagram',
      'Story animado do logotipo — 2 versões',
    ],
  },
]

// Credenciais carregadas do banco — não hardcoded no bundle
const DIGITAL_ACCESS_FALLBACK = []

const SECTIONS = ['logos', 'cores', 'tipog', 'servicos', 'animacoes', 'acesso']
const SECTION_NAMES = {
  logos:    'Logotipos',
  cores:    'Cores',
  tipog:    'Tipografia',
  servicos: 'Serviços',
  animacoes:'Animações',
  acesso:   'Acesso',
}

function copy(text) {
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text; document.body.appendChild(ta); ta.select()
    document.execCommand('copy'); document.body.removeChild(ta)
  })
}

function ColorSwatch({ c }) {
  const [flashing, setFlashing] = useState(false)

  function handleClick() {
    copy(c.hex)
    setFlashing(true)
    setTimeout(() => setFlashing(false), 900)
  }

  return (
    <div className="mm-swatch" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="mm-swatch__color" style={{ background: c.hex, border: c.name === 'Midnight' ? '1px solid rgba(244,244,242,0.2)' : 'none' }}>
        {flashing && <div className="mm-swatch__copied">{c.hex}</div>}
      </div>
      <div className="mm-swatch__info">
        <span className="mm-swatch__name" style={c.nameColor ? { color: c.nameColor } : {}}>{c.name}</span>
        <span className="mm-swatch__desc">{c.hex} — {c.desc}</span>
      </div>
    </div>
  )
}

function CredRow({ row }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="mm-cred-row">
      <div className="mm-cred-row__left">
        <span className="mm-cred-row__label">{row.label}</span>
        <span
          className={`mm-cred-row__value${!row.public && !visible ? ' mm-cred-row__value--blurred' : ''}`}
          onMouseEnter={() => !row.public && setVisible(true)}
          onMouseLeave={() => !row.public && setVisible(false)}
          onTouchStart={() => !row.public && setVisible(v => !v)}
        >
          {row.value}
        </span>
      </div>
      <button className="mm-cred-copy" onClick={() => copy(row.value)} title="Copiar">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      </button>
    </div>
  )
}

function VideoCard({ src, name, info }) {
  const ref = useRef()
  return (
    <div className="mm-asset-card">
      <div className="mm-asset-card__media"
        onMouseEnter={() => ref.current?.play()}
        onMouseLeave={() => ref.current?.pause()}
      >
        <video ref={ref} loop muted playsInline className="mm-asset-card__video">
          <source src={src} type="video/mp4" />
        </video>
        <span className="mm-asset-card__hint">Passe o mouse para reproduzir</span>
      </div>
      <div className="mm-asset-card__foot">
        <div>
          <div className="mm-asset-card__name">{name}</div>
          <div className="mm-asset-card__info">{info}</div>
        </div>
        <a href={src} download className="mm-dl-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

export default function ManualMarca({ role = 'admin' }) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('logos')
  const [toast, setToast] = useState(null)
  const [digitalAccess, setDigitalAccess] = useState(DIGITAL_ACCESS_FALLBACK)

  useEffect(() => {
    async function loadCredentials() {
      const { data } = await supabase.from('settings').select('credentials_json').eq('id', 1).single()
      if (data?.credentials_json?.length) setDigitalAccess(data.credentials_json)
    }
    loadCredentials()
  }, [])
  const sectionRefs = useRef({})
  const backPath = role === 'admin' ? '/admin' : '/barbeiro'

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
      },
      { threshold: 0.4 }
    )
    SECTIONS.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mm-layout">

      {/* Header */}
      <header className="mm-header">
        <div className="mm-header__inner">
          <div className="mm-header__brand">
            <img src="/logo-semfundo.png" alt="MK e BALÃO" className="mm-header__logo" />
            <span className="mm-header__label">Manual de Marca</span>
          </div>
          <nav className="mm-header__nav">
            {SECTIONS.map(id => (
              <button
                key={id}
                className={`mm-nav-pill${activeSection === id ? ' mm-nav-pill--active' : ''}`}
                onClick={() => scrollTo(id)}
              >
                {SECTION_NAMES[id]}
              </button>
            ))}
          </nav>
          <button className="mm-header__back" onClick={() => navigate(backPath)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Voltar
          </button>
        </div>
        <div className="barber-pole-bg" style={{ height: '3px' }} />
      </header>

      {/* Main */}
      <main className="mm-main">

        {/* Hero */}
        <div className="mm-hero">
          <p className="mm-hero__eyebrow">Identidade Visual Oficial</p>
          <h1 className="mm-hero__title">MK e BALÃO</h1>
          <p className="mm-hero__sub">Barbearia — Piraju, SP — Manual de Marca v1.0</p>
        </div>

        {/* ── 01 Logotipos ── */}
        <section id="logos" className="mm-section">
          <div className="mm-section__head">
            <span className="mm-section__num">01</span>
            <h2 className="mm-section__title">Logotipos</h2>
            <div className="mm-section__rule" />
          </div>
          <div className="mm-logos-grid">
            {LOGOS.map(logo => (
              <div key={logo.src} className="mm-asset-card">
                <div className="mm-asset-card__media mm-asset-card__media--logo">
                  <img src={logo.src} alt={logo.name} className="mm-logo-img" />
                </div>
                <div className="mm-asset-card__foot">
                  <div>
                    <div className="mm-asset-card__name">{logo.name}</div>
                    <div className="mm-asset-card__info">{logo.info}</div>
                  </div>
                  <a href={logo.src} download className="mm-dl-btn">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 02 Cores ── */}
        <section id="cores" className="mm-section">
          <div className="mm-section__head">
            <span className="mm-section__num">02</span>
            <h2 className="mm-section__title">Paleta de Cores</h2>
            <div className="mm-section__rule" />
          </div>
          <p className="mm-section__hint">Clique para copiar o código HEX</p>
          <div className="mm-colors-grid">
            {COLORS.map(c => <ColorSwatch key={c.hex} c={c} />)}
          </div>
        </section>

        {/* ── 03 Tipografia ── */}
        <section id="tipog" className="mm-section">
          <div className="mm-section__head">
            <span className="mm-section__num">03</span>
            <h2 className="mm-section__title">Tipografia</h2>
            <div className="mm-section__rule" />
          </div>
          <div className="mm-typo-list">
            <div className="mm-typo-card">
              <div className="mm-typo-card__meta">
                <span className="mm-typo-card__role">Títulos / Lettering da marca</span>
                <span className="mm-typo-card__family">MK Balao Lettering Estudo</span>
              </div>
              <div className="mm-typo-card__sample">
                <p style={{ fontFamily: "'MK Balao Lettering Estudo', 'Oswald', sans-serif", fontSize: '3rem', lineHeight: 1.3, color: 'var(--chalk)' }}>MK e BALÃO</p>
                <p style={{ fontFamily: "'MK Balao Lettering Estudo', 'Oswald', sans-serif", fontSize: '1.2rem', color: 'rgba(244,244,242,0.5)' }}>Barbearia • Piraju</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', lineHeight: 1.6, color: 'rgba(244,244,242,0.5)', marginTop: '1rem' }}>Reconstrução de estudo 0.1 a partir do lettering. Minúsculas usam formas maiúsculas. O logotipo original permanece como assinatura.</p>
              </div>
            </div>
            <div className="mm-typo-card">
              <div className="mm-typo-card__meta">
                <span className="mm-typo-card__role">Menus / Labels</span>
                <span className="mm-typo-card__family">Oswald</span>
              </div>
              <div className="mm-typo-card__sample">
                <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--chalk)' }}>CORTE — BARBA — COMBO</p>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.4em', color: 'rgba(244,244,242,0.5)' }}>Acesso Interno • Portal Social Media</p>
              </div>
            </div>
            <div className="mm-typo-card">
              <div className="mm-typo-card__meta">
                <span className="mm-typo-card__role">Corpo / Texto</span>
                <span className="mm-typo-card__family">Inter</span>
              </div>
              <div className="mm-typo-card__sample">
                <p style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(244,244,242,0.8)', lineHeight: 1.7 }}>A MK e BALÃO Barbearia nasceu com uma missão: oferecer cortes precisos, atendimento premium e uma experiência que vai além da cadeira. Cada detalhe é pensado para que você saia diferente.</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: 'rgba(244,244,242,0.35)', marginTop: '0.5rem' }}>Inter Regular 400 — corpo de texto, descrições</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 Serviços ── */}
        <section id="servicos" className="mm-section">
          <div className="mm-section__head">
            <span className="mm-section__num">04</span>
            <h2 className="mm-section__title">Serviços Realizados</h2>
            <div className="mm-section__rule" />
          </div>
          <div className="mm-services-list">
            {SERVICES.map(group => (
              <div key={group.group} className="mm-svc-group">
                <p className="mm-svc-group__label">{group.group}</p>
                {group.items.map(item => (
                  <div key={item} className="mm-svc-item">
                    <div className="mm-svc-item__check">
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="square" strokeWidth="3" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── 05 Animações ── */}
        <section id="animacoes" className="mm-section">
          <div className="mm-section__head">
            <span className="mm-section__num">05</span>
            <h2 className="mm-section__title">Animações & Destaques</h2>
            <div className="mm-section__rule" />
          </div>
          <p className="mm-section__hint">
            <code>destaques.jpg</code> &nbsp;•&nbsp; <code>anima1.mp4</code> &nbsp;•&nbsp; <code>anima2.mp4</code>
          </p>
          <div className="mm-logos-grid">
            {/* Destaques Instagram */}
            <div className="mm-asset-card">
              <div className="mm-asset-card__media mm-asset-card__media--logo">
                <img src="/destaques.jpg" alt="Destaques Instagram" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="mm-asset-card__foot">
                <div>
                  <div className="mm-asset-card__name">Destaques Instagram</div>
                  <div className="mm-asset-card__info">Capas dos highlights</div>
                </div>
                <a href="/destaques.jpg" download className="mm-dl-btn">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                </a>
              </div>
            </div>
            <VideoCard src="/assets/videos/anima1.mp4" name="Story Animado v1" info="Animação do logotipo" />
            <VideoCard src="/assets/videos/anima2.mp4" name="Story Animado v2" info="Animação do logotipo" />
          </div>
        </section>

        {/* ── 06 Acesso Digital ── */}
        <section id="acesso" className="mm-section">
          <div className="mm-section__head">
            <span className="mm-section__num">06</span>
            <h2 className="mm-section__title">Acesso Digital</h2>
            <div className="mm-section__rule" />
          </div>
          <p className="mm-section__hint">Passe o mouse (ou toque) para revelar senha • Clique no ícone para copiar</p>
          <div className="mm-access-list">
            {digitalAccess.length === 0 && (
              <p className="mm-section__hint" style={{ color: 'var(--gold)' }}>
                Nenhuma credencial cadastrada ainda. Execute o SQL de migração de segurança no Supabase.
              </p>
            )}
            {digitalAccess.map(block => (
              <div key={block.title} className="mm-access-block">
                <div className="mm-access-block__head">
                  <span className="mm-access-block__title">{block.title}</span>
                  {block.link && (
                    <a href={block.link} target="_blank" rel="noreferrer" className="mm-access-block__link">Abrir →</a>
                  )}
                </div>
                {block.rows.map(row => <CredRow key={row.label} row={row} />)}
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="mm-footer">
        MK e BALÃO Barbearia — Piraju, SP — Uso Interno
      </footer>

      {/* Toast */}
      {toast && (
        <div className="mm-toast">✓ &nbsp;{toast}</div>
      )}
    </div>
  )
}
