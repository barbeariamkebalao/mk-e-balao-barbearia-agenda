import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateLabel } from '../lib/slots'

export default function Confirm() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const booking   = state?.booking
  const barber    = state?.barber
  const waUrl     = state?.waUrl  // built by Booking.jsx with full message + cancel link

  // Guard: acesso direto à URL sem state (refresh, link direto)
  if (!booking) {
    return (
      <div className="confirm-page">
        <div className="confirm-box">
          <div className="confirm-icon">✂️</div>
          <h1 className="confirm-title">Nenhum agendamento encontrado</h1>
          <p style={{ color: 'var(--dim)', fontSize: '0.9rem', textAlign: 'center' }}>
            Para ver um agendamento você precisa acessar este link logo após confirmar.
          </p>
          <div className="confirm-actions">
            <button className="btn-outline" onClick={() => navigate('/')}>Fazer novo agendamento</button>
          </div>
        </div>
      </div>
    )
  }

  const [rescheduling,    setRescheduling]    = useState(false)
  const [rescheduleError, setRescheduleError] = useState(false)
  const [copied,          setCopied]          = useState(false)

  const cancelUrl = booking
    ? `${window.location.origin}/cancelar/${booking.cancel_token}`
    : null

  function copyCancel() {
    if (!cancelUrl) return
    navigator.clipboard?.writeText(cancelUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleReschedule() {
    if (!booking || !supabase) return
    setRescheduling(true)
    setRescheduleError(false)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelado' })
      .eq('id', booking.id)
    if (error) {
      setRescheduling(false)
      setRescheduleError(true)
      setTimeout(() => setRescheduleError(false), 4000)
      return
    }
    navigate('/agendar', {
      state: {
        prefill: {
          name:  booking.client_name,
          phone: booking.client_phone,
          barber,
        },
      },
    })
  }

  return (
    <div className="confirm-page">
      <div className="confirm-box">
        <div className="confirm-icon">✂️</div>
        <h1 className="confirm-title">Agendado!</h1>

        {booking && (
          <div className="confirm-details">
            <div className="confirm-row"><span>Barbeiro</span><strong>{barber?.name}</strong></div>
            <div className="confirm-row"><span>Data</span><strong>{formatDateLabel(booking.date)} às {booking.time.slice(0,5)}</strong></div>
            <div className="confirm-row"><span>Nome</span><strong>{booking.client_name}</strong></div>
            <div className="confirm-row"><span>Total</span><strong>R$ {Number(booking.total).toFixed(2).replace('.', ',')}</strong></div>
          </div>
        )}

        <p className="confirm-notice">
          Guarde o link abaixo para cancelar se precisar:
        </p>
        {cancelUrl && (
          <div className="confirm-cancel-url-wrap">
            <div className="confirm-cancel-url">{cancelUrl}</div>
            <button className="confirm-copy-btn" onClick={copyCancel}>
              {copied ? '✓ Copiado' : '⎘ Copiar'}
            </button>
          </div>
        )}

        <div className="confirm-actions">
          {waUrl && (
            <a
              className="btn-wa"
              href={waUrl}
              target="_blank"
              rel="noreferrer"
            >
              Avisar o barbeiro no WhatsApp
            </a>
          )}
          <button className="btn-outline" onClick={() => navigate('/')}>
            Novo agendamento
          </button>
          {booking && (
            <button
              className="btn-ghost"
              onClick={handleReschedule}
              disabled={rescheduling}
            >
              {rescheduling ? 'Processando...' : rescheduleError ? 'Erro — tentar de novo' : 'Reagendar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
