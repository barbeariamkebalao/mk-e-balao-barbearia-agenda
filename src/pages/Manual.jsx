import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const BARBER_EMAILS = {
  mk:      'mk@mkebalaobarbearia.com.br',
  balao:   'daniel@mkebalaobarbearia.com.br',
  daniel:  'daniel@mkebalaobarbearia.com.br',
  gabriel: 'gabriel@mkebalaobarbearia.com.br',
}

const SECTIONS = [
  'visao-geral',
  'funcionalidades',
  'operacoes',
  'regras',
  'banco-de-dados',
  'tecnologias',
  'usuarios',
  'suporte',
]

const SECTION_LABELS = {
  'visao-geral':     '📋 Visão Geral',
  'funcionalidades': '✂️ Funcionalidades',
  'operacoes':       '🔧 Guia de Operações',
  'regras':          '📐 Regras do Sistema',
  'banco-de-dados':  '🗄️ Banco de Dados',
  'tecnologias':     '⚙️ Tecnologias',
  'usuarios':        '👤 Usuários & Acesso',
  'suporte':         '🛠️ Suporte',
}

function Step({ num, children }) {
  return (
    <div className="manual-step">
      <span className="manual-step__num">{num}</span>
      <span>{children}</span>
    </div>
  )
}

function Card({ title, children, warning }) {
  return (
    <div className={`manual-card${warning ? ' manual-card--warning' : ''}`}>
      {title && <div className="manual-card__title">{title}</div>}
      {children}
    </div>
  )
}

