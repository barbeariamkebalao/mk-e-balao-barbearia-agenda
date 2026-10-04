import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const PERSONALITIES = [
  {
    value:   'classico',
    label:   'Clássico',
    desc:    'Profissional e cordial',
    preview: 'Oi! Seja bem-vindo à MK e BALÃO ✂️',
  },
  {
    value:   'urbano',
    label:   'Urbano',
    desc:    'Direto e despojado',
    preview: 'E aí! Bem-vindo à MK e BALÃO 🔥',
  },
  {
    value:   'carismatico',
    label:   'Carismático',
    desc:    'Caloroso e expressivo',
    preview: 'Oi! Que bom ter você aqui! Bem-vindo à MK e BALÃO ✂️✨',
  },
]

export default function ChatAgendaPanel() {
  const [copied,   setCopied]   = useState(false)
  const [settings, setSettings] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single()
      .then(({ data }) => setSettings(data))
  }, [])

  function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function savePersonality(personality) {
    setSaving(true)
    const botConfig = { ...(settings?.bot_config || {}), personality }
    const { error } = await supabase.from('settings').update({ bot_config: botConfig }).eq('id', 1)
    setSaving(false)
    if (error) {
      setMsg('Erro ao salvar. Verifique se a migration foi executada no Supabase.')
    } else {
      setSettings(s => ({ ...s, bot_config: botConfig }))
      setMsg('Personalidade salva!')
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const chatUrl            = `${baseUrl}/`
  const currentPersonality = settings?.bot_config?.personality || 'classico'

  const CONFIG_ITEMS = settings ? [
    { label: 'WhatsApp da barbearia', value: settings.whatsapp,       desc: 'Número para onde vai a confirmação' },
    { label: 'Horário Seg–Sex',       value: settings.hours_weekday,  desc: 'Exibido na tela de agendamento' },
    { label: 'Horário Sábado',        value: settings.hours_saturday, desc: 'Exibido na tela de agendamento' },
    { label: 'Tagline',               value: settings.tagline,        desc: 'Aparece como subtítulo no chat' },
  ] : []

  const FUTURE_CONFIG = [
    { label: 'Antecedência mínima',           desc: 'Bloquear agendamentos com menos de X horas de antecedência' },
    { label: 'Janela máxima',                 desc: 'Quantos dias à frente o cliente pode agendar' },
    { label: 'Ocultar "Primeiro Disponível"', desc: 'Remover a opção de barbeiro automático' },
    { label: 'Notificação WA para o cliente', desc: 'Enviar confirmação por WhatsApp ao cliente após agendar' },
  ]

  return (
    <div className="assistente-panel">
      {msg && <div className="mgmt-toast">{msg}</div>}

      <div className="assistente-status">
        <div className="assistente-status__dot" />
        <div className="assistente-status__info">
          <div className="assistente-status__title">Chat de Agendamento — Ativo</div>
          <div className="assistente-status__sub">O fluxo conversacional está online e aceitando agendamentos</div>
        </div>
      </div>

      <div className="assistente-link-row">
        <a href="/" target="_blank" rel="noreferrer" className="assistente-link-card">
          <div className="assistente-link-card__icon">💬</div>
          <div className="assistente-link-card__label">Testar Fluxo</div>
          <div className="assistente-link-card__desc">Abra como cliente e percorra o agendamento do início ao fim</div>
        </a>
        <a href="/agendar/maikon" target="_blank" rel="noreferrer" className="assistente-link-card">
          <div className="assistente-link-card__icon">🔗</div>
          <div className="assistente-link-card__label">Link por Barbeiro</div>
          <div className="assistente-link-card__desc">Acesso direto já com barbeiro pré-selecionado (ex: /agendar/maikon)</div>
        </a>
        <div className="assistente-link-card" role="presentation"
          onClick={() => navigator.clipboard?.writeText(chatUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}>
          <div className="assistente-link-card__icon">{copied ? '✓' : '📲'}</div>
          <div className="assistente-link-card__label">{copied ? 'Link Copiado!' : 'Compartilhar Link'}</div>
          <div className="assistente-link-card__desc">Cole no Instagram, WhatsApp ou Google Meu Negócio</div>
        </div>
      </div>

      <div className="assistente-qr">
        <div className="assistente-qr__title">Link de Agendamento</div>
        <div className="assistente-url-row">
          <code>{chatUrl}</code>
          <button className="assistente-copy-btn" onClick={() => copyLink(chatUrl)}>
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <a href={chatUrl} target="_blank" rel="noreferrer"
            style={{ textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '0.7rem', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0.35rem 0.875rem', background: 'transparent', border: '1px solid var(--border)', color: 'rgba(244,244,242,0.55)', cursor: 'pointer' }}>
            Abrir
          </a>
        </div>
      </div>

      <div className="assistente-qr">
        <div className="assistente-qr__title">Personalidade do Assistente</div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(244,244,242,0.4)', margin: '0.375rem 0 0' }}>
          Define o tom das mensagens durante o agendamento. Muda de imediato para novos clientes.
        </p>
        <div className="bot-personality-grid">
          {PERSONALITIES.map(p => (
            <button
              key={p.value}
              className={`bot-personality-card${currentPersonality === p.value ? ' active' : ''}`}
              onClick={() => savePersonality(p.value)}
              disabled={saving}
            >
              {currentPersonality === p.value && <div className="bot-personality-card__check">✓</div>}
              <div className="bot-personality-card__label">{p.label}</div>
              <div className="bot-personality-card__desc">{p.desc}</div>
              <div className="bot-personality-card__preview">{p.preview}</div>
            </button>
          ))}
        </div>
      </div>

      {settings && (
        <div className="assistente-qr">
          <div className="assistente-qr__title">Configurações que afetam o agendamento — edite em Config/Agenda</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            {CONFIG_ITEMS.map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(244,244,242,0.45)' }}>{c.label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--chalk)', marginTop: '1px' }}>{c.value || '—'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(244,244,242,0.3)', marginTop: '1px' }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="assistente-qr">
        <div className="assistente-qr__title">Configurações futuras — próximas versões</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.75rem' }}>
          {FUTURE_CONFIG.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', opacity: 0.5 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'rgba(244,244,242,0.4)', flexShrink: 0, marginTop: '1px' }}>em breve</div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', color: 'var(--chalk)' }}>{c.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(244,244,242,0.35)', marginTop: '2px' }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
