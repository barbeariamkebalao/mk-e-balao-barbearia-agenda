import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateLabel } from '../lib/slots'

export default function Cancel() {
  const { token } = useParams()
  const navigate  = useNavigate()
  const [booking, setBooking] = useState(null)
  const [barber,  setBarber]  = useState(null)
  const [state,   setState]   = useState('loading') // loading | found | notfound | done | error

  useEffect(() => {
    async function load() {
      if (!supabase || !token) { setState('notfound'); return }
      const { data } = await supabase
        .from('bookings')
        .select('*, barbers(name, phone)')
        .eq('cancel_token', token)
        .single()

      if (!data) { setState('notfound'); return }
      if (data.status === 'cancelado') { setState('done'); return }

      setBooking(data)
      setBarber(data.barbers)
      setState('found')
    }
    load()
  }, [token])

  async function doCancel() {
    setState('loading')
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelado' })
      .eq('cancel_token', token)

    setState(error ? 'error' : 'done')
  }

  return (
    <div className="confirm-page">
      <div className="confirm-box">
        {state === 'loading' && <p>Carregando...</p>}

        {state === 'notfound' && (
          <>
            <div className="confirm-icon">❌</div>
            <h1 className="confirm-title">Link inválido</h1>
            <p>Este link de cancelamento não existe ou já expirou.</p>
            <button className="btn-outline" onClick={() => navigate('/')}>Voltar</button>
          </>
        )}

        {state === 'found' && booking && (
          <>
            <div className="confirm-icon">⚠️</div>
            <h1 className="confirm-title">Cancelar agendamento?</h1>
            <div className="confirm-details">
              <div className="confirm-row"><span>Barbeiro</span><strong>{barber?.name}</strong></div>
              <div className="confirm-row"><span>Data</span><strong>{formatDateLabel(booking.date)} às {booking.time.slice(0,5)}</strong></div>
              <div className="confirm-row"><span>Nome</span><strong>{booking.client_name}</strong></div>
            </div>
            <div className="confirm-actions">
              <button className="btn-danger" onClick={doCancel}>Sim, cancelar</button>
              <button className="btn-outline" onClick={() => navigate('/')}>Não, manter</button>
            </div>
          </>
        )}

        {state === 'done' && (
          <>
            <div className="confirm-icon">✓</div>
            <h1 className="confirm-title">Cancelado</h1>
            <p>Seu agendamento foi cancelado e o horário foi liberado.</p>
            <button className="btn-outline" onClick={() => navigate('/')}>Fazer novo agendamento</button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="confirm-icon">❌</div>
            <h1 className="confirm-title">Erro ao cancelar</h1>
            <p>Tente novamente ou entre em contato com a barbearia.</p>
          </>
        )}
      </div>
    </div>
  )
}
