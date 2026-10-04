import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [resetMode,   setResetMode]   = useState(false)
  const [resetEmail,  setResetEmail]  = useState('')
  const [resetSent,   setResetSent]   = useState(false)
  const [resetLoading,setResetLoading]= useState(false)
  const navigate = useNavigate()

  // Redireciona se já estiver autenticado E vinculado a um barbeiro
  useEffect(() => {
    async function checkSession() {
      if (!supabase) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: barber } = await supabase
        .from('barbers').select('role').eq('user_id', session.user.id).single()
      if (!barber) return  // autenticado mas sem vínculo — fica no login, não entra em loop
      navigate(barber.role === 'admin' ? '/admin' : '/barbeiro', { replace: true })
    }
    checkSession()
  }, [])

  async function handleReset(e) {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setResetLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })
    setResetLoading(false)
    if (err) { setError('Não foi possível enviar o email. Verifique o endereço.'); return }
    setResetSent(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err, data } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('Email ou senha incorretos.'); setLoading(false); return }

    const { data: barber } = await supabase
      .from('barbers').select('role').eq('user_id', data.user.id).single()

    if (!barber) {
      // Usuário existe no auth mas não está vinculado a nenhum barbeiro
      await supabase.auth.signOut()
      setError('Usuário não configurado. Contate o administrador.')
      setLoading(false)
      return
    }

    setLoading(false)
    navigate(barber.role === 'admin' ? '/admin' : '/barbeiro')
  }

  return (
    <div className="login-page">
      <div className="login-box">

        {/* Logo */}
        <div className="login-logo-wrap">
          <img className="login-logo-img" src="/logo-semfundo.png" alt="MK e BALÃO" />
          <div className="login-logo-name">MK e BALÃO</div>
          <div className="login-logo-sub">Área Restrita</div>
        </div>

        {/* Barber pole divider */}
        <div className="barber-pole-bg login-pole" />

        {/* Form */}
        {!resetMode ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="mk-label">Email</label>
              <input
                className="mk-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="seu@email.com"
              />
            </div>
            <div className="form-group">
              <label className="mk-label">Senha</label>
              <input
                className="mk-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', gap: '0.5rem' }}>
              {loading && <span className="btn-spinner" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button
              type="button"
              className="login-forgot"
              onClick={() => { setResetMode(true); setError(''); setResetEmail(email) }}
            >
              Esqueci minha senha
            </button>
          </form>
        ) : resetSent ? (
          <div className="login-reset-sent">
            <div className="login-reset-sent__icon">📧</div>
            <div className="login-reset-sent__title">Email enviado!</div>
            <div className="login-reset-sent__text">
              Verifique sua caixa de entrada em <strong>{resetEmail}</strong> e siga o link para redefinir a senha.
            </div>
            <button className="login-forgot" onClick={() => { setResetMode(false); setResetSent(false) }}>
              ← Voltar ao login
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="login-form">
            <div className="login-reset-title">Redefinir senha</div>
            <div className="login-reset-sub">Enviaremos um link para seu email.</div>
            <div className="form-group">
              <label className="mk-label">Email</label>
              <input
                className="mk-input"
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                autoFocus
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={resetLoading} style={{ width: '100%', gap: '0.5rem' }}>
              {resetLoading && <span className="btn-spinner" />}
              {resetLoading ? 'Enviando…' : 'Enviar link de redefinição'}
            </button>
            <button type="button" className="login-forgot" onClick={() => { setResetMode(false); setError('') }}>
              ← Voltar ao login
            </button>
          </form>
        )}

        <a href="/" className="login-back">← Voltar para agendamento</a>
      </div>
    </div>
  )
}
