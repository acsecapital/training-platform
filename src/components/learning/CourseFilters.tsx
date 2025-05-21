import React from 'react';

interface CourseFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  totalCourses: number;
  inProgressCount: number;
  completedCount: number;
}

const CourseFilters: React.FC<CourseFiltersProps> = ({
  activeFilter,
  setActiveFilter,
  sortOption,
  setSortOption,
  totalCourses,
  inProgressCount,
  completedCount
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
        }`}
        >
          All Courses ({totalCourses})
        </button>
        <button
          onClick={() => setActiveFilter('in-progress')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeFilter === 'in-progress'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
        }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeFilter === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
        }`}
        >
          Completed ({completedCount})
        </button>
      </div>
      
      <div className="flex items-center">
        <label htmlFor="sort" className="text-sm text-neutral-600 mr-2">
          Sort by:
        </label>
        <select
          id="sort"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="bg-white border border-neutral-300 text-neutral-700 text-sm rounded-lg focus:ring-primary focus:border-primary p-2"
        >
          <option value="recent">Recently Accessed</option>
          <option value="progress">Progress (High to Low)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>
    </div>
  );
};

export default CourseFilters;
