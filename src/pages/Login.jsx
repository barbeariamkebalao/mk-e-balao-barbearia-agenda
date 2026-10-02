import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err, data } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('Email ou senha incorretos.'); setLoading(false); return }

    const { data: barber } = await supabase
      .from('barbers').select('role').eq('user_id', data.user.id).single()

    setLoading(false)
    if (barber?.role === 'admin') navigate('/admin')
    else navigate('/barbeiro')
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
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <a href="/" className="login-back">← Voltar para agendamento</a>
      </div>
    </div>
  )
}
