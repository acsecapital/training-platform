import React, {useState } from 'react';
import {useRouter } from 'next/router';
import {IconButton } from '@/components/common/IconButton';
import {CourseProgress } from '@/types/course.types';

interface MobileNavigationMenuProps {
  courseProgress?: CourseProgress;
  onNavigate: (lessonId: string) => void;
}

export const MobileNavigationMenu: React.FC<MobileNavigationMenuProps> = ({
  courseProgress,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="mobile-navigation">
      <IconButton
        icon="menu"
        onClick={toggleMenu}
        className="mobile-menu-trigger"
        aria-label="Toggle navigation menu"
      />
      
      {isOpen && (
        <div className="mobile-menu-content">
          {/* Navigation content */}
        </div>
      )}
    </div>
  );
};