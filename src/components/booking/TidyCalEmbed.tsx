import React, {useEffect, useRef } from 'react';

interface TidyCalEmbedProps {
  path: string;
}

const TidyCalEmbed: React.FC<TidyCalEmbedProps> = ({path }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run this on the client side
    if (typeof window !== 'undefined' && containerRef.current) {
      // Clear any existing content
      containerRef.current.innerHTML = '';

      // Create the TidyCal embed div
      const embedDiv = document.createElement('div');
      embedDiv.className = 'tidycal-embed';
      embedDiv.setAttribute('data-path', path);
      containerRef.current.appendChild(embedDiv);

      // Create and append the script
      const script = document.createElement('script');
      script.src = 'https://assets.tidycal.com/js/embed.js';
      script.async = true;
      containerRef.current.appendChild(script);
  }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
    }
  };
}, [path]); // Re-run if path changes

  return (
    <div className="w-full overflow-visible min-h-[400px]">
      <div ref={containerRef} className="w-full h-full"></div>
    </div>
  );
};

export default TidyCalEmbed;
