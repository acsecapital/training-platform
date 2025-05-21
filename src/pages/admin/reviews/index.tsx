import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {CourseReview } from '@/types/course.types';
import * as reviewService from '@/services/reviewService';

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [reportedReviews, setReportedReviews] = useState<CourseReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'reported'>('all');
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});

  // Fetch reviews when the component mounts
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);

        // Fetch all reviews
        const allReviews = await reviewService.getCourseReviews('', 100); // Empty string to get all reviews
        setReviews(allReviews);

        // Fetch reported reviews
        const reported = await reviewService.getReportedReviews();
        setReportedReviews(reported);

        // Fetch course names
        // Create an array of unique course IDs
        const courseIdsMap: Record<string, boolean> = {};
        [...allReviews, ...reported].forEach(review => {
          courseIdsMap[review.courseId] = true;
      });
        const courseIds = Object.keys(courseIdsMap);
        const courseNamesMap: Record<string, string> = {};

        for (const courseId of courseIds) {
          try {
            const courseDoc = doc(firestore, 'courses', courseId);
            const courseSnapshot = await getDoc(courseDoc);
            const courseData = courseSnapshot.data();

            if (courseData) {
              courseNamesMap[courseId] = courseData.title || 'Unknown Course';
          } else {
              courseNamesMap[courseId] = 'Unknown Course';
          }
        } catch (error) {
            console.error(`Error fetching course ${courseId}:`, error);
            courseNamesMap[courseId] = 'Unknown Course';
        }
      }

        setCourseNames(courseNamesMap);
    } catch (error) {
        console.error('Error fetching reviews:', error);
    } finally {
        setIsLoading(false);
    }
  };

    fetchReviews();
}, []);

  // Handle approving a reported review
  const handleApproveReview = async (reviewId: string) => {
    try {
      const reviewRef = doc(firestore, 'courseReviews', reviewId);
      await updateDoc(reviewRef, {
        reported: false,
    });

      // Update local state
      setReportedReviews(prev => prev.filter(review => review.id !== reviewId));
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? {...review, reported: false }
            : review
        )
      );
  } catch (error) {
      console.error('Error approving review:', error);
  }
};

  // Handle deleting a review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
  }

    try {
      const reviewRef = doc(firestore, 'courseReviews', reviewId);
      await deleteDoc(reviewRef);

      // Update local state
      setReportedReviews(prev => prev.filter(review => review.id !== reviewId));
      setReviews(prev => prev.filter(review => review.id !== reviewId));
  } catch (error) {
      console.error('Error deleting review:', error);
  }
};

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });
};

  // Get displayed reviews based on active tab
  const displayedReviews = activeTab === 'all' ? reviews : reportedReviews;

  return (
    <AdminLayout title="Review Management">
      <div className="container-custom mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Monitor and Sort course reviews</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-6">
          <div className="flex">
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-neutral-600 hover:text-neutral-900'
            }`}
              onClick={() => setActiveTab('all')}
            >
              All Reviews
              <span className="ml-2 bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full text-xs">
                {reviews.length}
              </span>
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'reported'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-neutral-600 hover:text-neutral-900'
            }`}
              onClick={() => setActiveTab('reported')}
            >
              Reported Reviews
              <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                {reportedReviews.length}
              </span>
            </button>
          </div>
        </div>

        {/* Reviews Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-neutral-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-neutral-600 mb-2">No reviews found</p>
            <p className="text-sm text-neutral-500">
              {activeTab === 'reported'
                ? 'There are no reported reviews at this time.'
                : 'There are no reviews in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {displayedReviews.map((review) => (
                  <tr key={review.id} className={review.reported ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                          {review.userAvatar ? (
                            <img
                              src={review.userAvatar}
                              alt={review.userName}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-neutral-600 font-medium">
                              {review.userName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900">
                            {review.userName}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {review.userId.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">
                        {courseNames[review.courseId] || 'Unknown Course'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        ID: {review.courseId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-neutral-300'
                          }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900 max-w-xs truncate">
                        {review.comment}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatDate(review.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.reported ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Reported
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/courses/${review.courseId}`)}
                          className="text-primary hover:text-primary-dark"
                        >
                          View Course
                        </button>
                        {review.reported && (
                          <button
                            onClick={() => handleApproveReview(review.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
