import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import MainLayout from '@/components/layout/MainLayout';
import CourseGrid from '@/components/course-catalog/CourseGrid';
import CourseFilters from '@/components/course-catalog/CourseFilters';
import { useCourses } from '@/context/CourseContext';
import { parseDurationString } from '@/utils/durationUtils';

// Default filter options (will be replaced with real data)
// Use useMemo for constants if they were complex, but simple literals are fine.
const defaultCategoryOptions = [
  { id: 'sales', label: 'Sales' },
  { id: 'communication', label: 'Communication' },
  { id: 'leadership', label: 'Leadership' },
];

const defaultLevelOptions = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const durationOptions = [
  { id: 'short', label: 'Under 2 hours' },
  { id: 'medium', label: '2-4 hours' },
  { id: 'long', label: 'Over 4 hours' },
];

export default function CoursesPage() {
  // Get courses data from CONTEXT. 'allContextCourses' should now have a stable reference
  // unless its content genuinely changes.
  const { courses: allContextCourses, loading, error, fetchCourses } = useCourses();

  // Local STATE for filter selections
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false); // To track initial course load

  // Dynamic filter options are now calculated in useMemo below
  const [categoriesMap, setCategoriesMap] = useState<Map<string, string>>(new Map());

  // Fetch categories from Firestore (Runs once on mount)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesCollection = collection(firestore, 'categories');
        const categorySnapshot = await getDocs(categoriesCollection);
        const categoryMap = new Map<string, string>();
        categorySnapshot.forEach((doc) => {
          const data = doc.data();
          const name = typeof data.name === 'string' ? data.name : doc.id;
          categoryMap.set(doc.id, name);
        });
        setCategoriesMap(categoryMap);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    void fetchCategories();
  }, []); // Empty dependency array: runs once

  // Fetch courses using the context function (Runs once on mount due to stable fetchCourses)
  useEffect(() => {
    const loadCourses = async () => {
      // Avoid fetching if already initialized to prevent re-fetches on unrelated re-renders
      if (!isInitialized) {
        try {
          await fetchCourses(); // Use stable function from context
          setIsInitialized(true);
        } catch (error) {
          console.error('Error loading courses:', error);
          setIsInitialized(true); // Mark initialized even on error
        }
      }
    };
    void loadCourses();
  }, [fetchCourses, isInitialized]); // Depend on stable fetchCourses and isInitialized flag

  // Generate dynamic filter options based on courses (Memoized)
  const dynamicFilterOptions = useMemo(() => {
    // console.log("[CoursesPage] Recalculating dynamic filter options..."); // Debug log
    if (!allContextCourses || categoriesMap.size === 0) {
      // Return default or empty options if data isn't ready
      return {
        categoryOptions: defaultCategoryOptions,
        levelOptions: defaultLevelOptions,
      };
    }

    const publishedCourses = allContextCourses.filter(course => course.status === 'published');
    const uniqueCategoryIds = new Set<string>();
    publishedCourses.forEach(course => {
      if (course.category) uniqueCategoryIds.add(course.category);
      if (course.categoryIds) course.categoryIds.forEach(catId => uniqueCategoryIds.add(catId));
    });

    const calculatedCategoryOptions = Array.from(uniqueCategoryIds)
      .filter(catId => categoriesMap.has(catId))
      .map(catId => ({
        id: catId,
        label: categoriesMap.get(catId) || 'Unknown Category'
      }));

    const uniqueLevels = new Set<string>();
    publishedCourses.forEach(course => { if (course.level) uniqueLevels.add(course.level); });
    const calculatedLevelOptions = Array.from(uniqueLevels).map(level => ({
      id: level.toLowerCase(),
      label: level
    }));

    return {
      categoryOptions: calculatedCategoryOptions.length > 0 ? calculatedCategoryOptions : defaultCategoryOptions,
      levelOptions: calculatedLevelOptions.length > 0 ? calculatedLevelOptions : defaultLevelOptions,
    };
  }, [allContextCourses, categoriesMap]); // Dependencies: source courses and category map

  // Apply filters and search (Memoized) - This calculates the final list for CourseGrid
  const filteredCourses = useMemo(() => {
    // console.log("[CoursesPage] Applying filters..."); // Debug log
    if (!allContextCourses) return []; // Start with empty if context courses aren't ready

    let filtered = allContextCourses.filter(course => course.status === 'published');

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.title?.toLowerCase().includes(searchLower)) ||
        (c.description?.toLowerCase().includes(searchLower))
      );
    }
    // Apply level filter
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(c => c.level && selectedLevels.includes(c.level.toLowerCase()));
    }
    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(c =>
        selectedCategories.some(catId => (c.category === catId) || (c.categoryIds?.includes(catId)))
      );
    }
    // Apply duration filter
    if (selectedDurations.length > 0) {
      filtered = filtered.filter(c => {
        let hours: number = -1;
        try {
          if (c.durationDetails) hours = (c.durationDetails.hours || 0) + ((c.durationDetails.minutes || 0) / 60) + ((c.durationDetails.seconds || 0) / 3600);
          else if (typeof c.duration === 'string' && c.duration) {
            const parsed = parseDurationString(c.duration);
            if (parsed) hours = (parsed.hours || 0) + ((parsed.minutes || 0) / 60) + ((parsed.seconds || 0) / 3600);
          } else if (typeof c.duration === 'number') hours = c.duration / 3600;
        } catch { hours = -1; }
        if (hours < 0) return false;
        return selectedDurations.some(d => {
          if (d === 'short') return hours < 2;
          if (d === 'medium') return hours >= 2 && hours <= 4;
          if (d === 'long') return hours > 4;
          return false;
        });
      });
    }
    return filtered; // The result of this useMemo is the stable array for CourseGrid
  }, [allContextCourses, searchQuery, selectedCategories, selectedLevels, selectedDurations]); // Dependencies: source courses and all filter states

  // Handle filter changes from CourseFilters component (Callback for stability if passed down further)
  const handleFilterChange = useCallback((filters: {
    category: string[];
    level: string[];
    duration: string[];
    search: string;
  }) => {
    setSearchQuery(filters.search);
    setSelectedCategories(filters.category);
    setSelectedLevels(filters.level.map(l => l.toLowerCase())); // Store level IDs consistently
    setSelectedDurations(filters.duration);
  }, []); // No dependencies from component scope, setters are stable

  return (
    <MainLayout title="Courses | Closer College Training Platform">
      {/* Header */}
      <div className="bg-gradient-primary py-20 text-white">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          <h1 className="text-3xl font-bold mt-6 mb-4">Course Catalog</h1>
          <p className="text-lg opacity-90 max-w-3xl">Browse our comprehensive collection of sales training courses designed to help you master the LIPS Sales System and close more deals.</p>
        </div>
      </div>

      {/* Courses Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="w-full lg:w-1/4">
              {/* Pass memoized filter options */}
              <CourseFilters
                categories={dynamicFilterOptions.categoryOptions}
                levels={dynamicFilterOptions.levelOptions}
                durations={durationOptions} // Static options are fine
                onFilterChange={handleFilterChange} // Pass memoized handler
              />
            </div>

            {/* Course Grid */}
            <div className="w-full lg:w-3/4">
              {/* Results Summary */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'All Courses'}
                </h2>
                <p className="text-neutral-600">
                  {/* Use the length of the memoized filteredCourses */}
                  Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
                </p>
              </div>

              {/* Loading State */}
              {(loading && !isInitialized) ? (
                <div className="bg-white rounded-xl shadow-soft p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading courses...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-xl shadow-soft p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">Error loading courses</h3>
                  <p className="text-neutral-600 mb-4">{error}</p>
                  <button onClick={() => window.location.reload()} className="text-primary hover:text-primary-700 font-medium">Retry</button>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-soft p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                  <p className="text-neutral-600 mb-4">We couldn't find any courses matching your search or filter criteria.</p>
                  <button
                    onClick={() => handleFilterChange({
                      category: [],
                      level: [],
                      duration: [],
                      search: ''
                    })}
                    className="text-primary hover:text-primary-700 font-medium">Clear all filters</button>
                </div>
              ) : (
                // Pass the stable, memoized 'filteredCourses' array to CourseGrid
                <CourseGrid
                  courses={filteredCourses.map(course => ({
                    ...course,
                    progress: 0 // Default progress to 0 if not available
                  }))}
                  columns={3}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}