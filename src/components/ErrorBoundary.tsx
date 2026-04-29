import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark flex items-center justify-center text-white p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
            <p className="text-white/60 mb-6">
              Hubo un error inesperado. Probá refrescar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl font-medium transition-colors"
            >
              Refrescar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
