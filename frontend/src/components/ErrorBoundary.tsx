import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-neutral-200">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Oops, something broke!</h1>
            <p className="text-neutral-400 mb-8 text-sm">
              We hit an unexpected error. This might be due to a network drop or a browser quirk. 
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}