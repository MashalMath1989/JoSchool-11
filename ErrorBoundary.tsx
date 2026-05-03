import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-4">عذراً، حدث خطأ ما</h1>
            <p className="text-slate-500 font-bold mb-8">
              نواجه مشكلة تقنية بسيطة. يرجى محاولة إعادة تحميل الصفحة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg active:scale-95 transition-transform mb-3"
            >
              إعادة تحميل الصفحة
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('joschool_app_state');
                window.location.href = '/';
              }}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black active:scale-95 transition-transform"
            >
              تصفير الحالة والعودة للرئيسية
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-6 p-4 bg-slate-100 rounded-xl text-left text-[10px] overflow-auto max-h-40 text-red-600 font-mono">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
