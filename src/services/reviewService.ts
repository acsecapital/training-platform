import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import {firestore } from './firebase';
import {CourseReview } from '@/types/course.types';

// Cache for reviews to reduce Firestore reads
interface ReviewCache {
  [key: string]: {
    reviews: CourseReview[];
    timestamp: number;
    expiresIn: number; // milliseconds
}
}

// Global cache object
const reviewCache: ReviewCache = {};

/**
 * Get reviews for a course
 * @param courseId Course ID
 * @param limitCount Optional limit on number of reviews to fetch
 * @param useCache Whether to use cached data (default: true)
 * @returns Promise with array of reviews
 */
export const getCourseReviews = async (
  courseId: string,
  limitCount?: number,
  useCache: boolean = true
): Promise<CourseReview[]> => {
  try {
    // Generate cache key
    const cacheKey = `reviews_${courseId}_${limitCount || 'all'}`;

    // Check if we have valid cached data
    if (useCache && reviewCache[cacheKey]) {
      const cachedData = reviewCache[cacheKey];
      const now = Date.now();

      // If cache is still valid, return it
      if (now - cachedData.timestamp < cachedData.expiresIn) {

        return cachedData.reviews;
    }
  }

    // If no valid cache, fetch from Firestore
    const reviewsRef = collection(firestore, 'courseReviews');
    let reviewQuery;

    if (courseId) {
      // If courseId is provided, filter by that course
      reviewQuery = query(
        reviewsRef,
        where('courseId', '==', courseId),
        orderBy('date', 'desc')
      );
  } else {
      // If no courseId is provided, get all reviews
      reviewQuery = query(
        reviewsRef,
        orderBy('date', 'desc')
      );
  }

    if (limitCount) {
      reviewQuery = query(reviewQuery, limit(limitCount));
  }

    const reviewSnapshot = await getDocs(reviewQuery);
    const reviews: CourseReview[] = [];

    reviewSnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        courseId: data.courseId as string,
        userId: data.userId as string,
        userName: data.userName as string,
        userAvatar: data.userAvatar as string,
        rating: data.rating as number,
        comment: data.comment as string,
        date: data.date as string,
        helpful: (data.helpful as number) || 0,
        reported: (data.reported as boolean) || false,
    });
  });

    // Cache the results (15 minute expiration)
    reviewCache[cacheKey] = {
      reviews,
      timestamp: Date.now(),
      expiresIn: 15 * 60 * 1000 // 15 minutes
  };

    // Also store in localStorage for persistence between page loads
    try {
      localStorage.setItem(cacheKey, JSON.stringify(reviews));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
  } catch (err) {
      console.error('Error storing reviews in localStorage:', err);
  }

    return reviews;
} catch (error) {
    console.error('Error fetching course reviews:', error);

    // If there's an error but we have cached data, return it as a fallback
    const cacheKey = `reviews_${courseId}_${limitCount || 'all'}`;
    if (reviewCache[cacheKey]) {

      return reviewCache[cacheKey].reviews;
  }

    throw error;
}
};

/**
 * Add a review for a course
 * @param review Review data
 * @returns Promise with the new review ID
 */
export const addCourseReview = async (review: Omit<CourseReview, 'id' | 'date'>): Promise<string> => {
  try {
    // Check if user has already reviewed this course
    const existingReview = await getUserCourseReview(review.userId, review.courseId);

    if (existingReview) {
      throw new Error('You have already reviewed this course');
  }

    // Add the review
    const reviewsRef = collection(firestore, 'courseReviews');
    const newReview = {
      ...review,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
  };

    const docRef = await addDoc(reviewsRef, newReview);

    // Update course rating
    await updateCourseRating(review.courseId);

    return docRef.id;
} catch (error) {
    console.error('Error adding course review:', error);
    throw error;
}
};

/**
 * Update a review
 * @param reviewId Review ID
 * @param data Updated review data
 * @returns Promise
 */
export const updateCourseReview = async (
  reviewId: string,
  data: Partial<Omit<CourseReview, 'id' | 'userId' | 'courseId' | 'date'>>
): Promise<void> => {
  try {
    const reviewRef = doc(firestore, 'courseReviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
  }

    await updateDoc(reviewRef, {
      ...data,
      updatedAt: serverTimestamp(),
  });

    // Update course rating if rating changed
    if (data.rating) {
      const courseId = reviewDoc.data().courseId as string;
      await updateCourseRating(courseId);
  }
} catch (error) {
    console.error('Error updating course review:', error);
    throw error;
}
};

/**
 * Mark a review as helpful
 * @param reviewId Review ID
 * @returns Promise
 */
export const markReviewHelpful = async (reviewId: string): Promise<void> => {
  try {
    const reviewRef = doc(firestore, 'courseReviews', reviewId);
    await updateDoc(reviewRef, {
      helpful: increment(1),
      updatedAt: serverTimestamp(),
  });
} catch (error) {
    console.error('Error marking review as helpful:', error);
    throw error;
}
};

/**
 * Report a review
 * @param reviewId Review ID
 * @returns Promise
 */
