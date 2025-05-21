import React from 'react';

interface CourseStatusBadgeProps {
  status: 'draft' | 'published';
}

const CourseStatusBadge: React.FC<CourseStatusBadgeProps> = ({status }) => {
  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        status === 'published'
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
    }`}
    >
      {status === 'published' ? 'Published' : 'Draft'}
    </span>
  );
};

export default CourseStatusBadge;
