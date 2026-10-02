import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Booking  from './pages/Booking'
import Cancel   from './pages/Cancel'
import Confirm  from './pages/Confirm'
import Login    from './pages/Login'
import Admin    from './pages/Admin'
import Barbeiro from './pages/Barbeiro'

function RequireAuth({ children, adminOnly = false }) {
  const [state, setState] = useState('loading') // loading | authed | denied
  const [barber, setBarber] = useState(null)

  useEffect(() => {
    async function check() {
      if (!supabase) { setState('denied'); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setState('denied'); return }

      const { data } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (!data) { setState('denied'); return }
      if (adminOnly && data.role !== 'admin') { setState('denied'); return }

      setBarber(data)
      setState('authed')
    }
    check()

    const { data: { subscription } } = supabase?.auth.onAuthStateChange(() => check()) ?? { data: { subscription: null } }
    return () => subscription?.unsubscribe()
  }, [adminOnly])

  if (state === 'loading') return <div className="page-loading">Carregando...</div>
  if (state === 'denied')  return <Navigate to="/login" replace />
  return children(barber)
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<Booking />} />
        <Route path="/agendar"            element={<Booking />} />
        <Route path="/confirmado"         element={<Confirm />} />
        <Route path="/cancelar/:token"    element={<Cancel />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/admin"              element={
          <RequireAuth adminOnly={true}>
            {(barber) => <Admin barber={barber} />}
          </RequireAuth>
        } />
        <Route path="/barbeiro"           element={
          <RequireAuth>
            {(barber) => <Barbeiro barber={barber} />}
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
