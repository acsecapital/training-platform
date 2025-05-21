import React, {useId } from 'react';

const StaticTrianglesBackground: React.FC = () => {
  // Generate a unique ID for the gradient
  const gradientId = useId();
  // Define static triangles with pre-positioned coordinates
  const staticTriangles = [
    // First set
    {top: '15%', left: '10%', size: 40, rotation: 45, opacity: 0.7, color: '#8a0200'},
    {top: '25%', left: '85%', size: 120, rotation: 180, opacity: 0.6, color: '#8a0200'},
    {top: '40%', left: '25%', size: 80, rotation: 120, opacity: 0.7, color: '#8a0200'},
    {top: '65%', left: '75%', size: 60, rotation: 210, opacity: 0.6, color: '#8a0200'},
    {top: '80%', left: '15%', size: 100, rotation: 90, opacity: 0.5, color: '#8a0200'},
    {top: '10%', left: '40%', size: 70, rotation: 30, opacity: 0.6, color: '#8a0200'},
    {top: '50%', left: '60%', size: 90, rotation: 150, opacity: 0.7, color: '#8a0200'},
    {top: '75%', left: '35%', size: 50, rotation: 270, opacity: 0.7, color: '#8a0200'},
    {top: '30%', left: '5%', size: 110, rotation: 60, opacity: 0.5, color: '#8a0200'},
    {top: '20%', left: '65%', size: 85, rotation: 240, opacity: 0.7, color: '#8a0200'},
    {top: '60%', left: '90%', size: 75, rotation: 15, opacity: 0.6, color: '#8a0200'},
    {top: '85%', left: '55%', size: 65, rotation: 135, opacity: 0.7, color: '#8a0200'},
    {top: '5%', left: '30%', size: 95, rotation: 300, opacity: 0.6, color: '#8a0200'},
    {top: '45%', left: '45%', size: 55, rotation: 75, opacity: 0.7, color: '#8a0200'},
    {top: '70%', left: '20%', size: 105, rotation: 225, opacity: 0.5, color: '#8a0200'},
    {top: '35%', left: '80%', size: 45, rotation: 165, opacity: 0.7, color: '#8a0200'},
    {top: '55%', left: '10%', size: 115, rotation: 330, opacity: 0.5, color: '#8a0200'},
    {top: '15%', left: '50%', size: 125, rotation: 195, opacity: 0.6, color: '#8a0200'},
    {top: '90%', left: '70%', size: 35, rotation: 105, opacity: 0.7, color: '#8a0200'},
    {top: '25%', left: '35%', size: 130, rotation: 285, opacity: 0.6, color: '#8a0200'},
    {top: '75%', left: '85%', size: 25, rotation: 255, opacity: 0.7, color: '#8a0200'},
    {top: '40%', left: '15%', size: 140, rotation: 345, opacity: 0.5, color: '#8a0200'},
    {top: '60%', left: '60%', size: 30, rotation: 15, opacity: 0.7, color: '#8a0200'},
    {top: '10%', left: '75%', size: 135, rotation: 135, opacity: 0.5, color: '#8a0200'},
    {top: '50%', left: '30%', size: 20, rotation: 75, opacity: 0.6, color: '#8a0200'},
    {top: '80%', left: '45%', size: 145, rotation: 225, opacity: 0.7, color: '#8a0200'},
    {top: '30%', left: '65%', size: 15, rotation: 165, opacity: 0.6, color: '#8a0200'},
    {top: '70%', left: '5%', size: 150, rotation: 315, opacity: 0.7, color: '#8a0200'},
    {top: '20%', left: '90%', size: 10, rotation: 255, opacity: 0.5, color: '#8a0200'},
    {top: '85%', left: '25%', size: 155, rotation: 45, opacity: 0.7, color: '#8a0200'},

    // Additional triangles
    {top: '12%', left: '22%', size: 50, rotation: 15, opacity: 0.6, color: '#8a0200'},
    {top: '38%', left: '88%', size: 70, rotation: 95, opacity: 0.7, color: '#8a0200'},
    {top: '62%', left: '42%', size: 110, rotation: 200, opacity: 0.6, color: '#8a0200'},
    {top: '78%', left: '65%', size: 90, rotation: 280, opacity: 0.7, color: '#8a0200'},
    {top: '22%', left: '18%', size: 130, rotation: 160, opacity: 0.6, color: '#8a0200'},
    {top: '48%', left: '78%', size: 60, rotation: 320, opacity: 0.7, color: '#8a0200'},
    {top: '68%', left: '12%', size: 100, rotation: 110, opacity: 0.5, color: '#8a0200'},
    {top: '8%', left: '58%', size: 80, rotation: 230, opacity: 0.6, color: '#8a0200'},
    {top: '52%', left: '92%', size: 40, rotation: 50, opacity: 0.7, color: '#8a0200'},
    {top: '82%', left: '38%', size: 120, rotation: 140, opacity: 0.6, color: '#8a0200'},
    {top: '28%', left: '72%', size: 65, rotation: 260, opacity: 0.7, color: '#8a0200'},
    {top: '58%', left: '28%', size: 85, rotation: 30, opacity: 0.6, color: '#8a0200'},
    {top: '88%', left: '82%', size: 55, rotation: 170, opacity: 0.7, color: '#8a0200'},
    {top: '18%', left: '48%', size: 95, rotation: 290, opacity: 0.6, color: '#8a0200'},
    {top: '42%', left: '68%', size: 75, rotation: 80, opacity: 0.7, color: '#8a0200'},
    {top: '72%', left: '52%', size: 115, rotation: 190, opacity: 0.6, color: '#8a0200'},
    {top: '32%', left: '42%', size: 45, rotation: 310, opacity: 0.7, color: '#8a0200'},
    {top: '62%', left: '82%', size: 125, rotation: 100, opacity: 0.6, color: '#8a0200'},
    {top: '92%', left: '18%', size: 35, rotation: 220, opacity: 0.7, color: '#8a0200'},
    {top: '2%', left: '68%', size: 105, rotation: 340, opacity: 0.6, color: '#8a0200'},
  ];

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

      {/* SVG Gradient Definition */}
      <svg style={{position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8a0200" stopOpacity="0" />
            <stop offset="100%" stopColor="#8a0200" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Static triangles scattered throughout - outline only with gradient stroke */}
      {staticTriangles.map((triangle, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            top: triangle.top,
            left: triangle.left,
            width: `${triangle.size}px`,
            height: `${triangle.size}px`,
            opacity: triangle.opacity,
            transform: `rotate(${triangle.rotation}deg)`,
            zIndex: 1
        }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points="50,0 0,100 100,100"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="1"
            />
          </svg>
        </div>
      ))}

      {/* Removed the gradient overlays as we now have gradient on the triangle strokes */}
    </div>
  );
};

export default StaticTrianglesBackground;
