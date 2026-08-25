import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6">Please refresh the page. If this keeps happening, contact support.</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold">
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
