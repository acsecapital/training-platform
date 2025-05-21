import React from 'react';
import {useMediaQuery } from '@/hooks/useMediaQuery';
import {useWindowSize } from '@/hooks/useWindowSize';

interface ResponsiveLayoutManagerProps {
  children: React.ReactNode;
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
}

export const ResponsiveLayoutManager: React.FC<ResponsiveLayoutManagerProps> = ({
  children,
  mobileBreakpoint = 768,
  tabletBreakpoint = 1024,
}) => {
  const {width } = useWindowSize();
  const isMobile = useMediaQuery(`(max-width: ${mobileBreakpoint}px)`);
  const isTablet = useMediaQuery(`(max-width: ${tabletBreakpoint}px)`);

  return (
    <div className="responsive-layout" data-device={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}>
      {children}
    </div>
  );
};