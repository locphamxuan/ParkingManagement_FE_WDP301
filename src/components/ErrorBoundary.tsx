import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-8 text-center">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4">
            <p className="text-sm font-bold text-rose-300">Something went wrong</p>
            {this.state.message ? (
              <p className="mt-1 text-xs text-rose-400/80">{this.state.message}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-white px-6 py-2.5 text-sm font-black text-slate-950 transition hover:bg-white/90"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
