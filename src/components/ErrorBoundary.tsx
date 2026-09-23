import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-card"
          className="p-6 rounded-xl bg-slate-900 border border-red-500/40 text-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-lg min-h-[300px]"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {this.props.fallbackTitle || 'Se produjo un problema al renderizar el visor'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {this.state.error?.message || 'Error inesperado durante la ejecución gráfica.'}
            </p>
          </div>
          <button
            id="btn-error-boundary-retry"
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recuperar Vista</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
