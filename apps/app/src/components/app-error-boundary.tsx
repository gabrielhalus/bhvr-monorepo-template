import { Component } from "react";

import { FatalError } from "@/components/fatal-error";
import { reportError } from "@/lib/report-error";

/**
 * Last-resort boundary around the whole app. The router has its own
 * `defaultErrorComponent` for route-level failures; this catches everything
 * else (providers, the router shell itself) so a crash never leaves a blank page.
 */
export class AppErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    reportError(error);
  }

  render() {
    return this.state.hasError ? <FatalError /> : this.props.children;
  }
}
