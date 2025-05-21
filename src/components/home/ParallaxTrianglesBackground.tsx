import React, {useEffect, useState, useRef, useId } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speedY: number;
  speedX: number;
  color?: string;
  fadeDirection: 1 | -1; // 1 for fading in, -1 for fading out
  fadeSpeed: number;
}

const ParallaxTrianglesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleCount = 800;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeParticles();
  };

    const initializeParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 0.5 + 0.2;
        const color = `rgba(14, 14, 79, ${Math.random() * 0.4 + 0.6})`;
        
        // Determine if this particle should move in the opposite direction (about 30% of particles)
        const isOppositeDirection = Math.random() < 0.3;
        
        // Set speed based on direction - opposite direction particles move faster
        const speedY = isOppositeDirection 
          ? (Math.random() * 0.05 + 0.03) * -1 // Faster upward movement
          : (Math.random() - 0.4) * 0.02;      // Original downward movement
          
        const speedX = isOppositeDirection
          ? (Math.random() * 0.8 + 0.4) * (Math.random() < 0.5 ? -1 : 1) * 0.4 // Faster horizontal movement
          : (Math.random() - 0.8) * 0.6 * 0.4;                                 // Original horizontal movement
        
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius,
          opacity: Math.random() * 1 + 0.3,
          speedY,
          speedX,
          color: color,
          fadeDirection: Math.random() > 0.5 ? 1 : -1,
          fadeSpeed: Math.random() * 0.0002 + 0.0001,
      });
    }
  };

    const drawParticle = (particle: Particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14, 14, 79, ${Math.max(0, Math.min(1, particle.opacity))})`; // Ensure opacity stays within 0 and 1
      ctx.fill();
      ctx.closePath();
  };

    const drawLight = () => {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        0,
        0,
        canvas.width / 2,
        canvas.height * 0.6,
        canvas.height * 0.6
      );
      gradient.addColorStop(0, `rgba(0, 0, 79, 0.1)`);
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLight();
      particlesRef.current.forEach(particle => {
        particle.y += particle.speedY;
        particle.x += particle.speedX;

        // Update opacity for the fade effect
        particle.opacity += particle.fadeSpeed * particle.fadeDirection;

        // Reverse fade direction if opacity reaches the limits
        if (particle.opacity > 1) {
          particle.opacity = 1;
          particle.fadeDirection = -1;
      } else if (particle.opacity < 0) {
          particle.opacity = 0;
          particle.fadeDirection = 1;
      }

        if (particle.y > canvas.height + particle.radius) {
          particle.y = -particle.radius;
          particle.x = Math.random() * canvas.width;
      }
        if (particle.x > canvas.width + particle.radius) {
          particle.x = -particle.radius;
      }
        if (particle.x < -particle.radius) {
          particle.x = canvas.width + particle.radius;
      }

        drawParticle(particle);
    });
      requestAnimationFrame(animate);
  };

    setCanvasSize();
    initializeParticles();
    animate();

    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
  };
}, [particleCount]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" style={{backgroundColor: '#f0f0f8'}}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{zIndex: 0 }}
      />
    </div>
  );
};

export default ParallaxTrianglesBackground;
