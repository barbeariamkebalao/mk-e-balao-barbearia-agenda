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
      if (['cancelado', 'concluido'].includes(data.status)) { setState('done'); return }

      // Block cancellation more than 24h after the appointment
      const apptDate = new Date(`${data.date}T${data.time}`)
      const cutoff   = new Date(apptDate.getTime() + 24 * 60 * 60 * 1000)
      if (new Date() > cutoff) { setState('notfound'); return }

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

    if (error) { setState('error'); return }
    setState('done')
    // S1 — notifica barbeiro automaticamente via WA
    if (barber?.phone) {
      const msg = encodeURIComponent(
        `Olá! Um cliente cancelou o agendamento. O horário foi liberado.`
      )
      window.open(`https://wa.me/${barber.phone}?text=${msg}`, '_blank')
    }
  }

  return (
    <div className="confirm-page">
      <div className="confirm-box">
        {state === 'loading' && (
          <>
            <div className="admin-loading__spinner" style={{ width: 28, height: 28, borderWidth: 3 }} aria-hidden="true" />
            <p style={{ color: 'var(--dim)', fontSize: '0.875rem' }}>Carregando...</p>
          </>
        )}

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
            <div className="confirm-actions">
              {barber?.phone && (
                <a
                  className="btn-wa"
                  href={`https://wa.me/${barber.phone}?text=${encodeURIComponent('Olá! Precisei cancelar meu agendamento. Fico no aguardo para reagendar.')}`}
                  target="_blank" rel="noreferrer"
                >
                  Avisar barbeiro no WhatsApp
                </a>
              )}
              <button className="btn-outline" onClick={() => navigate('/')}>Fazer novo agendamento</button>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="confirm-icon">❌</div>
            <h1 className="confirm-title">Erro ao cancelar</h1>
            <p>Tente novamente ou entre em contato com a barbearia.</p>
            <div className="confirm-actions">
              <button className="btn-danger" onClick={doCancel}>Tentar novamente</button>
              <button className="btn-outline" onClick={() => navigate('/')}>Voltar ao início</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
