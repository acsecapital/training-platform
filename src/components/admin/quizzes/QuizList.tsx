import React, {useState } from 'react';
import Link from 'next/link';
import {formatDate } from '@/utils/date';

interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  moduleId?: string;
  moduleName?: string;
  questionsCount: number;
  passingScore: number;
  timeLimit?: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  attempts: number;
  averageScore?: number;
}

interface QuizListProps {
  quizzes: Quiz[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: Quiz['status']) => void;
}

const QuizList: React.FC<QuizListProps> = ({
  quizzes,
  loading = false,
  onDelete,
  onStatusChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Quiz['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'attempts'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort quizzes
  const filteredQuizzes = quizzes
    .filter((quiz) => {
      // Apply search filter
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quiz.courseName && quiz.courseName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Apply status filter
      const matchesStatus = statusFilter === 'all' || quiz.status === statusFilter;

      return matchesSearch && matchesStatus;
  })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === 'title') {
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
    } else if (sortBy === 'attempts') {
        return sortOrder === 'asc'
          ? a.attempts - b.attempts
          : b.attempts - a.attempts;
    } else {
        // Default sort by createdAt
        return sortOrder === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Toggle sort order
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
      setSortBy(field);
      setSortOrder('desc');
  }
};

  // Render status badge
  const renderStatusBadge = (status: Quiz['status']) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
            Archived
          </span>
        );
      default:
        return null;
  }
};

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-neutral-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-20 bg-neutral-200 rounded"></div>
          ))}
        </div>
      </div>
    );
}

  return (
    <div>
      {/* Filters and search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search quizzes..."
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <select
            className="block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Quiz['status'] | 'all')}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <Link
            href="/admin/quizzes/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create
          </Link>
        </div>
      </div>

      {/* Quiz list */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-neutral-900">No quizzes found</h3>
          <p className="mt-1 text-neutral-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter to find what you\'re looking for.'
              : 'Get started by creating a new quiz.'}
          </p>
          <div className="mt-6">
            <Link
              href="/admin/quizzes/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Quiz
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    <span>Title</span>
                    {sortBy === 'title' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Course
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Questions
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('attempts')}
                >
                  <div className="flex items-center">
                    <span>Attempts</span>
                    {sortBy === 'attempts' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    <span>Created</span>
                    {sortBy === 'createdAt' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredQuizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">
                      <Link href={`/admin/quizzes/${quiz.id}`} className="hover:text-primary">
                        {quiz.title}
                      </Link>
                    </div>
                    <div className="text-sm text-neutral-500 truncate max-w-xs">
                      {quiz.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {quiz.courseName || 'Not assigned'}
                    </div>
                    {quiz.moduleName && (
                      <div className="text-sm text-neutral-500">
                        {quiz.moduleName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {quiz.questionsCount} questions
                    </div>
                    <div className="text-sm text-neutral-500">
                      Pass: {quiz.passingScore}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(quiz.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {quiz.attempts} attempts
                    </div>
                    {quiz.averageScore !== undefined && (
                      <div className="text-sm text-neutral-500">
                        Avg: {quiz.averageScore}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(quiz.createdAt, 'medium')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/quizzes/${quiz.id}/results`}
                        className="text-primary hover:text-primary-700"
                        onClick={() => console.log('Navigating to results for quiz with ID:', quiz.id)}
                      >
                        Results
                      </Link>
                      <Link
                        href={`/admin/quizzes/${quiz.id}/edit`}
                        className="text-primary hover:text-primary-700"
                        onClick={() => console.log('Navigating to edit quiz with ID:', quiz.id)}
                      >
                        Edit
                      </Link>
                      {onStatusChange && (
                        <button
                          onClick={() => {
                            const newStatus = quiz.status === 'published' ? 'archived' : 'published';
                            onStatusChange(quiz.id, newStatus);
                        }}
                          className="text-primary hover:text-primary-700"
                        >
                          {quiz.status === 'published' ? 'Archive' : 'Publish'}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this quiz?')) {
                              onDelete(quiz.id);
                          }
                        }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuizList;
