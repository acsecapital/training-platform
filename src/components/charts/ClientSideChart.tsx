import React, {useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface ClientSideChartProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that ensures charts are only rendered on the client side.
 * This prevents the "Cannot read properties of null (reading 'useRef')" error
 * that occurs when Recharts tries to render during server-side rendering.
 */
const ClientSideChartComponent: React.FC<ClientSideChartProps> = ({children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
}, []);

  if (!isMounted) {
    // Return a placeholder with the same dimensions until client-side rendering is ready
    return <div className="w-full h-full min-h-[300px] bg-neutral-50 animate-pulse rounded-md flex items-center justify-center">
      <div className="text-neutral-400">Loading chart...</div>
    </div>;
}

  // Once mounted on client-side, render the children
  return <>{children}</>;
};

// Use dynamic import with ssr: false to ensure the component only renders on the client side
const ClientSideChart = dynamic(() => Promise.resolve(ClientSideChartComponent), {
  ssr: false
});

export default ClientSideChart;
