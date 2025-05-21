import React, {useState, useEffect } from 'react';
import {collection, query, where, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface CategoryCountProps {
  categoryId: string;
  initialCount: number;
}

/**
 * Component to display and automatically update category course counts
 */
const CategoryCount: React.FC<CategoryCountProps> = ({categoryId, initialCount }) => {
  const [count, setCount] = useState<number>(initialCount);
  const [loading, setLoading] = useState<boolean>(false);

  // Function to fetch the actual count from Firestore
  const fetchActualCount = async () => {
    try {
      setLoading(true);
      
      // Count courses that have this category
      const coursesSnapshot = await getDocs(
        query(
          collection(firestore, 'courses'),
          where('categoryIds', 'array-contains', categoryId)
        )
      );
      
      const actualCount = coursesSnapshot.size;
      
      // Only update if the count has changed
      if (actualCount !== count) {
        console.log(`Category ${categoryId} count updated: ${count} → ${actualCount}`);
        setCount(actualCount);
    }
  } catch (error) {
      console.error(`Error fetching count for category ${categoryId}:`, error);
  } finally {
      setLoading(false);
  }
};

  // Fetch the actual count on mount and when categoryId changes
  useEffect(() => {
    fetchActualCount();
    
    // Set up a refresh interval
    const refreshInterval = setInterval(() => {
      fetchActualCount();
  }, 30000); // Refresh every 30 seconds
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
}, [categoryId]);

  return (
    <div className="text-sm text-neutral-500">
      {loading ? (
        <span className="inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {count}
        </span>
      ) : (
        <span>{count} {count === 1 ? 'course' : 'courses'}</span>
      )}
    </div>
  );
};

export default CategoryCount;