function SubSection({ title }) {
  return <div className="manual-subsection-title">{title}</div>
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
        supabase.from('barbers').select('name, slug, speciality, role, interval_minutes').neq('role', 'admin').order('sort_order'),
        supabase.from('settings').select('*').eq('id', 1).single(),
      ])
      setBarbers(b || [])
      setSettings(s || {})
    }
    load()
  }, [])

  return (
    <div className="admin-layout">
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

      <main className="admin-main">
        <div className="admin-topbar">
          <button className="admin-topbar__back" onClick={() => navigate(backPath)}>← Voltar</button>
          <div className="admin-topbar__title">
            <span className="admin-topbar__name">Manual do Sistema</span>
            <span className="admin-topbar__tab-label">{SECTION_LABELS[section]}</span>
          </div>
        </div>

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

            {/* ── VISÃO GERAL ────────────────────────────────────── */}
            {section === 'visao-geral' && (
              <>
                <div className="manual-hero">
                  <img src="/logo-escudo.jpg" alt="MK e BALÃO" className="manual-hero__logo" />
                  <div>
                    <h1 className="manual-hero__title">MK e BALÃO Barbearia</h1>
                    <p className="manual-hero__subtitle">Sistema de Agendamento Online — Fluency Agenda v2.0</p>
                  </div>
                </div>

                <Card title="O que é este sistema">
                  <p>Plataforma completa de agendamento online desenvolvida pela <strong>Fluency Works</strong> exclusivamente para a MK e BALÃO Barbearia. Clientes agendam, barbeiros gerenciam sua agenda e o admin controla tudo — a qualquer hora, de qualquer dispositivo.</p>
                </Card>

                <Card title="Desenvolvido por">
                  <div className="manual-info-grid">
                    {[
                      ['Estúdio',        'Fluency Works'],
                      ['Responsável',    'Claudio Santana'],
                      ['Email',          'csantana.gon@gmail.com'],
                      ['WhatsApp',       '+55 14 96373-527'],
                      ['Versão',         '2.0 — Outubro 2026'],
                      ['Produto',        'Fluency Agenda'],
                    ].map(([label, value]) => (
                      <div key={label} className="manual-info-item">
                        <span className="manual-info-label">{label}</span>
                        <span className="manual-info-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Rotas do sistema">
                  <div className="manual-routes-list">
                    {[
                      ['/', 'Landing page — apresentação da barbearia ao público'],
                      ['/agendar', 'Chatbot de agendamento — acesso público'],
                      ['/agendar/:slug', 'Agendamento direto por barbeiro — ex: /agendar/maikon'],
                      ['/confirmado', 'Confirmação após agendamento bem-sucedido'],
                      ['/cancelar/:token', 'Cancelamento de agendamento via link único'],
                      ['/login', 'Login para barbeiros e admin'],
                      ['/barbeiro', 'Painel do barbeiro — requer login'],
                      ['/admin', 'Painel do admin — requer login de admin'],
                      ['/portal', 'Portal de Social Media — requer login'],
                      ['/manual', 'Este manual — requer login'],
                      ['/marca', 'Manual da marca — requer login'],
                      ['/hub', 'Hub de navegação rápida — requer login'],
                    ].map(([route, desc]) => (
                      <div key={route} className="manual-route-item">
                        <code className="manual-route-path">{route}</code>
                        <span className="manual-route-desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Como o agendamento funciona">
                  <div className="manual-steps">
                    <Step num="1">Cliente acessa o link e inicia o chat de agendamento</Step>
                    <Step num="2">Digita o nome — sistema verifica se é cliente recorrente</Step>
                    <Step num="3">Escolhe barbeiro (ou "Primeiro Disponível")</Step>
                    <Step num="4">Escolhe categoria e serviço (com preço e duração)</Step>
                    <Step num="5">Escolhe serviços adicionais opcionais</Step>
                    <Step num="6">Escolhe data e horário disponível</Step>
                    <Step num="7">Confirma com nome e telefone — agendamento registrado</Step>
                    <Step num="8">Barbeiro vê no painel /barbeiro em tempo real</Step>
                    <Step num="9">Cliente recebe link de cancelamento por referência</Step>
                  </div>
                </Card>
              </>
            )}

            {/* ── FUNCIONALIDADES ─────────────────────────────────── */}
            {section === 'funcionalidades' && (
              <>
                <Card title="📱 Chatbot de Agendamento (/agendar)">
                  <ul className="manual-list">
                    <li>Fluxo conversacional guiado — o cliente nunca fica sem saber o que fazer</li>
                    <li>Cliente recorrente: sistema reconhece pelo telefone salvo e exibe o próximo agendamento</li>
                    <li>Opção "Primeiro Disponível" — escolhe automaticamente o barbeiro com o horário mais cedo no dia</li>
                    <li>Filtro de categoria (Cabelo, Barba, Combo, Colorimetria) por barbeiro</li>
                    <li>Auto-pulo de categoria quando barbeiro tem somente uma disponível</li>
                    <li>Serviços adicionais (Sobrancelha, Pezinho, Pigmentação, Depilação Nasal) com soma de valor e tempo</li>
                    <li>Slots calculados em tempo real — horários ocupados bloqueados automaticamente</li>
                    <li>Almoço 12:00–13:00 bloqueado para todos os barbeiros todos os dias</li>
                    <li>Cancelamento pelo link único — sem login necessário</li>
                    <li>Link direto por barbeiro: /agendar/maikon · /agendar/gabriel · /agendar/daniel</li>
                  </ul>
                </Card>

                <Card title="👤 Painel do Barbeiro (/barbeiro)">
                  <ul className="manual-list">
                    <li>Visão de agendamentos de hoje, desta semana ou pendentes</li>
                    <li>Confirmar agendamento (muda status de pendente → confirmado)</li>
                    <li>Concluir atendimento (muda status para concluído)</li>
                    <li>Cancelar agendamento com motivo</li>
                    <li>Receita do período calculada em tempo real</li>
                    <li>Acesso ao WhatsApp do cliente com um toque</li>
                    <li>Links para Portal de Social Media, Manual e Hub</li>
                    <li>Vê apenas seus próprios agendamentos (não vê os dos outros barbeiros)</li>
                  </ul>
                </Card>

                <Card title="👑 Painel do Admin (/admin) — Visão Geral">
                  <ul className="manual-list">
                    <li><strong>Hoje / Todos:</strong> agenda completa com KPIs (receita, ticket médio, total de atendimentos), busca por nome ou telefone, filtro por status</li>
                    <li><strong>Analytics:</strong> receita mensal e semanal, ranking de barbeiros, ticket médio, taxa de cancelamento</li>
                    <li><strong>Agenda:</strong> dias e horários de atendimento por barbeiro (toggle por dia + inputs de horário)</li>
                    <li><strong>Serviços:</strong> CRUD completo — nome, categoria, preço, duração, badge, is_addon, ativo/inativo</li>
                    <li><strong>Equipe:</strong> CRUD de barbeiros — nome, slug, bio, especialidade, frase, foto, intervalo de atendimento, ordem de exibição</li>
                    <li><strong>Fiado:</strong> gestão de crédito dos clientes — lançar débito/crédito, histórico, notificar por WhatsApp</li>
                    <li><strong>Galeria:</strong> upload de fotos para o portal de social media dos barbeiros</li>
                    <li><strong>Clube:</strong> criar e gerenciar planos de assinatura</li>
                    <li><strong>Config:</strong> nome, endereço, WhatsApp, horários de funcionamento, bloquear datas específicas</li>
                  </ul>
                </Card>

                <Card title="💰 Módulo Fiado (Admin → Fiado)">
                  <ul className="manual-list">
                    <li>Registra crédito e débito por cliente (pelo telefone)</li>
                    <li>Histórico completo de transações por cliente</li>
                    <li>Saldo atual de cada cliente visível na listagem</li>
                    <li>Busca por nome ou telefone</li>
                    <li>Botão de notificação WhatsApp — envia saldo diretamente ao cliente</li>
                    <li>KPI de total de fiado exibido no card do barbeiro na Home</li>
                  </ul>
                </Card>

                <Card title="🖼️ Módulo Galeria (Admin → Galeria)">
                  <ul className="manual-list">
                    <li>Upload de fotos via drag-and-drop ou seleção de arquivo</li>
                    <li>Fotos aparecem no Portal de Social Media dos barbeiros (/portal)</li>
                    <li>Barbeiros podem baixar as imagens pelo portal</li>
                    <li>Admin pode excluir imagens da galeria</li>
                    <li>Suporte a JPG, PNG, WebP</li>
                  </ul>
                </Card>

                <Card title="🏠 Landing Page (/)">
                  <ul className="manual-list">
                    <li>Apresentação da barbearia com slogan e identidade visual</li>
                    <li>Ticker de serviços em destaque</li>
                    <li>Cards dos barbeiros com bio, especialidade e botão WhatsApp</li>
                    <li>Galeria de serviços com fotos e preços</li>
                    <li>Indicador ao vivo de "Aberto / Fechado" baseado no horário de Brasília</li>
                    <li>Planos do Clube MK e BALÃO (gerenciados pelo Admin)</li>
                    <li>Localização via mapa Google Maps embutido</li>
                    <li>FAQ com perguntas frequentes</li>
                    <li>CTA flutuante para agendamento (FAB)</li>
                  </ul>
                </Card>
              </>
            )}

            {/* ── GUIA DE OPERAÇÕES ───────────────────────────────── */}
            {section === 'operacoes' && (
              <>
                <SubSection title="Agenda dos Barbeiros" />

                <Card title="Como configurar os dias e horários de um barbeiro">
                  <div className="manual-steps">
                    <Step num="1">Acesse <strong>/admin</strong> e faça login como administrador</Step>
                    <Step num="2">Clique na aba <strong>"Agenda"</strong> no menu lateral</Step>
                    <Step num="3">Localize o card do barbeiro desejado</Step>
                    <Step num="4">Para cada dia da semana, ligue o toggle para "Aberto"</Step>
                    <Step num="5">Ajuste os horários de início e fim (os inputs de hora aparecem quando o dia está aberto)</Step>
                    <Step num="6">Clique em <strong>"Salvar agenda de [Nome]"</strong></Step>
                  </div>
                  <div className="manual-note">
                    O almoço 12:00–13:00 é bloqueado automaticamente pelo sistema — não precisa configurar. Domingo permanece fechado por padrão.
                  </div>
                </Card>

                <Card title="Como bloquear uma data específica (feriado, férias)">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Config</strong></Step>
                    <Step num="2">Role até a seção <strong>"Datas Bloqueadas"</strong></Step>
                    <Step num="3">Selecione a data no calendário e clique em "Bloquear"</Step>
                    <Step num="4">A data ficará indisponível para todos os barbeiros</Step>
                  </div>
                </Card>

                <SubSection title="Equipe" />

                <Card title="Como cadastrar um novo barbeiro">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Equipe</strong></Step>
                    <Step num="2">Clique em <strong>"+ Novo Barbeiro"</strong></Step>
                    <Step num="3">Preencha: Nome completo, Slug (URL — ex: "joao"), Telefone (WhatsApp)</Step>
                    <Step num="4">Preencha: Especialidade, Citação (frase exibida na Home), Bio</Step>
                    <Step num="5">Escolha o <strong>Intervalo de atendimento</strong> (30, 40, 50 ou 60 min)</Step>
                    <Step num="6">Defina a <strong>Ordem de exibição</strong> (número — menor aparece primeiro)</Step>
                    <Step num="7">Faça upload da foto (opcional)</Step>
                    <Step num="8">Clique em <strong>"Criar Barbeiro"</strong></Step>
                    <Step num="9">O sistema cria automaticamente a disponibilidade Seg–Sáb 09:00–19:00 (Sábado até 20:00)</Step>
                    <Step num="10">Ajuste os horários em <strong>Admin → Agenda</strong> se necessário</Step>
                  </div>
                  <div className="manual-note">
                    Para que o barbeiro consiga fazer login no sistema, entre em contato com a Fluency Works para criar o usuário no Supabase Auth e vincular ao cadastro.
                  </div>
                </Card>

                <Card title="Como editar dados de um barbeiro">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Equipe</strong></Step>
                    <Step num="2">Clique no ícone de edição (lápis) ao lado do barbeiro</Step>
                    <Step num="3">Edite os campos desejados</Step>
                    <Step num="4">Clique em <strong>"Salvar"</strong></Step>
                  </div>
                </Card>

                <Card title="Como alterar o intervalo de atendimento de um barbeiro">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Equipe</strong></Step>
                    <Step num="2">Clique no ícone de edição do barbeiro</Step>
                    <Step num="3">No campo <strong>"Intervalo de atendimento"</strong>, selecione 30, 40, 50 ou 60 min</Step>
                    <Step num="4">Salve. Os slots do barbeiro serão recalculados automaticamente</Step>
                  </div>
                  <div className="manual-note">
                    O intervalo define o "passo" entre slots. Com 50 min: 09:00, 09:50, 10:40, 11:30... Com 60 min: 09:00, 10:00, 11:00...
                  </div>
                </Card>

                <SubSection title="Serviços" />

                <Card title="Como editar preço ou duração de um serviço">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Serviços</strong></Step>
                    <Step num="2">Clique em "Editar" no serviço desejado</Step>
                    <Step num="3">Altere o preço (R$) e/ou a duração (minutos)</Step>
                    <Step num="4">Salve. O valor já aparece atualizado no chatbot e na Home</Step>
                  </div>
                </Card>

                <Card title="Como ativar ou desativar um serviço">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Serviços</strong></Step>
                    <Step num="2">Use o toggle ao lado do serviço</Step>
                    <Step num="3">Serviços inativos não aparecem no chatbot de agendamento</Step>
                  </div>
                </Card>

                <SubSection title="Fiado" />

                <Card title="Como registrar um fiado (cliente deve)">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Fiado</strong></Step>
                    <Step num="2">Busque o cliente pelo nome ou telefone</Step>
                    <Step num="3">Clique em <strong>"Novo Lançamento"</strong></Step>
                    <Step num="4">Selecione "Débito", informe o valor e descrição</Step>
                    <Step num="5">Confirme. O saldo do cliente é atualizado</Step>
                  </div>
                </Card>

                <Card title="Como registrar um pagamento (cliente pagou o fiado)">
                  <div className="manual-steps">
                    <Step num="1">No mesmo módulo Fiado, busque o cliente</Step>
                    <Step num="2">Clique em <strong>"Novo Lançamento"</strong></Step>
                    <Step num="3">Selecione "Crédito", informe o valor</Step>
                    <Step num="4">Confirme. O saldo é reduzido</Step>
                  </div>
                </Card>

                <Card title="Como notificar cliente do saldo via WhatsApp">
                  <div className="manual-steps">
                    <Step num="1">Na listagem de Fiado, localize o cliente</Step>
                    <Step num="2">Clique no ícone do WhatsApp ao lado do nome</Step>
                    <Step num="3">O sistema abre o WhatsApp com mensagem pré-preenchida com o saldo</Step>
                  </div>
                </Card>

                <SubSection title="Agendamentos" />

                <Card title="Como cancelar um agendamento pelo admin">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Hoje</strong> ou <strong>Todos</strong></Step>
                    <Step num="2">Localize o agendamento (use a busca por nome ou telefone)</Step>
                    <Step num="3">Clique em <strong>"Cancelar"</strong></Step>
                    <Step num="4">Confirme o cancelamento</Step>
                  </div>
                </Card>

                <Card title="Como o cliente cancela pelo próprio link">
                  <div className="manual-steps">
                    <Step num="1">Cliente acessa o link de confirmação que recebeu</Step>
                    <Step num="2">Ou acessa /agendar — o chat reconhece o agendamento pelo telefone salvo</Step>
                    <Step num="3">Clica em <strong>"Cancelar este agendamento"</strong></Step>
                    <Step num="4">O status muda para "cancelado" — o horário fica disponível novamente</Step>
                  </div>
                </Card>

                <SubSection title="Configurações Gerais" />

                <Card title="Como atualizar WhatsApp, endereço ou horários da barbearia">
                  <div className="manual-steps">
                    <Step num="1">Vá em <strong>Admin → Config</strong></Step>
                    <Step num="2">Edite os campos desejados: nome, endereço, WhatsApp, horário de funcionamento exibido na Home</Step>
                    <Step num="3">Salve. As alterações aparecem imediatamente na Landing Page</Step>
                  </div>
                </Card>
              </>
            )}

            {/* ── REGRAS DO SISTEMA ───────────────────────────────── */}
            {section === 'regras' && (
              <>
                <Card title="Regras de Horário" warning={false}>
                  <div className="manual-rules-list">
                    <div className="manual-rule">
                      <span className="manual-rule__label">Horário padrão Seg–Sex</span>
                      <span className="manual-rule__value">09:00 às 19:00</span>
                    </div>
                    <div className="manual-rule">
                      <span className="manual-rule__label">Horário padrão Sábado</span>
                      <span className="manual-rule__value">09:00 às 20:00</span>
                    </div>
                    <div className="manual-rule">
                      <span className="manual-rule__label">Domingo</span>
                      <span className="manual-rule__value">Fechado por padrão</span>
                    </div>
                    <div className="manual-rule">
                      <span className="manual-rule__label">Almoço</span>
                      <span className="manual-rule__value">12:00 – 13:00 bloqueado para todos os barbeiros, todos os dias, automaticamente</span>
                    </div>
                  </div>
                </Card>

                <Card title="Horários personalizados por barbeiro">
                  <p>Cada barbeiro pode ter horários diferentes do padrão. As configurações ficam em <strong>Admin → Agenda</strong>. As regras acima são apenas o ponto de partida ao cadastrar um novo barbeiro.</p>
                </Card>

                <Card title="Intervalo de atendimento por barbeiro">
                  <p style={{ marginBottom: '0.75rem' }}>Cada barbeiro tem seu próprio intervalo, definido em <strong>Admin → Equipe</strong>. O intervalo determina o espaçamento entre slots:</p>
                  <div className="manual-intervals">
                    {[
                      ['30 min', 'Ideal para serviços rápidos (sobrancelha, barba simples)'],
                      ['40 min', 'Ritmo médio-rápido'],
                      ['50 min', 'Padrão — corte completo com acabamento'],
                      ['60 min', 'Ideal para combos ou serviços mais elaborados'],
                    ].map(([interval, desc]) => (
                      <div key={interval} className="manual-interval-item">
                        <span className="manual-interval-badge">{interval}</span>
                        <span className="manual-interval-desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="manual-note">
                    Exemplo com 50 min: slots às 09:00 · 09:50 · 10:40 · 11:30 · (almoço) · 13:10 · 14:00 · 14:50...
                  </div>
                </Card>

                <Card title="Cálculo de duração do atendimento">
                  <p>A duração total usada no cálculo de slots é a <strong>soma das durações</strong> de todos os serviços escolhidos (serviço principal + adicionais). Um slot só aparece disponível se houver tempo suficiente até o próximo bloqueio.</p>
                  <div className="manual-example">
                    <div className="manual-example__title">Exemplo</div>
                    <div>Corte (40 min) + Barba (25 min) + Sobrancelha (15 min) = <strong>80 min</strong></div>
                    <div>Com intervalo de 50 min, slot das 10:00 bloqueia até 11:20</div>
                  </div>
                </Card>

                <Card title="Regras de cancelamento">
                  <ul className="manual-list">
                    <li>Cliente pode cancelar pelo link único a qualquer momento antes do horário</li>
                    <li>Admin pode cancelar qualquer agendamento pelo painel</li>
                    <li>Agendamento cancelado libera o horário imediatamente para novos agendamentos</li>
                    <li>Agendamentos cancelados ficam no histórico com status "cancelado"</li>
                  </ul>
                </Card>

                <Card title="Status dos agendamentos">
                  <div className="manual-status-flow">
                    <span className="pill pill--pendente">pendente</span>
                    <span className="manual-status-arrow">→</span>
                    <span className="pill pill--confirmado">confirmado</span>
                    <span className="manual-status-arrow">→</span>
                    <span className="pill pill--concluido">concluído</span>
                  </div>
                  <div className="manual-status-notes">
                    <div><span className="pill pill--pendente">pendente</span> — registrado pelo cliente, aguardando confirmação do barbeiro</div>
                    <div><span className="pill pill--confirmado">confirmado</span> — barbeiro confirmou, horário garantido</div>
                    <div><span className="pill pill--concluido">concluído</span> — atendimento realizado</div>
                    <div><span className="pill pill--cancelado">cancelado</span> — cancelado pelo cliente ou admin (pode ocorrer em qualquer etapa)</div>
                  </div>
                </Card>

                <Card title="Regras de segurança e acesso">
                  <ul className="manual-list">
                    <li>Barbeiro acessa somente seus próprios agendamentos — não vê dados dos outros</li>
                    <li>Admin vê e gerencia tudo</li>
                    <li>RLS (Row Level Security) no banco garante isolamento mesmo se alguém tentar acessar diretamente</li>
                    <li>Cancelamento por cliente não requer login — usa token único por agendamento</li>
                    <li>Dados de clientes (nome + telefone) ficam apenas no banco — não expostos publicamente</li>
                  </ul>
                </Card>
              </>
            )}

            {/* ── BANCO DE DADOS ──────────────────────────────────── */}
            {section === 'banco-de-dados' && (
              <>
                <Card title="Tabelas do Sistema">
                  <div className="manual-tables-list">
                    {[
                      { name: 'barbers',         desc: 'Cadastro dos barbeiros — nome, slug, bio, foto, intervalo de atendimento, ordem, role' },
                      { name: 'services',        desc: 'Serviços disponíveis — nome, categoria, preço, duração em minutos, badge, is_addon, active' },
                      { name: 'barber_services', desc: 'Quais serviços cada barbeiro oferece (ex: Daniel oferece colorimetria, outros não)' },
                      { name: 'availability',    desc: 'Disponibilidade por barbeiro por dia — start_time, end_time, active (chave: barber_id + day_of_week)' },
                      { name: 'blocked_dates',   desc: 'Datas bloqueadas para toda a barbearia — feriados, férias, dias fechados' },
                      { name: 'bookings',        desc: 'Agendamentos dos clientes — data, hora, status, serviços (JSONB), total_minutes, cancel_token' },
                      { name: 'fiado',           desc: 'Lançamentos de crédito/débito por cliente — tipo, valor, saldo corrente, created_at' },
                      { name: 'plans',           desc: 'Planos de assinatura do Clube MK e BALÃO — nome, preço, benefícios' },
                      { name: 'settings',        desc: 'Configurações da barbearia — nome, endereço, WhatsApp, horário de funcionamento exibido' },
                    ].map(t => (
                      <div key={t.name} className="manual-table-item">
                        <code className="manual-table-name">{t.name}</code>
                        <span className="manual-table-desc">{t.desc}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Campos principais da tabela bookings">
                  <div className="manual-tables-list">
                    {[
                      ['id',            'UUID — identificador único do agendamento'],
                      ['barber_id',     'FK → barbers.id'],
                      ['client_name',   'Nome informado pelo cliente'],
                      ['client_phone',  'Telefone — usado para reconhecer cliente recorrente'],
                      ['date',          'Data no formato YYYY-MM-DD'],
                      ['time',          'Horário no formato HH:MM'],
                      ['services',      'JSONB — array com {name, price, duration_minutes, is_addon}'],
                      ['total_minutes', 'Soma das durações de todos os serviços — usado no cálculo de slots'],
                      ['status',        'pendente | confirmado | concluído | cancelado'],
                      ['cancel_token',  'UUID único — permite cancelamento sem login'],
                      ['created_at',    'Timestamp de criação'],
                    ].map(([field, desc]) => (
                      <div key={field} className="manual-table-item">
                        <code className="manual-table-name">{field}</code>
                        <span className="manual-table-desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Acesso ao Banco">
                  <div className="manual-steps">
                    <Step num="1">Acesse supabase.com com a conta da Fluency Works</Step>
                    <Step num="2">Selecione o projeto "mk-e-balao-barbearia"</Step>
                    <Step num="3">Table Editor para visualizar e editar dados manualmente</Step>
                    <Step num="4">SQL Editor para consultas avançadas e relatórios</Step>
                    <Step num="5">Authentication → Users para gerenciar logins dos barbeiros</Step>
                  </div>
                </Card>
              </>
            )}

            {/* ── TECNOLOGIAS ─────────────────────────────────────── */}
            {section === 'tecnologias' && (
              <>
                <Card title="Stack Frontend">
                  <div className="manual-tech-grid">
                    {[
                      ['React 18',        'Framework de interface — componentes, estado, rotas'],
                      ['Vite 5',          'Build tool — hot reload em dev, bundle otimizado em produção'],
                      ['Tailwind CSS v3', 'Sistema de estilos — tokens de cor e tipografia customizados para a identidade da MK e BALÃO'],
                      ['React Router v6', 'Navegação — /agendar, /admin, /barbeiro, /cancelar, etc.'],
                      ['Supabase JS v2',  'SDK para banco de dados, autenticação e realtime'],
                    ].map(([name, desc]) => (
                      <div key={name} className="manual-tech-item">
                        <span className="manual-tech-name">{name}</span>
                        <span className="manual-tech-desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Backend — Supabase (BaaS)">
                  <div className="manual-tech-grid">
                    {[
                      ['PostgreSQL',            'Banco de dados relacional gerenciado'],
                      ['Row Level Security',    'Segurança por linha — barbeiro vê só seus dados, cliente cria apenas o próprio agendamento'],
                      ['Supabase Auth',         'Autenticação de barbeiros e admin por email + senha'],
                      ['Supabase Storage',      'Bucket barber-images — fotos dos barbeiros e galeria de posts'],
                      ['Supabase Realtime',     'Notificações em tempo real no painel do barbeiro quando chega novo agendamento'],
                    ].map(([name, desc]) => (
                      <div key={name} className="manual-tech-item">
                        <span className="manual-tech-name">{name}</span>
                        <span className="manual-tech-desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Hospedagem & Deploy">
                  <div className="manual-tech-grid">
                    {[
                      ['Vercel',  'Hospedagem do frontend — deploy automático a cada push no GitHub'],
                      ['GitHub',  'Controle de versão e repositório do código-fonte'],
                    ].map(([name, desc]) => (
                      <div key={name} className="manual-tech-item">
                        <span className="manual-tech-name">{name}</span>
                        <span className="manual-tech-desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Variáveis de Ambiente">
                  <p style={{ marginBottom: '0.75rem', color: 'var(--dim)', fontSize: '0.875rem' }}>Configuradas no painel da Vercel e no arquivo <code>.env.local</code> em desenvolvimento.</p>
                  <div className="manual-env-list">
                    <div className="manual-env-item">
                      <code>VITE_SUPABASE_URL</code>
                      <span>URL do projeto no Supabase</span>
                    </div>
                    <div className="manual-env-item">
                      <code>VITE_SUPABASE_ANON_KEY</code>
                      <span>Chave anônima pública — acesso controlado por RLS</span>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* ── USUÁRIOS & ACESSO ───────────────────────────────── */}
            {section === 'usuarios' && (
              <>
                <Card title="⚠️ Confidencial" warning>
                  <p>Estas credenciais são de acesso restrito. Não compartilhe fora da equipe da barbearia.</p>
                </Card>

                <Card title="👑 Administrador">
                  <div className="manual-credentials">
                    {[
                      ['Acesso',      '/admin'],
                      ['Email',       settings?.admin_email || 'admin@mkebalaobarbearia.com.br'],
                      ['Senha',       '123456'],
                      ['Permissões',  'Total — vê todos os agendamentos, gerencia serviços, equipe, agenda, fiado, galeria, clube e configurações'],
                    ].map(([label, value]) => (
                      <div key={label} className="manual-cred-row">
                        <span className="manual-cred-label">{label}</span>
                        <span className="manual-cred-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="✂️ Barbeiros">
                  <div className="manual-barbers-list">
                    {barbers.map(b => (
                      <div key={b.slug} className="manual-barber-item">
                        <div className="manual-barber-item__name">{b.name}</div>
                        {[
                          ['Email',          BARBER_EMAILS[b.slug] || `${b.slug}@mkebalaobarbearia.com.br`],
                          ['Senha',          '123456'],
                          ['Painel',         '/barbeiro'],
                          ['Link direto',    `/agendar/${b.slug}`],
                          ['Especialidade',  b.speciality || 'Barbeiro'],
                          ['Intervalo',      `${b.interval_minutes || 50} min por atendimento`],
                        ].map(([label, value]) => (
                          <div key={label} className="manual-cred-row">
                            <span className="manual-cred-label">{label}</span>
                            <span className="manual-cred-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="🔑 Como resetar senha de um barbeiro">
                  <div className="manual-steps">
                    <Step num="1">Acesse supabase.com → seu projeto → Authentication → Users</Step>
                    <Step num="2">Encontre o usuário pelo email e clique em "Send password reset email"</Step>
                    <Step num="3">O barbeiro receberá um email para criar nova senha</Step>
                    <Step num="4">Alternativamente, acesse /login e use a opção "Esqueci minha senha"</Step>
                  </div>
                </Card>

                <Card title="🆕 Como criar acesso de login para um novo barbeiro">
                  <div className="manual-steps">
                    <Step num="1">Entre em contato com a Fluency Works (Claudio Santana)</Step>
                    <Step num="2">Informe o nome, email e slug do barbeiro já cadastrado no sistema</Step>
                    <Step num="3">A Fluency Works cria o usuário no Supabase Auth e vincula ao cadastro do barbeiro</Step>
                    <Step num="4">Barbeiro recebe email de confirmação e cria sua senha</Step>
                  </div>
                </Card>
              </>
            )}

            {/* ── SUPORTE ─────────────────────────────────────────── */}
            {section === 'suporte' && (
              <>
                <Card title="Contato para Suporte">
                  <div className="manual-info-grid">
                    {[
                      ['Responsável',     'Claudio Santana — Fluency Works'],
                      ['Email',           'csantana.gon@gmail.com'],
                      ['Modelo de Care',  'R$ 270/mês — hospedagem, SSL, backup, suporte e ajustes'],
                    ].map(([label, value]) => (
                      <div key={label} className="manual-info-item">
                        <span className="manual-info-label">{label}</span>
                        <span className="manual-info-value">{value}</span>
                      </div>
                    ))}
                    <div className="manual-info-item">
                      <span className="manual-info-label">WhatsApp</span>
                      <a href="https://wa.me/5514963735271" target="_blank" rel="noreferrer" className="manual-info-value manual-info-link">
                        +55 14 96373-527
                      </a>
                    </div>
                  </div>
                </Card>

                <Card title="O que o Care cobre">
                  <ul className="manual-list">
                    <li>Hospedagem no Vercel (frontend) e Supabase (banco)</li>
                    <li>Certificado SSL ativo e renovação automática</li>
                    <li>Backup semanal dos dados</li>
                    <li>Suporte a dúvidas operacionais</li>
                    <li>Ajustes de conteúdo (serviços, preços, textos, fotos)</li>
                    <li>Monitoramento de disponibilidade</li>
                    <li>Melhorias e novas funcionalidades conforme plano acordado</li>
                  </ul>
                </Card>

                <Card title="Problemas comuns e soluções">
                  <div className="manual-faq">
                    {[
                      {
                        q: 'Cliente não consegue agendar um horário',
                        a: 'Verifique em Admin → Agenda se o dia e horário do barbeiro estão ativos. Confira se a data não está em dias bloqueados (Admin → Config). Confirme também que o serviço desejado está ativo (Admin → Serviços).',
                      },
                      {
                        q: 'Barbeiro não vê um agendamento no painel',
                        a: 'O barbeiro vê somente os próprios agendamentos. Confirme que o cliente escolheu o barbeiro correto. Se necessário, o Admin pode consultar em Admin → Todos.',
                      },
                      {
                        q: 'Serviço não aparece para um barbeiro específico',
                        a: 'Cada barbeiro tem uma lista de serviços vinculada na tabela barber_services. Entre em contato com a Fluency Works para ajustar quais serviços cada barbeiro oferece.',
                      },
                      {
                        q: 'O horário de almoço não está sendo bloqueado',
                        a: 'O bloqueio do almoço (12:00–13:00) é automático e não depende de configuração. Se aparecer disponível, entre em contato com a Fluency Works — pode ser uma atualização necessária no sistema.',
                      },
                      {
                        q: 'Esqueci a senha de acesso',
                        a: 'Acesse /login e clique em "Esqueci minha senha". Um email de redefinição será enviado. Se não receber, entre em contato com a Fluency Works.',
                      },
                      {
                        q: 'Cliente quer cancelar mas perdeu o link',
                        a: 'O admin pode cancelar o agendamento diretamente em Admin → Todos, buscando pelo nome ou telefone do cliente.',
                      },
                      {
                        q: 'Como saber o faturamento do mês',
                        a: 'Acesse Admin → Analytics. O painel mostra receita mensal, semanal, ticket médio e ranking por barbeiro.',
                      },
                      {
                        q: 'Como adicionar um serviço novo ao catálogo',
                        a: 'Vá em Admin → Serviços → "+ Novo Serviço". Preencha nome, categoria, preço e duração. Após criar, o serviço já aparece no chatbot de agendamento. Lembre-se de vincular ao(s) barbeiro(s) que o oferecem (via Fluency Works).',
                      },
                      {
                        q: 'Fotos dos barbeiros não aparecem na Home',
                        a: 'Acesse Admin → Equipe, clique em editar o barbeiro e faça upload da foto. O sistema aceita JPG e PNG. Se o problema persistir, entre em contato com a Fluency Works.',
                      },
                    ].map((item, i) => (
                      <div key={i} className="manual-faq-item">
                        <div className="manual-faq-q">{item.q}</div>
                        <div className="manual-faq-a">{item.a}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
