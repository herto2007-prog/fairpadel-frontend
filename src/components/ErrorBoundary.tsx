import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — atrapa errores de JavaScript en cualquier componente hijo
 * y muestra una pantalla de fallback en lugar de una pantalla blanca.
 *
 * React solo soporta error boundaries como Class Components (no hooks).
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error para debugging (visible en consola del browser)
    console.error('[ErrorBoundary] Error capturado:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-surface flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Logo */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-primary-500">FairPadel</span>
            </div>

            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            {/* Message */}
            <h1 className="text-xl font-semibold text-light-text mb-2">
              Algo salió mal
            </h1>
            <p className="text-light-secondary text-sm mb-6">
              Ocurrió un error inesperado. Podés intentar recargar la página o volver al inicio.
            </p>

            {/* Error detail (solo en dev, colapsable) */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-light-secondary cursor-pointer hover:text-light-text transition-colors">
                  Ver detalle técnico
                </summary>
                <pre className="mt-2 p-3 bg-dark-card border border-dark-border rounded-lg text-xs text-red-400 overflow-x-auto whitespace-pre-wrap break-words">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 bg-dark-card hover:bg-dark-hover text-light-text border border-dark-border font-medium rounded-lg transition-colors"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
