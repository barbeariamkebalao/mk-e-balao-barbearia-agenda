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

    // Verifica role do barbeiro
    const { data: barber } = await supabase
      .from('barbers')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    setLoading(false)
    if (barber?.role === 'admin') navigate('/admin')
    else navigate('/barbeiro')
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">MK e BALÃO</div>
        <div className="login-sub">Área Restrita</div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <a href="/" className="login-back">← Voltar para agendamento</a>
      </div>
    </div>
  )
}
