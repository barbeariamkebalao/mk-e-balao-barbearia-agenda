import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="confirm-page">
          <div className="confirm-box">
            <div className="confirm-icon">❌</div>
            <h1 className="confirm-title">Algo deu errado</h1>
            <p style={{ color: 'var(--dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Recarregue a página. Se o erro persistir, entre em contato.
            </p>
            <button className="btn-outline" onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
