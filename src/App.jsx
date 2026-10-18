import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, Suspense, lazy } from 'react'
import { supabase } from './lib/supabase'
import ErrorBoundary from './components/ErrorBoundary'

// Code splitting — cada rota carrega seu chunk só quando acessada.
// Reduz bundle inicial de ~588KB para ~180KB (Home+Booking).
const Home            = lazy(() => import('./pages/Home'))
const Booking         = lazy(() => import('./pages/Booking'))
const Cancel          = lazy(() => import('./pages/Cancel'))
const Confirm         = lazy(() => import('./pages/Confirm'))
const Login           = lazy(() => import('./pages/Login'))
const Admin           = lazy(() => import('./pages/Admin'))
const Barbeiro        = lazy(() => import('./pages/Barbeiro'))
const AgendarBarbeiro = lazy(() => import('./pages/AgendarBarbeiro'))
const Portal          = lazy(() => import('./pages/Portal'))
const Manual          = lazy(() => import('./pages/Manual'))
const ManualMarca     = lazy(() => import('./pages/ManualMarca'))
const Hub             = lazy(() => import('./pages/Hub'))

function RequireAuth({ children, adminOnly = false }) {
  const [state, setState] = useState('loading') // loading | authed | denied
  const [barber, setBarber] = useState(null)

  useEffect(() => {
    let mounted = true

    async function resolveBarber(session) {
      if (!session) { if (mounted) setState('denied'); return }
      try {
        const { data } = await supabase
          .from('barbers').select('*')
          .eq('user_id', session.user.id).single()
        if (!mounted) return
        if (!data) { setState('denied'); return }
        if (adminOnly && data.role !== 'admin') { setState('denied'); return }
        setBarber(data)
        setState('authed')
      } catch {
        if (mounted) setState('denied')
      }
    }

    if (!supabase) { setState('denied'); return }

    // onAuthStateChange dispara INITIAL_SESSION imediatamente com a sessão atual
    // — elimina race condition do getSession() + navigate pós-login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { if (mounted) setState('denied'); return }
      resolveBarber(session)
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [adminOnly])

  if (state === 'loading') return <div className="page-loading">Carregando...</div>
  if (state === 'denied')  return <Navigate to="/login" replace />
  return children(barber)
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Suspense fallback={<div className="page-loading">Carregando...</div>}>
          <Routes>
            <Route path="/"                   element={<Home />} />
            <Route path="/agendar"            element={<Booking />} />
            <Route path="/confirmado"         element={<Confirm />} />
            <Route path="/cancelar/:token"    element={<Cancel />} />
            <Route path="/agendar/:slug"      element={<AgendarBarbeiro />} />
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
            <Route path="/portal"             element={
              <RequireAuth>
                {(barber) => <Portal role={barber.role} />}
              </RequireAuth>
            } />
            <Route path="/manual"             element={<Manual />} />
            <Route path="/marca"              element={
              <RequireAuth>
                {(barber) => <ManualMarca role={barber.role} />}
              </RequireAuth>
            } />
            <Route path="/hub"                element={
              <RequireAuth>
                {(barber) => <Hub barber={barber} />}
              </RequireAuth>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
