import { useEffect, useRef } from 'react'

export function ChatBubble({ from, children }) {
  return (
    <div className={`chat-bubble chat-bubble--${from}`}>
      {from === 'bot' && <div className="chat-bubble__avatar">✂</div>}
      <div className="chat-bubble__text">{children}</div>
      {from === 'user' && <div className="chat-bubble__avatar">👤</div>}
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-avatar">✂</div>
      <div className="typing-dots">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}

export function ChatActions({ actions, layout = 'list' }) {
  return (
    <div className={layout === 'grid' ? 'action-grid' : 'action-list'}>
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className={`chat-action-btn${a.variant === 'primary' ? ' primary' : ''}${a.selected ? ' selected' : ''}`}
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
    <form className="chat-input-wrap" onSubmit={onSubmit}>
      <input
        className="mk-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
      />
      <button type="submit" className="chat-send">→</button>
    </form>
  )
}

export function ChatWindow({ children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  })
  return (
    <div className="chat-window" ref={ref}>
      {children}
    </div>
  )
}

// Keep backward-compat alias
export const ChatScroller = ChatWindow
