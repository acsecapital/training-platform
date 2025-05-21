import React from 'react';

const StaticHeroBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Base background color */}
      <div className="absolute inset-0 bg-white"></div>
      
      {/* Gradient overlay */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-primary-50 to-white opacity-30"></div>
      
      {/* Static geometric shapes - replacing the animated ones */}
      <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-primary-50 opacity-15 blur-3xl"></div>
      <div className="absolute bottom-20 left-[10%] w-72 h-72 rounded-full bg-neutral-100 opacity-20 blur-3xl"></div>
      <div className="absolute top-[40%] right-[30%] w-96 h-96 rounded-full bg-secondary-50 opacity-10 blur-3xl"></div>
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.02
      }}>
      </div>
      
      {/* Gradient overlays */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to bottom left, #0e0e4f10 0%, transparent 100%)'
      }}
      ></div>
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to top left, #0e0e4f08 0%, transparent 70%, transparent 100%)'
      }}
      ></div>
    </div>
  );
};

export default StaticHeroBackground;
