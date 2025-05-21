import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {firestore } from './firebase';
import {FeedbackFormData } from '@/components/feedback/FeedbackForm';

export interface Feedback extends FeedbackFormData {
  id: string;
  createdAt: string; // Already converted to ISOString in the functions
  status: 'new' | 'reviewed' | 'resolved' | 'archived';
  // Add other fields that might be present in doc.data() but not in FeedbackFormData
  // For example, if Firestore automatically adds/updates other fields not covered by FeedbackFormData
  [key: string]: unknown; // Allows for additional properties not strictly defined, use with caution
}

/**
 * Submit user feedback
 * @param feedback Feedback data
 * @returns Promise with the new feedback ID
 */
export const submitFeedback = async (feedback: FeedbackFormData): Promise<string> => {
  try {
    const feedbackRef = collection(firestore, 'feedback');
    const newFeedback = {
      ...feedback,
      createdAt: serverTimestamp(),
      status: 'new', // new, reviewed, resolved, archived
  };

    const docRef = await addDoc(feedbackRef, newFeedback);
    return docRef.id;
} catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
}
};

/**
 * Get all feedback
 * @param limitCount Optional limit on number of feedback items to fetch
 * @returns Promise with array of feedback items
 */
export const getAllFeedback = async (limitCount?: number): Promise<Feedback[]> => {
  try {
    const feedbackRef = collection(firestore, 'feedback');
    let feedbackQuery = query(
      feedbackRef,
      orderBy('createdAt', 'desc')
    );

    if (limitCount) {
      feedbackQuery = query(feedbackQuery, limit(limitCount));
  }

    const feedbackSnapshot = await getDocs(feedbackQuery);
    const feedback: Feedback[] = [];

    feedbackSnapshot.forEach((doc) => {
      const data = doc.data();
      const feedbackItem: Feedback = {
        id: doc.id,
        category: data.category as string,
        source: data.source as string,
        userId: data.userId as string,
        userName: data.userName as string,
        userEmail: data.userEmail as string || undefined,
        rating: data.rating as number,
        feedback: data.feedback as string,
        status: (data.status as 'new' | 'reviewed' | 'resolved' | 'archived') || 'new',
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt as string),
        metadata: data.metadata as Record<string, unknown> || undefined
      };

      // Add any additional fields from data
      Object.entries(data).forEach(([key, value]) => {
        if (!feedbackItem.hasOwnProperty(key)) {
          (feedbackItem as Record<string, unknown>)[key] = value;
        }
      });

      feedback.push(feedbackItem);
  });

    return feedback;
} catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
}
};

/**
 * Get feedback by category
 * @param category Feedback category
 * @param limitCount Optional limit on number of feedback items to fetch
 * @returns Promise with array of feedback items
 */
export const getFeedbackByCategory = async (category: string, limitCount?: number): Promise<Feedback[]> => {
  try {
    const feedbackRef = collection(firestore, 'feedback');
    let feedbackQuery = query(
      feedbackRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );

    if (limitCount) {
      feedbackQuery = query(feedbackQuery, limit(limitCount));
  }

    const feedbackSnapshot = await getDocs(feedbackQuery);
    const feedback: Feedback[] = [];

    feedbackSnapshot.forEach((doc) => {
      const data = doc.data();
      const feedbackItem: Feedback = {
        id: doc.id,
        category: data.category as string,
        source: data.source as string,
        userId: data.userId as string,
        userName: data.userName as string,
        userEmail: data.userEmail as string || undefined,
        rating: data.rating as number,
        feedback: data.feedback as string,
        status: (data.status as 'new' | 'reviewed' | 'resolved' | 'archived') || 'new',
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt as string),
        metadata: data.metadata as Record<string, unknown> || undefined
      };

      // Add any additional fields from data
      Object.entries(data).forEach(([key, value]) => {
        if (!feedbackItem.hasOwnProperty(key)) {
          (feedbackItem as Record<string, unknown>)[key] = value;
        }
      });

      feedback.push(feedbackItem);
  });

    return feedback;
} catch (error) {
    console.error('Error fetching feedback by category:', error);
    throw error;
}
};

/**
 * Get feedback by source
 * @param source Feedback source
 * @param limitCount Optional limit on number of feedback items to fetch
 * @returns Promise with array of feedback items
 */
export const getFeedbackBySource = async (source: string, limitCount?: number): Promise<Feedback[]> => {
  try {
    const feedbackRef = collection(firestore, 'feedback');
    let feedbackQuery = query(
      feedbackRef,
      where('source', '==', source),
      orderBy('createdAt', 'desc')
    );

    if (limitCount) {
      feedbackQuery = query(feedbackQuery, limit(limitCount));
  }

    const feedbackSnapshot = await getDocs(feedbackQuery);
    const feedback: Feedback[] = [];

    feedbackSnapshot.forEach((doc) => {
      const data = doc.data();
      const feedbackItem: Feedback = {
        id: doc.id,
        category: data.category as string,
        source: data.source as string,
        userId: data.userId as string,
        userName: data.userName as string,
        userEmail: data.userEmail as string || undefined,
        rating: data.rating as number,
        feedback: data.feedback as string,
        status: (data.status as 'new' | 'reviewed' | 'resolved' | 'archived') || 'new',
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt as string),
        metadata: data.metadata as Record<string, unknown> || undefined
      };

      // Add any additional fields from data
      Object.entries(data).forEach(([key, value]) => {
        if (!feedbackItem.hasOwnProperty(key)) {
          (feedbackItem as Record<string, unknown>)[key] = value;
        }
      });

      feedback.push(feedbackItem);
  });

    return feedback;
} catch (error) {
    console.error('Error fetching feedback by source:', error);
    throw error;
}
};

/**
 * Get feedback by user
 * @param userId User ID
 * @param limitCount Optional limit on number of feedback items to fetch
 * @returns Promise with array of feedback items
 */
export const getFeedbackByUser = async (userId: string, limitCount?: number): Promise<Feedback[]> => {
  try {
    const feedbackRef = collection(firestore, 'feedback');
    let feedbackQuery = query(
      feedbackRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (limitCount) {
      feedbackQuery = query(feedbackQuery, limit(limitCount));
  }

    const feedbackSnapshot = await getDocs(feedbackQuery);
    const feedback: Feedback[] = [];

    feedbackSnapshot.forEach((doc) => {
      const data = doc.data();
      const feedbackItem: Feedback = {
        id: doc.id,
        category: data.category as string,
        source: data.source as string,
        userId: data.userId as string,
        userName: data.userName as string,
        userEmail: data.userEmail as string || undefined,
        rating: data.rating as number,
        feedback: data.feedback as string,
        status: (data.status as 'new' | 'reviewed' | 'resolved' | 'archived') || 'new',
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt as string),
        metadata: data.metadata as Record<string, unknown> || undefined
      };

      // Add any additional fields from data
      Object.entries(data).forEach(([key, value]) => {
        if (!feedbackItem.hasOwnProperty(key)) {
          (feedbackItem as Record<string, unknown>)[key] = value;
        }
      });

      feedback.push(feedbackItem);
  });

    return feedback;
} catch (error) {
    console.error('Error fetching feedback by user:', error);
    throw error;
}
};
