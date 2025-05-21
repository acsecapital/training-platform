import React, {useState, useEffect } from 'react';

interface CourseFiltersProps {
  onFilterChange: (status: 'all' | 'draft' | 'published', level: 'all' | 'Beginner' | 'Intermediate' | 'Advanced') => void;
  onSearch: (query: string) => void;
  statusFilter: 'all' | 'draft' | 'published';
  levelFilter: 'all' | 'Beginner' | 'Intermediate' | 'Advanced';
  searchQuery: string;
}

const CourseFilters: React.FC<CourseFiltersProps> = ({
  onFilterChange,
  onSearch,
  statusFilter,
  levelFilter,
  searchQuery,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localLevelFilter, setLocalLevelFilter] = useState(levelFilter);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
    setLocalStatusFilter(statusFilter);
    setLocalLevelFilter(levelFilter);
}, [searchQuery, statusFilter, levelFilter]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
};

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
};

  // Handle status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'all' | 'draft' | 'published';
    setLocalStatusFilter(newStatus);
    onFilterChange(newStatus, localLevelFilter);
};

  // Handle level filter change
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value as 'all' | 'Beginner' | 'Intermediate' | 'Advanced';
    setLocalLevelFilter(newLevel);
    onFilterChange(localStatusFilter, newLevel);
};

  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <div className="md:flex md:items-center md:justify-between">
        {/* Search */}
        <div className="w-full md:w-1/3">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                value={localSearchQuery}
                onChange={handleSearchChange}
                placeholder="Search courses..."
                className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button type="submit" className="hidden">Search</button>
            </div>
          </form>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="mt-4 md:hidden">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 border border-neutral-300 rounded-md bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <span>Filters</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-neutral-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className={`mt-4 md:mt-0 md:flex md:items-center md:space-x-4 ${isExpanded ? 'block' : 'hidden md:flex'}`}>
          <div className="mb-4 md:mb-0">
            <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={localStatusFilter}
              onChange={handleStatusChange}
              className="w-full md:w-auto px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label htmlFor="level-filter" className="block text-sm font-medium text-neutral-700 mb-1">
              Level
            </label>
            <select
              id="level-filter"
              value={localLevelFilter}
              onChange={handleLevelChange}
              className="w-full md:w-auto px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseFilters;
