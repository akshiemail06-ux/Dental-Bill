import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    const state = (this as any).state;
    if (state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      
      try {
        const parsedError = JSON.parse(state.error?.message || "");
        if (parsedError.error && parsedError.error.includes("permissions")) {
          errorMessage = "You don't have permission to perform this action or access this data.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
            <AlertCircle size={48} />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Oops! An error occurred</h1>
          <p className="mb-6 max-w-md text-gray-600">
            {errorMessage}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Refresh Page
          </Button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
