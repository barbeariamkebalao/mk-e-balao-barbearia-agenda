import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const BARBER_EMAILS = {
  mk:      'mk@mkebalaobarbearia.com.br',
  balao:   'daniel@mkebalaobarbearia.com.br',
  daniel:  'daniel@mkebalaobarbearia.com.br',
  gabriel: 'gabriel@mkebalaobarbearia.com.br',
}

const SECTIONS = ['visao-geral', 'tecnologias', 'usuarios', 'funcionalidades', 'banco-de-dados', 'suporte']

const SECTION_LABELS = {
  'visao-geral':     '📋 Visão Geral',
  'tecnologias':     '⚙️ Tecnologias',
  'usuarios':        '👤 Usuários',
  'funcionalidades': '✂️ Funcionalidades',
  'banco-de-dados':  '🗄️ Banco de Dados',
  'suporte':         '🛠️ Suporte',
}

export default function Manual({ role = null }) {
  const navigate = useNavigate()
  const [section, setSection]   = useState('visao-geral')
  const [barbers, setBarbers]   = useState([])
  const [settings, setSettings] = useState(null)

  const backPath = role === 'admin' ? '/admin' : role ? '/barbeiro' : '/'

  useEffect(() => {
    async function load() {
      const [{ data: b }, { data: s }] = await Promise.all([
        supabase.from('barbers').select('name, slug, speciality, role').neq('role', 'admin').order('sort_order'),
        supabase.from('settings').select('*').eq('id', 1).single(),
      ])
      setBarbers(b || [])
      setSettings(s || {})
    }
    load()
  }, [])

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/logo-semfundo.png" alt="MK e BALÃO" />
          <div className="admin-sidebar__label">Manual</div>
        </div>
        <nav className="admin-sidebar__nav">
          <button className="nav-item" onClick={() => navigate(backPath)}>
            <span className="nav-item__icon">←</span>
            Voltar
          </button>
          {SECTIONS.map(s => (
            <button
              key={s}
              className={`nav-item${section === s ? ' active' : ''}`}
              onClick={() => setSection(s)}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <button className="admin-topbar__back" onClick={() => navigate(backPath)}>← Voltar</button>
          <div className="admin-topbar__title">
            <span className="admin-topbar__name">Manual</span>
            <span className="admin-topbar__tab-label">{SECTION_LABELS[section]}</span>
          </div>
        </div>

        {/* Mobile section selector */}
        <div className="manual-mobile-nav">
          <select
            value={section}
            onChange={e => setSection(e.target.value)}
            className="manual-mobile-select"
          >
            {SECTIONS.map(s => (
              <option key={s} value={s}>{SECTION_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="admin-body">
          <div className="manual-content">

            {section === 'visao-geral' && (
              <>
                <div className="manual-hero">
                  <img src="/logo-escudo.jpg" alt="MK e BALÃO" className="manual-hero__logo" />
                  <div>
                    <h1 className="manual-hero__title">MK e BALÃO Barbearia</h1>
                    <p className="manual-hero__subtitle">Sistema de Agendamento Online — Fluency Agenda</p>
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">O que é este sistema</div>
                  <p>Plataforma completa de agendamento online desenvolvida pela <strong>Fluency Works</strong> exclusivamente para a MK e BALÃO Barbearia. Permite que clientes agendem horários a qualquer hora do dia, sem precisar ligar ou mandar mensagem no WhatsApp.</p>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">Desenvolvido por</div>
                  <div className="manual-info-grid">
                    <div className="manual-info-item">
                      <span className="manual-info-label">Estúdio</span>
                      <span className="manual-info-value">Fluency Works</span>
                    </div>
                    <div className="manual-info-item">
                      <span className="manual-info-label">Responsável</span>
                      <span className="manual-info-value">Claudio Santana</span>
                    </div>
                    <div className="manual-info-item">
                      <span className="manual-info-label">Contato</span>
                      <span className="manual-info-value">csantana.gon@gmail.com</span>
                    </div>
                    <div className="manual-info-item">
                      <span className="manual-info-label">WhatsApp</span>
                      <span className="manual-info-value">+55 14 96373-527</span>
                    </div>
                    <div className="manual-info-item">
                      <span className="manual-info-label">Versão</span>
                      <span className="manual-info-value">2.0 — Outubro 2026</span>
                    </div>
                    <div className="manual-info-item">
                      <span className="manual-info-label">Produto</span>
                      <span className="manual-info-value">Fluency Agenda</span>
                    </div>
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">Como o sistema funciona</div>
                  <div className="manual-steps">
                    <div className="manual-step"><span className="manual-step__num">1</span><span>Cliente acessa o link do sistema pelo celular</span></div>
                    <div className="manual-step"><span className="manual-step__num">2</span><span>Escolhe o barbeiro, serviço, data e horário pelo chat</span></div>
                    <div className="manual-step"><span className="manual-step__num">3</span><span>Sistema confirma o agendamento em tempo real</span></div>
                    <div className="manual-step"><span className="manual-step__num">4</span><span>Barbeiro vê o agendamento no painel /barbeiro</span></div>
                    <div className="manual-step"><span className="manual-step__num">5</span><span>Admin gerencia tudo em /admin</span></div>
                  </div>
                </div>
              </>
            )}

            {section === 'tecnologias' && (
              <>
                <div className="manual-card">
                  <div className="manual-card__title">Stack Frontend</div>
                  <div className="manual-tech-grid">
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">React 18</span>
                      <span className="manual-tech-desc">Framework de interface — componentes, estado, rotas</span>
                    </div>
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">Vite 5</span>
                      <span className="manual-tech-desc">Build tool — hot reload em desenvolvimento, bundle otimizado</span>
                    </div>
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">Tailwind CSS v3</span>
                      <span className="manual-tech-desc">Sistema de estilos — tokens de cor e tipografia customizados</span>
                    </div>
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">React Router v6</span>
                      <span className="manual-tech-desc">Navegação entre páginas — /agendar, /admin, /barbeiro, etc.</span>
                    </div>
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">Supabase JS v2</span>
                      <span className="manual-tech-desc">SDK para conexão com banco de dados e autenticação</span>
                    </div>
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">Backend — Supabase</div>
                  <div className="manual-tech-grid">
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">PostgreSQL</span>
                      <span className="manual-tech-desc">Banco de dados relacional hospedado no Supabase</span>
                    </div>
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">Row Level Security (RLS)</span>
                      <span className="manual-tech-desc">Segurança por linha — clientes só veem/criam seus dados</span>
                    </div>
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">Supabase Auth</span>
                      <span className="manual-tech-desc">Autenticação de barbeiros e admin por email + senha</span>
                    </div>
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">Supabase Storage</span>
                      <span className="manual-tech-desc">Bucket barber-images — fotos dos barbeiros</span>
                    </div>
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">Hospedagem & Deploy</div>
                  <div className="manual-tech-grid">
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">Vercel</span>
                      <span className="manual-tech-desc">Hospedagem do frontend — deploy automático a cada push no GitHub</span>
                    </div>
                    <div className="manual-tech-item">
                      <span className="manual-tech-name">GitHub</span>
                      <span className="manual-tech-desc">Controle de versão e repositório do código-fonte</span>
                    </div>
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">Variáveis de Ambiente</div>
                  <p style={{ marginBottom: '0.75rem', color: 'var(--dim)', fontSize: '0.875rem' }}>Configuradas no painel da Vercel e no arquivo <code>.env.local</code> em desenvolvimento.</p>
                  <div className="manual-env-list">
                    <div className="manual-env-item">
                      <code>VITE_SUPABASE_URL</code>
                      <span>URL do projeto no Supabase</span>
                    </div>
                    <div className="manual-env-item">
                      <code>VITE_SUPABASE_ANON_KEY</code>
                      <span>Chave anônima pública do Supabase</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {section === 'usuarios' && (
              <>
                <div className="manual-card manual-card--warning">
                  <div className="manual-card__title">⚠️ Confidencial</div>
                  <p>Estas credenciais são de acesso restrito. Não compartilhe fora da equipe da barbearia.</p>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">👑 Administrador</div>
                  <div className="manual-credentials">
                    <div className="manual-cred-row">
                      <span className="manual-cred-label">Acesso</span>
                      <span className="manual-cred-value">/admin</span>
                    </div>
                    <div className="manual-cred-row">
                      <span className="manual-cred-label">Email</span>
                      <span className="manual-cred-value">{settings?.admin_email || 'admin@mkebalaobarbearia.com.br'}</span>
                    </div>
                    <div className="manual-cred-row">
                      <span className="manual-cred-label">Senha</span>
                      <span className="manual-cred-value">123456</span>
                    </div>
                    <div className="manual-cred-row">
                      <span className="manual-cred-label">Permissões</span>
                      <span className="manual-cred-value">Total — vê todos os agendamentos, gerencia serviços, equipe, agenda, clube e configurações</span>
                    </div>
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">✂️ Barbeiros</div>
                  <div className="manual-barbers-list">
                    {barbers.map(b => (
                      <div key={b.slug} className="manual-barber-item">
                        <div className="manual-barber-item__name">{b.name}</div>
                        <div className="manual-cred-row">
                          <span className="manual-cred-label">Email</span>
                          <span className="manual-cred-value">{BARBER_EMAILS[b.slug] || `${b.slug}@mkebalaobarbearia.com.br`}</span>
                        </div>
                        <div className="manual-cred-row">
                          <span className="manual-cred-label">Senha</span>
                          <span className="manual-cred-value">123456</span>
                        </div>
                        <div className="manual-cred-row">
                          <span className="manual-cred-label">Painel</span>
                          <span className="manual-cred-value">/barbeiro</span>
                        </div>
                        <div className="manual-cred-row">
                          <span className="manual-cred-label">Link direto</span>
                          <span className="manual-cred-value">/agendar/{b.slug}</span>
                        </div>
                        <div className="manual-cred-row">
                          <span className="manual-cred-label">Especialidade</span>
                          <span className="manual-cred-value">{b.speciality || 'Barbeiro'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">🔑 Como resetar senha</div>
                  <div className="manual-steps">
                    <div className="manual-step"><span className="manual-step__num">1</span><span>Acesse supabase.com → seu projeto → Authentication → Users</span></div>
                    <div className="manual-step"><span className="manual-step__num">2</span><span>Encontre o usuário e clique em "Send password reset email"</span></div>
                    <div className="manual-step"><span className="manual-step__num">3</span><span>O barbeiro receberá um email para criar nova senha</span></div>
                  </div>
                </div>
              </>
            )}

            {section === 'funcionalidades' && (
              <>
                <div className="manual-card">
                  <div className="manual-card__title">📱 Agendamento pelo Cliente</div>
                  <ul className="manual-list">
                    <li>Chat conversacional — fluxo guiado passo a passo</li>
                    <li>Escolha de barbeiro ou "Primeiro Disponível"</li>
                    <li>Filtro de serviços por categoria (Cabelo, Barba, Combo, Colorimetria)</li>
                    <li>Serviços adicionais (Sobrancelha, Pezinho, Pigmentação, Depilação Nasal)</li>
                    <li>Verificação em tempo real de horários disponíveis</li>
                    <li>Horários esgotados bloqueados automaticamente</li>
                    <li>Cancelamento por link único sem precisar de login</li>
                    <li>Reagendamento direto do link de confirmação</li>
                    <li>Link direto por barbeiro: /agendar/maikon, /agendar/gabriel, /agendar/daniel</li>
                  </ul>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">👤 Painel do Barbeiro (/barbeiro)</div>
                  <ul className="manual-list">
                    <li>Ver agendamentos de hoje, da semana ou pendentes</li>
                    <li>Confirmar e concluir atendimentos</li>
                    <li>Receita do período visível em tempo real</li>
                    <li>Link direto para WhatsApp do cliente</li>
                    <li>Acesso ao Portal de Social Media</li>
                    <li>Acesso ao Manual do Sistema</li>
                  </ul>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">👑 Painel do Admin (/admin)</div>
                  <ul className="manual-list">
                    <li><strong>Hoje / Todos:</strong> agenda completa com KPIs e busca por nome/telefone</li>
                    <li><strong>Analytics:</strong> receita, ticket médio, cancelamentos e ranking por barbeiro</li>
                    <li><strong>Agenda:</strong> configurar dias e horários de atendimento por barbeiro</li>
                    <li><strong>Serviços:</strong> editar preços, descrições e ativar/desativar serviços</li>
                    <li><strong>Equipe:</strong> editar bio, especialidade, frase e foto de cada barbeiro</li>
                    <li><strong>Clube:</strong> criar e gerenciar planos de assinatura</li>
                    <li><strong>Config:</strong> nome, endereço, WhatsApp, horários, bloquear dias</li>
                    <li><strong>Social Media:</strong> galeria com todos os posts para download</li>
                  </ul>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">🏠 Landing Page (/) </div>
                  <ul className="manual-list">
                    <li>Apresentação da barbearia com serviços e preços</li>
                    <li>Cards dos barbeiros com bio e especialidade</li>
                    <li>Seção de Planos de assinatura (gerenciados pelo Admin)</li>
                    <li>Localização e contato via WhatsApp</li>
                    <li>CTA direto para agendamento</li>
                  </ul>
                </div>
              </>
            )}

            {section === 'banco-de-dados' && (
              <>
                <div className="manual-card">
                  <div className="manual-card__title">Tabelas do Sistema</div>
                  <div className="manual-tables-list">
                    {[
                      { name: 'barbers',         desc: 'Cadastro dos barbeiros — nome, slug, bio, foto, horário de atendimento' },
                      { name: 'services',        desc: 'Serviços disponíveis — nome, categoria, preço, duração, badge' },
                      { name: 'barber_services', desc: 'Quais serviços cada barbeiro oferece (ex: Daniel oferece colorimetria)' },
                      { name: 'availability',    desc: 'Dias e horários de atendimento de cada barbeiro' },
                      { name: 'blocked_dates',   desc: 'Dias bloqueados — feriados, férias, barbearia fechada' },
                      { name: 'bookings',        desc: 'Agendamentos dos clientes com status e token de cancelamento' },
                      { name: 'plans',           desc: 'Planos de assinatura do Clube MK e BALÃO' },
                      { name: 'settings',        desc: 'Configurações da barbearia — nome, endereço, WhatsApp, horários' },
                    ].map(t => (
                      <div key={t.name} className="manual-table-item">
                        <code className="manual-table-name">{t.name}</code>
                        <span className="manual-table-desc">{t.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">Status dos Agendamentos</div>
                  <div className="manual-status-flow">
                    <span className="pill pill--pendente">pendente</span>
                    <span className="manual-status-arrow">→</span>
                    <span className="pill pill--confirmado">confirmado</span>
                    <span className="manual-status-arrow">→</span>
                    <span className="pill pill--concluido">concluído</span>
                  </div>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--dim)' }}>
                    Cancelado pode ocorrer em qualquer etapa — pelo cliente via link ou pelo admin.
                  </p>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">Acesso ao Banco</div>
                  <div className="manual-steps">
                    <div className="manual-step"><span className="manual-step__num">1</span><span>Acesse supabase.com com a conta da Fluency Works</span></div>
                    <div className="manual-step"><span className="manual-step__num">2</span><span>Selecione o projeto "mk-e-balao-barbearia"</span></div>
                    <div className="manual-step"><span className="manual-step__num">3</span><span>Table Editor para visualizar dados, SQL Editor para queries avançadas</span></div>
                  </div>
                </div>
              </>
            )}

            {section === 'suporte' && (
              <>
                <div className="manual-card">
                  <div className="manual-card__title">Contato para Suporte</div>
                  <div className="manual-info-grid">
                    <div className="manual-info-item">
                      <span className="manual-info-label">Responsável</span>
                      <span className="manual-info-value">Claudio Santana — Fluency Works</span>
                    </div>
                    <div className="manual-info-item">
                      <span className="manual-info-label">Email</span>
                      <span className="manual-info-value">csantana.gon@gmail.com</span>
                    </div>
                    <div className="manual-info-item">
                      <span className="manual-info-label">WhatsApp</span>
                      <a
                        href="https://wa.me/5514963735271"
                        target="_blank"
                        rel="noreferrer"
                        className="manual-info-value manual-info-link"
                      >
                        +55 14 96373-527
                      </a>
                    </div>
                    <div className="manual-info-item">
                      <span className="manual-info-label">Modelo de Care</span>
                      <span className="manual-info-value">R$ 270/mês — hospedagem, SSL, backup, suporte e ajustes</span>
                    </div>
                  </div>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">O que o Care cobre</div>
                  <ul className="manual-list">
                    <li>Hospedagem no Vercel (frontend) e Supabase (banco)</li>
                    <li>Certificado SSL ativo</li>
                    <li>Backup semanal dos dados</li>
                    <li>Suporte a dúvidas operacionais</li>
                    <li>Ajustes de conteúdo (serviços, preços, textos)</li>
                    <li>Atualização de fotos dos barbeiros</li>
                    <li>Monitoramento de disponibilidade</li>
                  </ul>
                </div>

                <div className="manual-card">
                  <div className="manual-card__title">Problemas comuns e soluções</div>
                  <div className="manual-faq">
                    <div className="manual-faq-item">
                      <div className="manual-faq-q">Cliente não consegue agendar um horário</div>
                      <div className="manual-faq-a">Verifique em Admin → Agenda se o dia e horário do barbeiro estão ativos. Confira também se a data não está em dias bloqueados (Admin → Config).</div>
                    </div>
                    <div className="manual-faq-item">
                      <div className="manual-faq-q">Barbeiro não vê um agendamento</div>
                      <div className="manual-faq-a">O barbeiro vê apenas os agendamentos do próprio. Confirme que o cliente escolheu o barbeiro correto. O Admin vê todos.</div>
                    </div>
                    <div className="manual-faq-item">
                      <div className="manual-faq-q">Serviço não aparece para um barbeiro</div>
                      <div className="manual-faq-a">Cada barbeiro tem uma lista de serviços configurada na tabela barber_services. Entre em contato com a Fluency Works para ajustar.</div>
                    </div>
                    <div className="manual-faq-item">
                      <div className="manual-faq-q">Esqueci a senha</div>
                      <div className="manual-faq-a">Acesse /login e use "Esqueci minha senha", ou entre em contato com a Fluency Works para reset via Supabase.</div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
