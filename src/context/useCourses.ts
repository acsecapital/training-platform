import {useContext } from 'react';
import {CourseContext } from './CourseContext';

export const useCourses = () => {
  const context = useContext(CourseContext);
  
  if (context === undefined) {
    throw new Error('useCourses must be used within a CourseProvider');
}
  
  return context;
};
