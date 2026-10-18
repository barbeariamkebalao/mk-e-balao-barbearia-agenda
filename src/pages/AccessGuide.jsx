import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const REFERENCES = [
  { name: 'Administrador geral', slug: 'admin', role: 'admin', email: 'admin@mkebalaobarbearia.com.br' },
  { name: 'Maikon MK', slug: 'maikon', role: 'barber', email: 'mk@mkebalaobarbearia.com.br' },
  { name: 'Daniel Balão', slug: 'daniel', role: 'barber', email: 'daniel@mkebalaobarbearia.com.br' },
  { name: 'Gabriel Oliveira', slug: 'gabriel', role: 'barber', email: 'gabriel@mkebalaobarbearia.com.br' },
]
const PATHS = [
  ['/', 'Site institucional', 'Público'], ['/agendar', 'Assistente geral', 'Público'],
  ['/login', 'Entrada da equipe', 'Público'], ['/admin', 'Painel geral', 'Administrador'],
  ['/admin/acessos', 'Acessos, caminhos e testes', 'Administrador'],
  ['/barbeiro', 'Agenda individual', 'Equipe autenticada'], ['/portal', 'Social Media', 'Equipe autenticada'],
  ['/manual', 'Manual do sistema', 'Público'], ['/marca', 'Manual da marca', 'Equipe autenticada'],
  ['/hub', 'Central de links', 'Equipe autenticada'], ['/instalar-admin.html', 'Instalar MK Admin', 'Público'],
]
const TESTS = [
  ['1. Entradas e perfis', 'Abra /admin/acessos sem sessão: deve pedir login. Entre como admin e confirme o retorno ao guia. Saia e entre como cada barbeiro: deve abrir o painel individual e recusar a área do admin.'],
  ['2. Configuração inicial', 'Como admin, confira Equipe, Serviços, Serv./Barbeiro e Disponibilidade. Confirme preço, duração, expediente, almoço e bloqueios antes de testar horários.'],
  ['3. Cada assistente individual', 'Abra o link de Maikon, Daniel e Gabriel. Confira o nome do profissional no chat e os serviços vinculados. Use um nome identificado como TESTE e o WhatsApp do próprio responsável pelo teste.'],
  ['4. Primeira reserva', 'Escolha uma data futura e um horário livre, confirme o resumo e finalize uma única reserva de teste. Ela deve aparecer como confirmada no admin e no painel do profissional escolhido.'],
  ['5. Isolamento entre barbeiros', 'Com a conta de outro profissional, confira que a reserva anterior não aparece na própria agenda. Verifique também que as credenciais do guia não podem ser consultadas com esse perfil.'],
  ['6. Horário ocupado', 'Em outra sessão, tente reservar o mesmo horário do mesmo profissional. O sistema deve recusar a duplicidade. Teste também serviços longos para conferir sobreposição de duração.'],
  ['7. Cancelar e concluir', 'Cancele a reserva de teste pelo link individual e confirme que o horário volta a ficar livre. Em outra reserva identificada como TESTE, conclua pelo painel e confira o status no admin.'],
  ['8. Retorno do cliente', 'Volte ao assistente no mesmo aparelho. Confira o cliente salvo, a opção de informar outra pessoa e os dados de um eventual próximo agendamento.'],
  ['9. Aplicativo e teclado', 'Instale MK Admin pela página de instalação no Safari do iPhone e no Chrome do Android. Abra pelo ícone, entre, saia e teste abertura/fechamento do teclado, rolagem das listas e retorno ao app.'],
  ['10. Recuperação e conexão', 'Teste Esqueci minha senha com uma conta controlada até conseguir definir e usar a nova senha. Desligue a conexão e confira se o usuário distingue falta de rede de agenda vazia.'],
  ['11. Limpeza dos testes', 'Anote os registros criados e remova apenas os testes após a validação. Não use uma limpeza geral depois de começar a receber reservas reais.'],
]
const UX = [
  ['Prioridade alta · Falha de conexão', 'A leitura da agenda do barbeiro ignora o erro da consulta e pode mostrar uma lista vazia. Falta diferenciar sem reservas de sem conexão e oferecer Tentar novamente.'],
  ['Prioridade alta · Recuperar senha', 'O login envia o e-mail de recuperação, mas ainda falta validar uma tela para definir a nova senha após abrir o link. Testar o fluxo completo antes de depender dele.'],
  ['Prioridade alta · Sessões e dados', 'Validar o isolamento das agendas e credenciais com contas reais de cada perfil e conferir as políticas no banco. A tela bloqueada, sozinha, não substitui essas políticas.'],
  ['Prioridade média · Semana', 'A aba filtra a partir de hoje, sem data final; portanto pode incluir todo o futuro. Definir se deve mostrar sete dias ou mudar o nome para Próximos.'],
  ['Prioridade média · Copiar link', 'Uma falha da área de transferência não recebe aviso. Falta oferecer o link selecionável ou compartilhamento nativo como alternativa.'],
  ['Prioridade média · Próximo cliente', 'O destaque depende de uma renderização da tela. Validar sua atualização enquanto o barbeiro deixa o painel aberto e a hora muda.'],
  ['Prioridade média · Ações e dinheiro', 'Distinguir receita prevista de valor recebido, avaliar remarcação e ausência do cliente e mostrar retorno de erro ao salvar configurações.'],
  ['Validação com a equipe · Uso real', 'Testar mãos ocupadas, alvos de toque, leitura sob luz forte, notificações, retorno do segundo plano, texto ampliado e teclado em aparelhos reais. O bloqueio de zoom também precisa ser avaliado para usuários com baixa visão.'],
]

