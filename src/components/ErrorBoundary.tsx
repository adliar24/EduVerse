// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  hasRetried: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  private retryTimeout: any = null;

  public state: State = {
    hasError: false,
    error: null,
    hasRetried: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, hasRetried: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Auto-reload for chunk load errors (Vite dynamic import failures)
    if (
      error.name === 'ChunkLoadError' || 
      error.message?.includes('fetch dynamically imported module') || 
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('Importing a module script failed')
    ) {
      window.location.reload();
      return;
    }

    // Auto-recover once silently for transient hydration / auth race condition errors
    if (!this.state.hasRetried) {
      this.retryTimeout = setTimeout(() => {
        this.setState({ hasError: false, error: null, hasRetried: true });
      }, 150);
    }
  }

  public componentWillUnmount() {
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
  }

  public render() {
    if (this.state.hasError) {
      // If we haven't retried yet, show a subtle loading spinner instead of a scary red box
      if (!this.state.hasRetried) {
        return (
          <div className="flex items-center justify-center min-h-[50vh] w-full">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-950 border-t-transparent animate-spin" />
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <div className="bg-red-50 text-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Ups, Terjadi Kesalahan!</h2>
          <p className="text-slate-500 mb-6 max-w-md">
            Sistem gagal memuat tampilan. Hal ini bisa disebabkan oleh masalah jaringan, data sesi tidak valid, atau inkompatibilitas browser.
          </p>
          {this.state.error && (
            <div className="bg-slate-100 p-4 rounded-xl text-left overflow-auto max-w-full w-full mb-6 border border-slate-200">
              <code className="text-[11px] text-rose-600 whitespace-pre-wrap font-mono font-bold">
                {this.state.error.toString()}
              </code>
            </div>
          )}
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null, hasRetried: false });
              if (this.props.onReset) this.props.onReset();
              else window.location.reload();
            }}
            className="flex items-center gap-2 bg-indigo-950 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-900 transition-all active:scale-95 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Muat Ulang Form
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
