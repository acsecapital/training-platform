import React, {useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ClientSideChart from '@/components/charts/ClientSideChart';
import * as feedbackService from '@/services/feedbackService';
import * as reviewService from '@/services/reviewService';

export default function FeedbackAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const [reviewData, setReviewData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    categoryDistribution: [] as any[],
    sourceDistribution: [] as any[],
    ratingDistribution: [] as any[],
    feedbackOverTime: [] as any[],
    averageRating: 0,
    totalFeedback: 0,
    totalReviews: 0
});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allFeedback, allReviews] = await Promise.all([
          feedbackService.getAllFeedback(),
          reviewService.getCourseReviews('', 100)
        ]);

        setFeedbackData(allFeedback);
        setReviewData(allReviews);
        processAnalytics(allFeedback, allReviews);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        setIsLoading(false);
    }
  };

    fetchData();
}, []);

  const processAnalytics = (feedback: any[], reviews: any[]) => {
    // Category distribution
    const categoryMap: Record<string, number> = {};
    feedback.forEach(item => {
      categoryMap[item.category] = (categoryMap[item.category] || 0) + 1;
  });

    const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
  }));

    // Source distribution
    const sourceMap: Record<string, number> = {};
    feedback.forEach(item => {
      sourceMap[item.source] = (sourceMap[item.source] || 0) + 1;
  });

    const sourceDistribution = Object.entries(sourceMap).map(([name, value]) => ({
      name,
      value
  }));

    // Rating distribution
    const ratingMap: Record<string, number> = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    feedback.forEach(item => {
      if (item.rating) {
        ratingMap[item.rating.toString()] = (ratingMap[item.rating.toString()] || 0) + 1;
    }
  });
    reviews.forEach(item => {
      ratingMap[item.rating.toString()] = (ratingMap[item.rating.toString()] || 0) + 1;
  });

    const ratingDistribution = Object.entries(ratingMap).map(([rating, count]) => ({
      rating: parseInt(rating),
      count
  }));

    // Feedback over time
    const timeMap: Record<string, number> = {};
    const allItems = [...feedback, ...reviews];
    allItems.forEach(item => {
      const date = item.createdAt ? new Date(item.createdAt) : new Date(item.date);
      const month = date.toLocaleString('default', {month: 'short', year: 'numeric'});
      timeMap[month] = (timeMap[month] || 0) + 1;
  });

    // Sort by date
    const feedbackOverTime = Object.entries(timeMap)
      .map(([date, count]) => ({date, count }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
    });

    // Calculate average rating
    let totalRating = 0;
    let ratingCount = 0;

    feedback.forEach(item => {
      if (item.rating) {
        totalRating += item.rating;
        ratingCount++;
    }
  });

    reviews.forEach(item => {
      totalRating += item.rating;
      ratingCount++;
  });

    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

    setAnalytics({
      categoryDistribution,
      sourceDistribution,
      ratingDistribution,
      feedbackOverTime,
      averageRating: parseFloat(averageRating.toString()),
      totalFeedback: feedback.length,
      totalReviews: reviews.length
  });
};

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <AdminLayout title="Feedback Analytics">
      <div className="container-custom mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Feedback Analytics</h1>
          <p className="text-neutral-500">Insights from user feedback and reviews</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-neutral-500 text-sm font-medium mb-1">Total Feedback</h3>
                <p className="text-3xl font-bold text-neutral-800">{analytics.totalFeedback}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-neutral-500 text-sm font-medium mb-1">Total Reviews</h3>
                <p className="text-3xl font-bold text-neutral-800">{analytics.totalReviews}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-neutral-500 text-sm font-medium mb-1">Average Rating</h3>
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-neutral-800 mr-2">{analytics.averageRating}</p>
                  <div className="text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Feedback Over Time */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-4">Feedback Over Time</h3>
                <div className="h-80">
                  <ClientSideChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.feedbackOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ClientSideChart>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-4">Rating Distribution</h3>
                <div className="h-80">
                  <ClientSideChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.ratingDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="rating" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ClientSideChart>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-4">Feedback by Category</h3>
                <div className="h-80">
                  <ClientSideChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.categoryDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ClientSideChart>
                </div>
              </div>

              {/* Source Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-4">Feedback by Source</h3>
                <div className="h-80">
                  <ClientSideChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.sourceDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.sourceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ClientSideChart>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}