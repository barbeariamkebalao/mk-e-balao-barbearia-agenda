import { useLocation, useNavigate } from 'react-router-dom'
import { formatDateLabel } from '../lib/slots'

export default function Confirm() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const booking   = state?.booking
  const barber    = state?.barber

  const cancelUrl = booking
    ? `${window.location.origin}/cancelar/${booking.cancel_token}`
    : null

  const waMsg = booking
    ? encodeURIComponent(
        `Olá! Meu agendamento foi confirmado:\n` +
        `📅 ${formatDateLabel(booking.date)} às ${booking.time.slice(0,5)}\n` +
        `✂️ ${barber?.name}\n` +
        `👤 ${booking.client_name}`
      )
    : ''

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
          <div className="confirm-cancel-url">{cancelUrl}</div>
        )}

        <div className="confirm-actions">
          {barber?.phone && (
            <a
              className="btn-wa"
              href={`https://wa.me/${barber.phone}?text=${waMsg}`}
              target="_blank"
              rel="noreferrer"
            >
              Confirmar no WhatsApp
            </a>
          )}
          <button className="btn-outline" onClick={() => navigate('/')}>
            Novo agendamento
          </button>
        </div>
      </div>
    </div>
  )
}