export const reportReview = async (reviewId: string): Promise<void> => {
  try {
    const reviewRef = doc(firestore, 'courseReviews', reviewId);
    await updateDoc(reviewRef, {
      reported: true,
      updatedAt: serverTimestamp(),
  });
} catch (error) {
    console.error('Error reporting review:', error);
    throw error;
}
};

/**
 * Get a user's review for a specific course
 * @param userId User ID
 * @param courseId Course ID
 * @param useCache Whether to use cached data (default: true)
 * @returns Promise with the review or null if not found
 */
export const getUserCourseReview = async (
  userId: string,
  courseId: string,
  useCache: boolean = true
): Promise<CourseReview | null> => {
  try {
    // Generate cache key
    const cacheKey = `user_review_${userId}_${courseId}`;

    // Check if we have valid cached data
    if (useCache && reviewCache[cacheKey]) {
      const cachedData = reviewCache[cacheKey];
      const now = Date.now();

      // If cache is still valid, return it
      if (now - cachedData.timestamp < cachedData.expiresIn) {

        return cachedData.reviews[0] || null;
    }
  }

    const reviewsRef = collection(firestore, 'courseReviews');
    const reviewQuery = query(
      reviewsRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );

    const reviewSnapshot = await getDocs(reviewQuery);

    if (reviewSnapshot.empty) {
      // Cache the null result to avoid repeated queries
      reviewCache[cacheKey] = {
        reviews: [],
        timestamp: Date.now(),
        expiresIn: 15 * 60 * 1000 // 15 minutes
    };
      return null;
  }

    const doc = reviewSnapshot.docs[0];
    const data = doc.data();

    const review = {
      id: doc.id,
      courseId: data.courseId as string,
      userId: data.userId as string,
      userName: data.userName as string,
      userAvatar: data.userAvatar as string,
      rating: data.rating as number,
      comment: data.comment as string,
      date: data.date as string,
      helpful: (data.helpful as number) || 0,
      reported: (data.reported as boolean) || false,
  };

    // Cache the result
    reviewCache[cacheKey] = {
      reviews: [review],
      timestamp: Date.now(),
      expiresIn: 15 * 60 * 1000 // 15 minutes
  };

    // Also store in localStorage for persistence between page loads
    try {
      localStorage.setItem(cacheKey, JSON.stringify(review));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
  } catch (err) {
      console.error('Error storing user review in localStorage:', err);
  }

    return review;
} catch (error) {
    console.error('Error fetching user course review:', error);

    // If there's an error but we have cached data, return it as a fallback
    const cacheKey = `user_review_${userId}_${courseId}`;
    if (reviewCache[cacheKey]) {

      return reviewCache[cacheKey].reviews[0] || null;
  }

    throw error;
}
};

/**
 * Update course rating based on reviews
 * @param courseId Course ID
 * @returns Promise
 */
export const updateCourseRating = async (courseId: string): Promise<void> => {
  try {
    // Get all reviews for the course
    const reviewsRef = collection(firestore, 'courseReviews');
    const reviewQuery = query(
      reviewsRef,
      where('courseId', '==', courseId)
    );

    const reviewSnapshot = await getDocs(reviewQuery);

    if (reviewSnapshot.empty) {
      // No reviews, set default rating
      const courseRef = doc(firestore, 'courses', courseId);
      await updateDoc(courseRef, {
        rating: 0,
        reviewCount: 0,
        updatedAt: serverTimestamp(),
    });
      return;
  }

    // Calculate average rating
    let totalRating = 0;
    reviewSnapshot.forEach((doc) => {
      totalRating += doc.data().rating;
  });

    const averageRating = totalRating / reviewSnapshot.size;

    // Update course document
    const courseRef = doc(firestore, 'courses', courseId);
    await updateDoc(courseRef, {
      rating: averageRating,
      reviewCount: reviewSnapshot.size,
      updatedAt: serverTimestamp(),
  });
} catch (error) {
    console.error('Error updating course rating:', error);
    throw error;
}
};

/**
 * Get reported reviews
 * @param limitCount Optional limit on number of reviews to fetch
 * @returns Promise with array of reported reviews
 */
export const getReportedReviews = async (limitCount?: number): Promise<CourseReview[]> => {
  try {
    const reviewsRef = collection(firestore, 'courseReviews');
    let reviewQuery = query(
      reviewsRef,
      where('reported', '==', true),
      orderBy('date', 'desc')
    );

    if (limitCount) {
      reviewQuery = query(reviewQuery, limit(limitCount));
  }

    const reviewSnapshot = await getDocs(reviewQuery);
    const reviews: CourseReview[] = [];

    reviewSnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        courseId: data.courseId as string,
        userId: data.userId as string,
        userName: data.userName as string,
        userAvatar: data.userAvatar as string,
        rating: data.rating as number,
        comment: data.comment as string,
        date: data.date as string,
        helpful: (data.helpful as number) || 0,
        reported: (data.reported as boolean) || false,
    });
  });

    return reviews;
} catch (error) {
    console.error('Error fetching reported reviews:', error);
    throw error;
}
};

