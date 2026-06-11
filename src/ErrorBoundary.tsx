import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "../components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-black mb-2 tracking-tighter">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md mb-8 text-sm">
            We encountered an unexpected error. This has been logged and we're looking into it.
          </p>
          <div className="bg-muted p-4 rounded-2xl mb-8 w-full max-w-md overflow-auto text-left">
            <p className="text-[10px] font-mono text-destructive uppercase font-bold mb-1">Error Details</p>
            <p className="text-xs font-mono break-words">{this.state.error?.message || "Unknown error"}</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => window.location.href = "/"}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button
              className="rounded-full px-6 bg-primary"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
