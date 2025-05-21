import React, {useState, useEffect } from 'react';
import {motion, AnimatePresence } from 'framer-motion';

type FilterOption = {
  id: string;
  label: string;
};

type CourseFiltersProps = {
  categories: FilterOption[];
  levels: FilterOption[];
  durations: FilterOption[];
  onFilterChange: (filters: {
    category: string[];
    level: string[];
    duration: string[];
    search: string;
}) => void;
  className?: string;
};

const CourseFilters: React.FC<CourseFiltersProps> = ({
  categories,
  levels,
  durations,
  onFilterChange,
  className = '',
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side and determine if it's mobile
  useEffect(() => {
    setIsClient(true);
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
  };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
}, []);

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    const newSelectedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelectedCategories);

    onFilterChange({
      category: newSelectedCategories,
      level: selectedLevels,
      duration: selectedDurations,
      search: searchQuery,
  });
};

  // Handle level selection
  const handleLevelChange = (levelId: string) => {
    const newSelectedLevels = selectedLevels.includes(levelId)
      ? selectedLevels.filter(id => id !== levelId)
      : [...selectedLevels, levelId];

    setSelectedLevels(newSelectedLevels);

    onFilterChange({
      category: selectedCategories,
      level: newSelectedLevels,
      duration: selectedDurations,
      search: searchQuery,
  });
};

  // Handle duration selection
  const handleDurationChange = (durationId: string) => {
    const newSelectedDurations = selectedDurations.includes(durationId)
      ? selectedDurations.filter(id => id !== durationId)
      : [...selectedDurations, durationId];

    setSelectedDurations(newSelectedDurations);

    onFilterChange({
      category: selectedCategories,
      level: selectedLevels,
      duration: newSelectedDurations,
      search: searchQuery,
  });
};

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    onFilterChange({
      category: selectedCategories,
      level: selectedLevels,
      duration: selectedDurations,
      search: query,
  });
};

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedDurations([]);
    setSearchQuery('');

    onFilterChange({
      category: [],
      level: [],
      duration: [],
      search: '',
  });
};

  return (
    <div className={`bg-white rounded-xl shadow-soft p-6 ${className}`}>
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full flex items-center justify-between px-4 py-2 bg-neutral-100 rounded-md"
        >
          <span className="font-medium">Filters</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${isFiltersOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Search Input (Always Visible) */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-1">
          Search Courses
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by title or keyword..."
            className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Sections */}
      <AnimatePresence>
        {(isFiltersOpen || (!isMobile && isClient) || !isClient) && (
          <motion.div
            initial={{height: 0, opacity: 0 }}
            animate={{height: 'auto', opacity: 1 }}
            exit={{height: 0, opacity: 0 }}
            transition={{duration: 0.3 }}
            className="md:block overflow-hidden"
          >
            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      className="h-4 w-4 text-primary focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="ml-2 text-sm text-neutral-700"
                    >
                      {category.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Levels */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Levels</h3>
              <div className="space-y-2">
                {levels.map((level) => (
                  <div key={level.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`level-${level.id}`}
                      checked={selectedLevels.includes(level.id)}
                      onChange={() => handleLevelChange(level.id)}
                      className="h-4 w-4 text-primary focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <label
                      htmlFor={`level-${level.id}`}
                      className="ml-2 text-sm text-neutral-700"
                    >
                      {level.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Durations */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Duration</h3>
              <div className="space-y-2">
                {durations.map((duration) => (
                  <div key={duration.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`duration-${duration.id}`}
                      checked={selectedDurations.includes(duration.id)}
                      onChange={() => handleDurationChange(duration.id)}
                      className="h-4 w-4 text-primary focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <label
                      htmlFor={`duration-${duration.id}`}
                      className="ml-2 text-sm text-neutral-700"
                    >
                      {duration.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md hover:bg-neutral-200 transition-colors duration-200"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseFilters;
