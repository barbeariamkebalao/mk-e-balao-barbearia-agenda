import { useEffect, useRef } from 'react'

export function ChatBubble({ from, children }) {
  return (
    <div className={`chat-bubble chat-bubble--${from}`}>
      {from === 'bot' && <span className="chat-bubble__icon">✂</span>}
      <div className="chat-bubble__text">{children}</div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="chat-bubble chat-bubble--bot">
      <span className="chat-bubble__icon">✂</span>
      <div className="chat-typing">
        <span /><span /><span />
      </div>
    </div>
  )
}

export function ChatActions({ actions }) {
  return (
    <div className="chat-actions">
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className={`chat-action-btn${a.variant === 'primary' ? ' chat-action-btn--primary' : ''}`}
          onClick={a.onClick}
          disabled={a.disabled}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}

export function ChatInput({ value, onChange, onSubmit, placeholder, type = 'text' }) {
  return (
    <form className="chat-input-row" onSubmit={onSubmit}>
      <input
        className="chat-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
      />
      <button type="submit" className="chat-send-btn">→</button>
    </form>
  )
}

export function ChatScroller({ children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  })
  return (
    <div className="chat-scroller" ref={ref}>
      {children}
    </div>
  )
}
