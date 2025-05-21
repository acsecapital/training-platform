import React, {useState, useEffect } from 'react';
import {doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import * as feedbackService from '@/services/feedbackService';
import {useScrollPosition } from '@/hooks/useScrollPosition';
import FeedbackButton from '@/components/feedback/FeedbackButton';

// Feedback status options
const statusOptions = [
  {value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800'},
  {value: 'reviewed', label: 'Reviewed', color: 'bg-yellow-100 text-yellow-800'},
  {value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800'},
  {value: 'archived', label: 'Archived', color: 'bg-neutral-100 text-neutral-800'},
];

// Feedback category options
const categoryOptions = [
  {value: 'general', label: 'General Feedback'},
  {value: 'bug', label: 'Bug Report'},
  {value: 'feature', label: 'Feature Request'},
  {value: 'content', label: 'Content Feedback'},
  {value: 'usability', label: 'Usability Feedback'},
];

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const scrollPosition = useScrollPosition();
  const [showFeedback, setShowFeedback] = useState(false);

  // Update feedback button visibility based on total scrollable content
  useEffect(() => {
    // Calculate 66% threshold of the total scrollable content height
    // This shows the button when user scrolls past 66% of the total scrollable content
    const scrollThreshold = (document.documentElement.scrollHeight - window.innerHeight) * 0.66;

    // Show button when user has scrolled past the threshold
    const shouldShowFeedback = scrollPosition.y > scrollThreshold;
    setShowFeedback(shouldShowFeedback);
}, [scrollPosition]);

  // Fetch feedback when the component mounts
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        const allFeedback = await feedbackService.getAllFeedback();
        setFeedback(allFeedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
    } finally {
        setIsLoading(false);
    }
  };

    fetchFeedback();
 }, []);


   // Keep only one effect for scroll position updates


   // Removed duplicate effect

  // Filter feedback based on active category and status
  const filteredFeedback = feedback.filter(item => {
    if (activeCategory && item.category !== activeCategory) {
      return false;
  }

    if (activeStatus && item.status !== activeStatus) {
      return false;
  }

    return true;
});

  // Handle updating feedback status
  const handleUpdateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const feedbackRef = doc(firestore, 'feedback', feedbackId);
      await updateDoc(feedbackRef, {
        status: newStatus,
    });

      // Update local state
      setFeedback(prev =>
        prev.map(item =>
          item.id === feedbackId
            ? {...item, status: newStatus }
            : item
        )
      );

      // Update selected feedback if it's the one being updated
      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setSelectedFeedback({...selectedFeedback, status: newStatus });
    }
  } catch (error) {
      console.error('Error updating feedback status:', error);
  }
};

  // Handle deleting feedback
  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return;
  }

    try {
      const feedbackRef = doc(firestore, 'feedback', feedbackId);
      await deleteDoc(feedbackRef);

      // Update local state
      setFeedback(prev => prev.filter(item => item.id !== feedbackId));

      // Clear selected feedback if it's the one being deleted
      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setSelectedFeedback(null);
    }
  } catch (error) {
      console.error('Error deleting feedback:', error);
  }
};

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
  });
};

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status) || statusOptions[0];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusOption.color}`}>
        {statusOption.label}
      </span>
    );
};

  // Get category label
  const getCategoryLabel = (category: string) => {
    const categoryOption = categoryOptions.find(option => option.value === category);
    return categoryOption ? categoryOption.label : category;
};

  return (
    <AdminLayout title="Feedback Management">
      <div className="container-custom mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Manage details and view user feedback</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters and Feedback List */}
          <div className="w-full lg:w-1/3">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-medium mb-4">Filters</h2>

              {/* Category Filter */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Category</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-1 text-xs rounded-full ${
                      activeCategory === null
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                    onClick={() => setActiveCategory(null)}
                  >
                    All
                  </button>
                  {categoryOptions.map(category => (
                    <button
                      key={category.value}
                      className={`px-3 py-1 text-xs rounded-full ${
                        activeCategory === category.value
                          ? 'bg-primary text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                      onClick={() => setActiveCategory(category.value)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Status</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-1 text-xs rounded-full ${
                      activeStatus === null
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                    onClick={() => setActiveStatus(null)}
                  >
                    All
                  </button>
                  {statusOptions.map(status => (
                    <button
                      key={status.value}
                      className={`px-3 py-1 text-xs rounded-full ${
                        activeStatus === status.value
                          ? 'bg-primary text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                      onClick={() => setActiveStatus(status.value)}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <h2 className="text-lg font-medium">Feedback List</h2>
                <p className="text-sm text-neutral-500">
                  {filteredFeedback.length} {filteredFeedback.length === 1 ? 'item' : 'items'} found
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredFeedback.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-neutral-500">No feedback found matching your filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 max-h-[600px] overflow-y-auto">
                  {filteredFeedback.map(item => (
                    <button
                      key={item.id}
                      className={`w-full text-left p-4 hover:bg-neutral-50 transition-colors ${
                        selectedFeedback && selectedFeedback.id === item.id ? 'bg-neutral-100' : ''
                    }`}
                      onClick={() => setSelectedFeedback(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium truncate">{item.userName}</div>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="text-sm text-neutral-500 mb-2">
                        {getCategoryLabel(item.category)} • {formatDate(item.createdAt)}
                      </div>
                      <div className="text-sm truncate">{item.feedback.substring(0, 100)}{item.feedback.length > 100 ? '...' : ''}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Detail */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg shadow-sm h-full">
              {selectedFeedback ? (
                <div className="h-full flex flex-col">
                  <div className="p-6 border-b border-neutral-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-medium mb-1">{getCategoryLabel(selectedFeedback.category)}</h2>
                        <div className="text-sm text-neutral-500">
                          Submitted by {selectedFeedback.userName} on {formatDate(selectedFeedback.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(selectedFeedback.status)}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 overflow-auto">
                    {/* Rating */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-neutral-700 mb-2">Rating</h3>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-6 w-6 ${
                              star <= selectedFeedback.rating ? 'text-yellow-400' : 'text-neutral-300'
                          }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Content */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-neutral-700 mb-2">Feedback</h3>
                      <div className="bg-neutral-50 p-4 rounded-lg whitespace-pre-wrap">
                        {selectedFeedback.feedback}
                      </div>
                    </div>

                    {/* Source Information */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-neutral-700 mb-2">Source</h3>
                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <p className="text-sm">{selectedFeedback.source}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    {selectedFeedback.metadata && Object.keys(selectedFeedback.metadata).length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-700 mb-2">Additional Information</h3>
                        <div className="bg-neutral-50 p-4 rounded-lg">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(selectedFeedback.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-neutral-200">
                    <div className="flex justify-between">
                      <div className="flex space-x-2">
                        {statusOptions.map(status => (
                          <Button
                            key={status.value}
                            variant={selectedFeedback.status === status.value ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleUpdateStatus(selectedFeedback.id, status.value)}
                            disabled={selectedFeedback.status === status.value}
                          >
                            {status.label}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-12 text-center">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">No Feedback Selected</h3>
                    <p className="text-neutral-500 max-w-md">
                      Select a feedback item from the list to view its details.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    {/* Only show feedback button when scrolled past 66% of the total scrollable content */}
    {showFeedback && <FeedbackButton source="admin_feedback_page" />}
  </AdminLayout>
);
}
