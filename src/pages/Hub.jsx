import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PAGES = [
  {
    group: 'Público',
    badge: 'public',
    items: [
      {
        icon: 'home',
        title: 'Site Institucional',
        desc: 'Landing page da barbearia — equipe, serviços, galeria, Clube e agendamento.',
        route: '/',
        label: '/',
      },
      {
        icon: 'chat',
        title: 'Agendamento Online',
        desc: 'Assistente conversacional — escolha serviço, barbeiro, data e horário pelo chat.',
        route: '/agendar',
        label: '/agendar',
      },
      {
        icon: 'book',
        title: 'Manual do Sistema (público)',
        desc: 'Manual público com caminhos, assistentes e instruções de uso do sistema.',
        route: '/manual',
        label: '/manual',
      },
      {
        icon: 'home', title: 'Instalar MK Admin',
        desc: 'Ícone administrativo e instruções para iPhone e Android.',
        route: '/instalar-admin.html', label: '/instalar-admin.html',
      },
    ],
  },
  {
    group: 'Links Diretos por Barbeiro',
    badge: 'public',
    items: [
      {
        icon: 'user',
        title: 'Agendar com Maikon',
        desc: 'Link direto para o chat de agendamento já com Maikon selecionado. Compartilhe com clientes.',
        route: '/agendar/maikon',
        label: '/agendar/maikon',
      },
      {
        icon: 'user',
        title: 'Agendar com Gabriel',
        desc: 'Link direto para o chat de agendamento já com Gabriel selecionado.',
        route: '/agendar/gabriel',
        label: '/agendar/gabriel',
      },
      {
        icon: 'user',
        title: 'Agendar com Daniel',
        desc: 'Link direto para o chat de agendamento já com Daniel selecionado. Inclui colorimetria.',
        route: '/agendar/daniel',
        label: '/agendar/daniel',
      },
    ],
  },
  {
    group: 'Interno — Barbeiros',
    badge: 'internal',
    items: [
      {
        icon: 'scissors',
        title: 'Painel do Barbeiro',
        desc: 'Ver agendamentos de hoje, semana e pendentes. Confirmar e concluir atendimentos.',
        route: '/barbeiro',
        label: '/barbeiro',
      },
      {
        icon: 'image',
        title: 'Social Media',
        desc: 'Galeria de posts e artes para Instagram — filtrar e baixar individualmente ou em lote.',
        route: '/portal',
        label: '/portal',
      },
      {
        icon: 'brand',
        title: 'Manual de Marca',
        desc: 'Logos, paleta de cores, tipografia, serviços realizados e acessos digitais.',
        route: '/marca',
        label: '/marca',
      },
    ],
  },
  {
    group: 'Interno — Admin',
    badge: 'admin',
    items: [
      {
        icon: 'lock', title: 'Acessos e testes',
        desc: 'Guia protegido de contas, caminhos, testes iniciais e usabilidade.',
        route: '/admin/acessos', label: '/admin/acessos',
      },
      {
        icon: 'shield',
        title: 'Painel Admin',
        desc: 'Visão completa: todos os agendamentos, analytics, agenda, serviços, equipe, clube e config.',
        route: '/admin',
        label: '/admin',
      },
    ],
  },
  {
    group: 'Acesso',
    badge: 'doc',
    items: [
      {
        icon: 'lock',
        title: 'Login',
        desc: 'Tela de autenticação por email e senha. Entrada para as áreas internas.',
        route: '/login',
        label: '/login',
      },
    ],
  },
]

const BADGE_LABEL = {
  public:   'Público',
  internal: 'Interno',
  admin:    'Admin',
  doc:      'Acesso',
}

function Icon({ name }) {
  const icons = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    scissors: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
    image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    book: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    brand: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  }
  return (
    <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="square" strokeWidth="1.5">
      <path d={icons[name] || icons.book} />
    </svg>
  )
}

export default function Hub({ barber }) {
  const navigate = useNavigate()

  return (
    <div className="hub-layout">

      {/* Header */}
      <header className="hub-header">
        <div className="hub-header__inner">
          <img src="/logo-semfundo.png" alt="MK e BALÃO" className="hub-header__logo" />
          <span className="hub-header__label">Hub de Navegação</span>
        </div>
        <div className="barber-pole-bg" style={{ height: '3px' }} />
      </header>

      {/* Main */}
      <main className="hub-main">

        {/* Hero */}
        <div className="hub-hero">
          <h1 className="hub-hero__title">
            {barber ? `Bem-vindo, ${barber.name.split(' ')[0]}!` : 'Central de Acesso'}
          </h1>
          <p className="hub-hero__sub">MK e BALÃO Barbearia — todas as páginas em um lugar</p>

          {barber && (
            <div className="hub-hero__assistant">
              <div>
                <p className="hub-hero__assistant-label">Meu link de agendamento</p>
                <p className="hub-hero__assistant-name">
                  {barber.slug === 'maikon' ? 'Maikon (MK)' : barber.slug === 'gabriel' ? 'Gabriel' : 'Daniel Balão'}
                </p>
              </div>
              <button
                className="hub-hero__assistant-btn"
                onClick={() => navigate(`/agendar/${barber.slug}`)}
              >
                Abrir →
              </button>
            </div>
          )}
        </div>

        {/* Groups */}
        {PAGES.map(group => (
          <div key={group.group} className="hub-group">
            <p className="hub-group__label">{group.group}</p>
            <div className="hub-cards-grid">
              {group.items.map(item => (
                <button
                  key={item.route}
                  className="hub-card"
                  onClick={() => item.route.endsWith('.html') ? window.location.assign(item.route) : navigate(item.route)}
                >
                  <div className="hub-card__top">
                    <span className="hub-card__icon"><Icon name={item.icon} /></span>
                    <span className={`hub-card__badge hub-card__badge--${group.badge}`}>
                      {BADGE_LABEL[group.badge]}
                    </span>
                  </div>
                  <div className="hub-card__body">
                    <h2 className="hub-card__title">{item.title}</h2>
                    <p className="hub-card__desc">{item.desc}</p>
                  </div>
                  <div className="hub-card__foot">
                    <span className="hub-card__route">{item.label}</span>
                    <svg className="hub-card__arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

      </main>

      <footer className="hub-footer">
        <span>MK e BALÃO Barbearia — Piraju, SP</span>
        {barber && (
          <button
            className="hub-footer__logout"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.replace('/login')
            }}
          >
            Sair da conta
          </button>
        )}
      </footer>
    </div>
  )
}