function safeLink(value) {
  try { const url = new URL(value, window.location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : null } catch { return null }
}

export default function AccessGuide() {
  const [section, setSection] = useState('contas')
  const [accounts, setAccounts] = useState(REFERENCES)
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [revealed, setRevealed] = useState({})
  const [form, setForm] = useState({ username: '', password: '' })
  const [saving, setSaving] = useState(false)
  const base = window.location.origin

  async function load() {
    setLoading(true); setError('')
    try {
      const [{ data: profiles, error: profilesError }, { data: settings, error: settingsError }] = await Promise.all([
        supabase.from('barbers').select('id,name,slug,role,user_id,active').order('sort_order'),
        supabase.from('settings').select('credentials_json').eq('id', 1).single(),
      ])
      if (profilesError || settingsError) throw new Error('Não foi possível carregar o cadastro protegido. Confira sua sessão de administrador e tente novamente.')
      setAccounts(profiles.map(profile => ({ ...profile, email: REFERENCES.find(reference => reference.slug === profile.slug)?.email || '' })))
      setCredentials(Array.isArray(settings.credentials_json) ? settings.credentials_json : [])
    } catch (err) { setError(err.message || 'Falha ao carregar o guia.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    function conceal() {
      if (document.hidden) { setRevealed({}); setEditing(null); setForm({ username: '', password: '' }) }
    }
    document.addEventListener('visibilitychange', conceal)
    return () => document.removeEventListener('visibilitychange', conceal)
  }, [])

  async function logout() {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) { setError('Não foi possível sair. Tente novamente.'); return }
    window.location.replace('/login')
  }

  function accountCredential(account) { return credentials.find(item => item.system_slug === account.slug) }
  function startEditing(account) {
    const entry = accountCredential(account)
    setEditing(account.slug)
    setForm({ username: entry?.username || account.email || '', password: entry?.password || '' })
    setNotice(''); setError('')
  }
  async function saveAccount(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const { data: current, error: readError } = await supabase.from('settings').select('credentials_json').eq('id', 1).single()
      if (readError) throw readError
      const previous = Array.isArray(current.credentials_json) ? current.credentials_json : []
      const account = accounts.find(item => item.slug === editing)
      const next = [...previous.filter(item => item.system_slug !== editing), {
        system_slug: editing, label: `Sistema — ${account.name}`, username: form.username.trim(),
        password: form.password, url: `${base}/login`, updated_at: new Date().toISOString(),
      }]
      const { error: updateError } = await supabase.from('settings').update({ credentials_json: next }).eq('id', 1)
      if (updateError) throw updateError
      setCredentials(next); setEditing(null); setForm({ username: '', password: '' })
      setNotice('Referência salva no cadastro protegido. Isso não altera o e-mail nem a senha da conta de autenticação.')
    } catch { setError('Não foi possível salvar. Confira sua conexão e as permissões de administrador.') }
    finally { setSaving(false) }
  }
  function makeText() {
    const lines = ['MK e BALÃO — GUIA INTERNO DE ACESSOS', 'Uso exclusivo do administrador. Não publique nem envie a clientes.', '']
    for (const account of accounts) {
      const entry = accountCredential(account)
      lines.push(account.name, `E-mail: ${entry?.username || account.email || 'Não registrado'}`,
        `Origem: ${entry ? 'cadastro protegido; conferir se está atualizado' : 'referência da documentação, não validada'}`,
        `Senha: ${entry?.password || 'Não registrada; não pode ser recuperada do Supabase Auth'}`,
        `Login: ${base}/login`, `Painel: ${base}${account.role === 'admin' ? '/admin' : '/barbeiro'}`)
      if (account.role !== 'admin') lines.push(`Assistente individual: ${base}/agendar/${account.slug}`)
      lines.push('')
    }
    lines.push('CAMINHOS', ...PATHS.map(([path, label, access]) => `${label} (${access}): ${base}${path}`), '', 'TESTES INICIAIS', ...TESTS.map(([title, description]) => `${title}\n${description}`))
    return lines.join('\n')
  }
  async function copyText() {
    try { await navigator.clipboard.writeText(makeText()); setNotice('Guia com os dados registrados copiado. Compartilhe somente com quem administra o sistema.') }
    catch { setError('Não foi possível copiar automaticamente. Use a opção Exibir texto para selecionar e copiar.') }
  }

  return <div className="adm-shell access-guide">
    <header className="access-guide__header"><Link className="btn-ghost" to="/admin">← Painel</Link><h1>Acessos e testes</h1><a className="btn-ghost" href="/instalar-admin.html">Instalar MK Admin</a><button className="btn-ghost" onClick={logout}>Sair</button></header>
    <nav className="access-guide__tabs" aria-label="Seções do guia interno">{[['contas','Contas e senhas'],['caminhos','Caminhos'],['testes','Testes iniciais'],['usabilidade','Usabilidade']].map(([id,label]) => <button className={`btn-ghost${section === id ? ' selected' : ''}`} key={id} aria-pressed={section === id} onClick={() => setSection(id)}>{label}</button>)}</nav>
    <main className="access-guide__main">
      <p className="manual-note">Área exclusiva do admin. As senhas abaixo são referências mantidas pelo responsável: o Supabase Auth não permite consultar senhas atuais.</p>
      {notice && <p className="access-guide__notice" role="status">{notice}</p>}
      {error && <p className="access-guide__error" role="alert">{error}</p>}
      {loading ? <p role="status">Carregando cadastro protegido…</p> : error && !credentials.length ? <button className="btn-ghost" onClick={load}>Tentar novamente</button> : <>
        {section === 'contas' && <>
          <div className="access-guide__actions"><button className="btn-primary" onClick={copyText}>Copiar guia com senhas registradas</button><button className="btn-ghost" onClick={() => setRevealed(value => ({ ...value, text: !value.text }))}>{revealed.text ? 'Ocultar texto' : 'Exibir texto completo'}</button><button className="btn-ghost" onClick={load}>Atualizar</button></div>
          {revealed.text && <textarea className="access-guide__text" aria-label="Texto completo do guia interno" readOnly value={makeText()} />}
          {accounts.map(account => { const entry = accountCredential(account); return <section className="manual-card" key={account.slug}>
            <h2 className="manual-card__title">{account.name} · {account.role === 'admin' ? 'Administrador' : 'Barbeiro'}</h2>
            <dl className="access-guide__fields"><div><dt>E-mail</dt><dd>{entry?.username || account.email || 'Não registrado'}</dd></div><div><dt>Origem</dt><dd>{entry ? 'Referência salva pelo admin. Confira se está atualizada.' : 'Documentação do projeto; ainda não validado na autenticação.'}</dd></div><div><dt>Vínculo</dt><dd>{account.user_id ? 'Conta vinculada ao perfil' : 'Sem vínculo de autenticação identificado'}</dd></div><div><dt>Senha registrada</dt><dd>{entry?.password ? <><span>{revealed[account.slug] ? entry.password : '••••••••'}</span> <button className="btn-ghost" onClick={() => setRevealed(value => ({ ...value, [account.slug]: !value[account.slug] }))}>{revealed[account.slug] ? 'Ocultar' : 'Mostrar'}</button></> : 'Não registrada. Informe uma senha conhecida no cadastro abaixo.'}</dd></div><div><dt>Entrada</dt><dd><Link to="/login">{base}/login</Link></dd></div><div><dt>Painel</dt><dd><Link to={account.role === 'admin' ? '/admin' : '/barbeiro'}>{base}{account.role === 'admin' ? '/admin' : '/barbeiro'}</Link></dd></div>{account.role !== 'admin' && <div><dt>Assistente</dt><dd><Link to={`/agendar/${account.slug}`}>{base}/agendar/{account.slug}</Link></dd></div>}</dl>
            {editing === account.slug ? <form className="access-guide__edit" onSubmit={saveAccount}><label>E-mail conhecido da conta<input type="email" autoComplete="off" required value={form.username} onChange={event => setForm(value => ({ ...value, username: event.target.value }))} /></label><label>Senha conhecida (opcional)<input type="password" autoComplete="new-password" value={form.password} onChange={event => setForm(value => ({ ...value, password: event.target.value }))} /></label><p>Este formulário apenas registra uma referência. Não cria conta nem troca senha no Supabase Auth.</p><div className="access-guide__actions"><button className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar referência'}</button><button type="button" className="btn-ghost" disabled={saving} onClick={() => {setEditing(null);setForm({username:'',password:''})}}>Cancelar</button></div></form> : <div className="access-guide__actions"><button className="btn-ghost" onClick={() => startEditing(account)}>Registrar ou atualizar acesso conhecido</button></div>}
          </section> })}
          {!!credentials.filter(item => !item.system_slug).length && <section className="manual-card"><h2 className="manual-card__title">Outros acessos digitais registrados</h2>{credentials.filter(item => !item.system_slug).map((entry,index) => <div className="access-guide__fields" key={index}><strong>{entry.label}</strong><p>{entry.username}</p>{safeLink(entry.url || '') && entry.url && <a href={safeLink(entry.url)} target="_blank" rel="noreferrer">Abrir serviço</a>}<p>Senha: {entry.password ? (revealed[`external-${index}`] ? entry.password : '••••••••') : 'Não registrada'}</p><button className="btn-ghost" onClick={() => setRevealed(value => ({...value,[`external-${index}`]:!value[`external-${index}`]}))}>Mostrar / ocultar</button></div>)}</section>}
        </>}
        {section === 'caminhos' && <><section className="manual-card"><h2 className="manual-card__title">Todos os caminhos</h2>{PATHS.map(([path,label,access]) => <div className="access-guide__fields" key={path}><strong>{label} · {access}</strong><a href={path}>{base}{path}</a></div>)}{accounts.filter(account => account.role !== 'admin').map(account => <div className="access-guide__fields" key={account.slug}><strong>Assistente de {account.name}</strong><Link to={`/agendar/${account.slug}`}>{base}/agendar/{account.slug}</Link></div>)}</section><p className="manual-note">/confirmado abre ao finalizar a reserva. /cancelar/:token usa o token pessoal do agendamento e não é um link compartilhável para toda a equipe.</p></>}
        {section === 'testes' && <><p>Execute com contas e números controlados pela equipe. São instruções de validação; não significam que os testes já foram realizados.</p>{TESTS.map(([title,description]) => <section className="manual-card" key={title}><h2 className="manual-card__title">{title}</h2><p>{description}</p></section>)}</>}
        {section === 'usabilidade' && <><p>Pontos encontrados na revisão do código e verificações que ainda precisam de uso real com os barbeiros.</p>{UX.map(([title,description]) => <section className="manual-card" key={title}><h2 className="manual-card__title">{title}</h2><p>{description}</p></section>)}</>}
      </>}
    </main>
  </div>
}
