import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SECTIONS = {
  caminhos: '📋 Caminhos e links', assistentes: '💬 Assistentes individuais',
  acesso: '👤 Login e perfis', admin: '👑 Administrador geral',
  barbeiro: '✂️ Painel do barbeiro', operacoes: '🔧 Guia de operações',
  regras: '📐 Regras e dados', celular: '📱 Uso no celular', suporte: '🛠️ Ajuda',
}

const ROUTES = [
  ['/', 'Site da barbearia', 'Público', 'Apresentação, equipe, serviços, galeria, clube e localização.'],
  ['/agendar', 'Assistente geral', 'Público', 'Escolha profissional, serviço, adicionais, data e horário pelo chat.'],
  ['/agendar/maikon', 'Assistente do Maikon MK', 'Público', 'Agendamento com Maikon já selecionado.'],
  ['/agendar/daniel', 'Assistente do Daniel Balão', 'Público', 'Agendamento com Daniel já selecionado.'],
  ['/agendar/gabriel', 'Assistente do Gabriel Oliveira', 'Público', 'Agendamento com Gabriel já selecionado.'],
  ['/agendar/:slug', 'Outro profissional', 'Público', 'Substitua :slug pelo identificador cadastrado em Equipe.'],
  ['/confirmado', 'Confirmação', 'Após agendar', 'Resumo da reserva; abra pelo fluxo de agendamento.'],
  ['/cancelar/:token', 'Cancelamento', 'Link individual', 'Use o link da reserva. O token é pessoal e não deve ser publicado.'],
  ['/login', 'Entrada da equipe', 'Público', 'Login por e-mail e senha e recuperação de acesso.'],
  ['/admin', 'Administrador geral', 'Login de admin', 'Agenda completa, relatórios e gestão da barbearia.'],
  ['/barbeiro', 'Painel do barbeiro', 'Login', 'Agenda e configurações do profissional autenticado.'],
  ['/portal', 'Social Media', 'Login', 'Conteúdo visual disponível para a equipe consultar e baixar.'],
  ['/manual', 'Manual do sistema', 'Público', 'Guia dos caminhos, recursos e instruções de uso.'],
  ['/marca', 'Manual da marca', 'Login', 'Identidade visual e materiais da marca.'],
  ['/hub', 'Central de links', 'Login', 'Atalhos para os assistentes e áreas internas.'],
]

const ADMIN_ITEMS = [
  ['Dashboard', 'Visão geral, indicadores e agendamentos de hoje.'],
  ['Agendamentos', 'Busca por nome ou telefone, filtros, paginação e ações sobre as reservas.'],
  ['Analytics', 'Receitas e métricas do período, ticket médio e desempenho por profissional.'],
  ['Disponibilidade', 'Dias de atendimento e horários de início e fim por barbeiro.'],
  ['Serviços', 'Cadastro, preço, duração, categoria, adicionais e ativação dos serviços.'],
  ['Serv./Barbeiro', 'Vínculo dos serviços que cada profissional oferece no assistente.'],
  ['Equipe', 'Nome, slug, perfil, foto, telefone, ordem e intervalo de atendimento.'],
  ['Chat & Agenda', 'Personalidade, textos e parâmetros disponíveis para o agendamento.'],
  ['Clube', 'Cadastro e gestão dos planos de assinatura e benefícios.'],
  ['Fiado', 'Atendimentos a prazo, vencimentos, pagamentos e cobranças.'],
  ['Galeria', 'Upload, edição e remoção de imagens disponibilizadas pelo módulo.'],
  ['Configurações', 'Dados da barbearia, contatos, horários exibidos e bloqueios globais de datas.'],
]

const BARBER_ITEMS = [
  ['Hoje / Semana / Pendentes', 'Lista os atendimentos conforme o período e a situação. O próximo horário recebe destaque.'],
  ['Fiado', 'Lançamentos a prazo dos próprios clientes, vencimentos e pagamentos.'],
  ['Config', 'Ajusta o intervalo entre horários de início dos atendimentos.'],
  ['Agendar para cliente', 'Abre o assistente individual do profissional autenticado.'],
  ['Compartilhar link', 'Copia o endereço do seu assistente para enviar aos clientes.'],
  ['Bloquear dia', 'Bloqueia uma data na própria agenda e permite remover o bloqueio.'],
  ['Atualizar', 'Recarrega os agendamentos do painel.'],
  ['Concluir / Cancelar', 'Atualiza a situação do atendimento escolhido.'],
  ['WhatsApp / Atrasado', 'Abre conversa ou mensagem pronta; revise antes de enviar.'],
  ['Nome do cliente', 'Abre o histórico disponível para esse profissional.'],
  ['Social / Manual / Marca / Hub', 'Atalhos para conteúdo visual, guias e links.'],
]

