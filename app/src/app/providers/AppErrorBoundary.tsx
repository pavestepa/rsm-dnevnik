import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

type ErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Something went wrong.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}
