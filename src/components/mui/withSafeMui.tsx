import React from 'react';
import dynamic from 'next/dynamic';
import SafeMuiWrapper from './SafeMuiWrapper';

/**
 * Higher-order component that wraps a component with SafeMuiWrapper
 * This ensures that MUI components have access to the necessary context
 * 
 * @param Component The component to wrap
 * @returns A wrapped component that is safe to use with MUI components
 */
export function withSafeMui<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const WithSafeMui: React.FC<P> = (props) => {
    return (
      <SafeMuiWrapper>
        <Component {...props} />
      </SafeMuiWrapper>
    );
};

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithSafeMui.displayName = `withSafeMui(${displayName})`;

  return WithSafeMui;
}

/**
 * Creates a dynamic import with SSR disabled and wrapped with SafeMuiWrapper
 * 
 * @param importFn Function that imports the component
 * @returns A dynamic component that is safe to use with MUI components
 */
export function dynamicWithSafeMui<P extends object>(
  importFn: () => Promise<{default: React.ComponentType<P> }>
) {
  return dynamic(() => importFn().then(mod => {
    const Component = mod.default;
    return withSafeMui(Component);
}), {ssr: false });
}

export default withSafeMui;