const FALLBACK_BARBERS = [
  { name: 'Maikon MK', slug: 'maikon' }, { name: 'Daniel Balão', slug: 'daniel' },
  { name: 'Gabriel Oliveira', slug: 'gabriel' },
]

function Card({ title, children }) {
  return <section className="manual-card"><h2 className="manual-card__title">{title}</h2>{children}</section>
}
function Items({ items }) {
  return <div className="manual-tables-list">{items.map(([name, description]) => (
    <div className="manual-table-item" key={name}><strong className="manual-table-name">{name}</strong><span className="manual-table-desc">{description}</span></div>
  ))}</div>
}
function Steps({ items }) {
  return <ol className="manual-steps">{items.map((text, i) => (
    <li className="manual-step" key={i}><span className="manual-step__num" aria-hidden="true">{i + 1}</span><span>{text}</span></li>
  ))}</ol>
}

export default function Manual() {
  const [section, setSection] = useState('caminhos')
  const [barbers, setBarbers] = useState(FALLBACK_BARBERS)
  useEffect(() => {
    let active = true
    async function load() {
      if (!supabase) return
      try {
        const { data: b } = await supabase.from('barbers').select('name, slug, speciality, role, interval_minutes').neq('role', 'admin').order('sort_order')
        if (active && b?.length) setBarbers(b)
      } catch { /* The public guide remains readable without a connection. */ }
    }
    load()
    return () => { active = false }
  }, [])
  return <div className="admin-layout manual-page">
    <aside className="admin-sidebar">
      <div className="admin-sidebar__logo"><img src="/logo-semfundo.png" alt="MK e BALÃO" /><div className="admin-sidebar__label">Manual público do sistema</div></div>
      <nav className="admin-sidebar__nav" aria-label="Seções do manual">
        <Link className="nav-item" to="/">← Voltar ao site</Link>
        {Object.entries(SECTIONS).map(([id, label]) => <button key={id} className={`nav-item${section === id ? ' active' : ''}`} aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}>{label}</button>)}
      </nav>
    </aside>
    <main className="admin-main" key={section}>
      <header className="admin-topbar"><Link className="admin-topbar__back" to="/">← Site</Link><div className="admin-topbar__title"><h1 className="admin-topbar__name">Manual do Sistema</h1><span className="admin-topbar__tab-label">{SECTIONS[section]}</span></div><Link className="btn-ghost" to="/login">Entrar</Link></header>
      <div className="manual-mobile-nav"><select aria-label="Seção do manual" className="manual-mobile-select" value={section} onChange={e => setSection(e.target.value)}>{Object.entries(SECTIONS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
      <div className="admin-body"><div className="manual-content">
        <p className="manual-note">MK e BALÃO Barbearia · Guia público de uso · Atualizado em 18/10/2026.</p>
        {section === 'caminhos' && <>
          <Card title="Todos os caminhos do sistema"><p>Os links públicos abrem sem cadastro. As áreas internas solicitam login e respeitam o perfil do usuário.</p><div className="manual-routes-list">{ROUTES.map(([path, title, access, description]) => <div className="manual-route-item" key={path}>{path.includes(':') ? <code className="manual-route-path">{path}</code> : <Link className="manual-route-path manual-info-link" to={path}>{path}</Link>}<span className="manual-route-desc"><strong>{title} · {access}</strong><br />{description}</span></div>)}</div></Card>
          <Card title="Primeiro agendamento"><Steps items={[
            'Abra o assistente geral ou o link individual do profissional.',
            'Informe nome completo e WhatsApp com DDD. No retorno, confira o cliente salvo neste aparelho.',
            'Escolha o barbeiro ou Primeiro Disponível. Nos links individuais, o profissional já está selecionado.',
            'Escolha categoria, serviço e adicionais; confira os valores.',
            'Escolha data e horário. Revise os dados antes de confirmar.',
            'Após confirmar, guarde o resumo e o link de cancelamento da reserva.',
          ]} /></Card>
        </>}
        {section === 'assistentes' && <>
          <Card title="Assistente geral"><p><Link className="manual-info-link" to="/agendar">Abrir /agendar</Link> — escolha entre os profissionais ou busque o primeiro disponível.</p></Card>
          {barbers.map(b => <Card key={b.slug} title={b.name}><p><Link className="manual-info-link" to={`/agendar/${b.slug}`}>{`${window.location.origin}/agendar/${b.slug}`}</Link></p><p>Abre o chatbot com {b.name} selecionado e os serviços vinculados ao profissional. Compartilhe no WhatsApp, Instagram ou em um QR Code.</p>{b.speciality && <p>Especialidade: {b.speciality}.</p>}{b.interval_minutes && <p>Intervalo configurado: {b.interval_minutes} minutos entre opções de início. A disponibilidade também depende da duração dos serviços e das reservas existentes.</p>}</Card>)}
        </>}
        {section === 'acesso' && <>
          <Card title="Como entrar"><Steps items={[
            <Link className="manual-info-link" to="/login">Abra a página de login.</Link>,
            'Digite o e-mail cadastrado e sua senha individual e toque em Entrar.',
            'O administrador é direcionado a /admin; o barbeiro, a /barbeiro.',
            'Ao terminar em um aparelho compartilhado, use Sair no painel.',
          ]} /></Card>
          <Card title="Login do administrador geral"><p><Link className="manual-info-link" to="/login">Entrar como administrador</Link> · <Link className="manual-info-link" to="/admin">Abrir painel geral</Link>.</p><p>E-mail de referência registrado na documentação do projeto: <strong>admin@mkebalaobarbearia.com.br</strong>. Confirme com o responsável se esse cadastro foi alterado.</p><p>A senha é individual e não é publicada neste manual. Use Esqueci minha senha na tela de login quando necessário.</p></Card>
          <Card title="Acesso dos barbeiros"><p>Cada profissional usa o e-mail vinculado à própria conta e sua senha em <Link className="manual-info-link" to="/login">/login</Link>. O painel está em <Link className="manual-info-link" to="/barbeiro">/barbeiro</Link>. Os assistentes são públicos e não dão acesso ao painel.</p></Card>
          <Card title="Recuperar ou criar um acesso"><p>Em /login, escolha Esqueci minha senha e informe o e-mail cadastrado. Para uma nova conta ou para a mensagem Usuário não configurado, peça ao administrador que vincule o usuário ao cadastro do profissional. Criar somente o perfil em Equipe não cria o acesso.</p></Card>
        </>}
        {section === 'admin' && <>
          <Card title="Painel do administrador geral"><p>Entre em <Link className="manual-info-link" to="/admin">/admin</Link> com o perfil de administrador. Abra o menu no cabeçalho e escolha um dos itens abaixo. São abas dentro do painel, não URLs separadas.</p><Items items={ADMIN_ITEMS} /></Card>
          <Card title="Outros atalhos"><Items items={[
            ['Social Media / Manual / Marca / Hub', 'Abrem /portal, /manual, /marca e /hub.'],
            ['Ver Site', 'Abre a página inicial da barbearia.'],
            ['Instalar app', 'Quando disponível, adiciona o aplicativo à tela inicial.'],
            ['Sair', 'Encerra a sessão autenticada.'],
          ]} /></Card>
        </>}
        {section === 'barbeiro' && <Card title="Minha agenda e ações"><p>Entre em <Link className="manual-info-link" to="/barbeiro">/barbeiro</Link> com a conta do profissional.</p><Items items={BARBER_ITEMS} /></Card>}
        {section === 'operacoes' && <>
          <Card title="Horários e bloqueios"><Steps items={[
            'No Admin, abra Disponibilidade, escolha o barbeiro e ajuste dias, início e fim do expediente. Salve a agenda.',
            'Para fechar a barbearia em uma data, use os bloqueios globais em Configurações.',
            'Para bloquear um profissional, ele pode usar Bloquear dia no próprio painel.',
            'Confira o resultado pelo assistente individual, sem concluir uma reserva de teste.',
          ]} /></Card>
          <Card title="Equipe e serviços"><Steps items={[
            'Em Equipe, cadastre ou edite nome, slug, telefone, especialidade, foto e intervalo.',
            'Em Serviços, defina categoria, preço, duração, adicionais e situação ativa.',
            'Em Serv./Barbeiro, vincule os serviços oferecidos por cada profissional.',
            'Em Chat & Agenda, ajuste os textos e opções disponíveis do assistente.',
            'Confira o expediente em Disponibilidade antes de divulgar o link individual.',
          ]} /></Card>
          <Card title="Gerenciar atendimentos"><Steps items={[
            'No Admin, abra Agendamentos e encontre a reserva por nome, telefone ou filtros.',
            'Confira profissional, data, horário e serviços antes de executar uma ação.',
            'Conclua o atendimento realizado ou cancele quando necessário. Cancelar libera o horário.',
            'O cliente também pode cancelar pelo link pessoal ou pela opção apresentada ao retornar ao assistente.',
          ]} /></Card>
          <Card title="Fiado, galeria, clube e configurações"><Items items={[
            ['Fiado', 'Crie o lançamento com cliente, telefone, serviço, valor e vencimento. Marque como pago após receber ou cancele quando necessário. O WhatsApp prepara a cobrança para revisão.'],
            ['Galeria', 'Envie as imagens e gerencie as informações e a situação de cada item.'],
            ['Clube', 'Cadastre ou edite planos, preços, benefícios e disponibilidade.'],
            ['Configurações', 'Atualize dados, contatos, horários exibidos e bloqueios de datas.'],
          ]} /></Card>
        </>}
        {section === 'regras' && <>
          <Card title="Disponibilidade, status e acesso"><Items items={[
            ['Horários', 'Consideram expediente, intervalo do profissional, duração total dos serviços, almoço, reservas e datas bloqueadas.'],
            ['Confirmação', 'Uma reserva criada pelo assistente recebe status confirmado. Pendentes atende registros que ainda tenham esse status.'],
            ['Conclusão', 'O profissional ou administrador marca como concluído após realizar o atendimento.'],
            ['Cancelamento', 'A reserva passa a cancelado e deixa de ocupar o horário. O link do cliente usa um token individual.'],
            ['Perfis', 'O administrador gerencia a barbearia. Cada barbeiro acessa os dados autorizados para sua conta.'],
          ]} /></Card>
          <Card title="Estrutura do sistema"><Items items={[
            ['Interface', 'React 18, Vite 5, Tailwind CSS e React Router.'],
            ['Dados e contas', 'Supabase: PostgreSQL, autenticação e atualizações em tempo real.'],
            ['Cadastros', 'barbers, services, barber_services e availability.'],
            ['Agenda', 'bookings e blocked_dates.'],
            ['Gestão', 'settings, plans, gallery e fiados.'],
            ['Publicação', 'Frontend no Vercel. As variáveis de conexão devem corresponder ao banco da barbearia.'],
          ]} /></Card>
        </>}
        {section === 'celular' && <>
          <Card title="Usar como aplicativo"><Steps items={[
            'Abra o site pelo navegador do celular.',
            'No iPhone, use Compartilhar → Adicionar à Tela de Início. No Android, use Instalar app ou Adicionar à tela inicial quando disponível.',
            'Abra o ícone criado. Para gerenciar a agenda, entre com sua conta.',
            'No chat, role a conversa ou a lista de opções. Nas páginas longas, role o conteúdo para continuar a leitura.',
          ]} /></Card>
          <Card title="Tela, teclado e conexão"><p>A interface respeita as áreas de recorte do aparelho e limita a rolagem do chat aos próprios painéis. Os campos usam tamanho apropriado para evitar zoom automático. O comportamento do teclado depende do navegador e da versão do sistema. Mantenha conexão com a internet para consultar e confirmar horários atualizados.</p></Card>
        </>}
        {section === 'suporte' && <Card title="Problemas comuns"><Items items={[
          ['Não consigo entrar', 'Confira o e-mail e use Esqueci minha senha. Para Usuário não configurado, solicite o vínculo da conta ao profissional.'],
          ['Serviço não aparece', 'Confira se está ativo em Serviços e vinculado em Serv./Barbeiro.'],
          ['Sem horário disponível', 'Confira Disponibilidade, bloqueios, duração dos serviços e reservas existentes.'],
          ['Não encontro a reserva', 'Confira data, profissional e filtros. O barbeiro vê somente a agenda autorizada para sua conta.'],
          ['Perdi o link de cancelamento', 'Volte ao assistente no mesmo aparelho ou peça ao profissional para localizar a reserva.'],
          ['Preciso de ajuda', 'Informe ao administrador a página, a ação realizada e a mensagem exibida. Não envie senhas ou dados de outros clientes.'],
        ]} /></Card>}
      </div></div>
    </main>
  </div>
}
