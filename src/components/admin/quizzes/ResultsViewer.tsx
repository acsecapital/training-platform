import React, {useState } from 'react';
import {formatDate } from '@/utils/date';

interface QuizResult {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  quizId: string;
  quizTitle: string;
  score: number;
  passingScore: number;
  passed: boolean;
  timeSpent: number; // in seconds
  startedAt: string;
  completedAt: string;
  answers: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    earnedPoints: number;
}[];
}

interface ResultsViewerProps {
  quizId: string;
  quizTitle: string;
  results: QuizResult[];
  loading?: boolean;
  onExport?: () => void;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({
  quizId,
  quizTitle,
  results,
  loading = false,
  onExport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'completedAt' | 'score' | 'timeSpent' | 'userName'>('completedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  
  // Filter and sort results
  const filteredResults = results
    .filter(result => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        result.userName.toLowerCase().includes(searchLower) ||
        result.userEmail.toLowerCase().includes(searchLower)
      );
  })
    .sort((a, b) => {
      const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
      
      if (sortBy === 'completedAt') {
        return sortMultiplier * (new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    } else if (sortBy === 'score') {
        return sortMultiplier * (a.score - b.score);
    } else if (sortBy === 'timeSpent') {
        return sortMultiplier * (a.timeSpent - b.timeSpent);
    } else {
        return sortMultiplier * a.userName.localeCompare(b.userName);
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
  
  // Format time spent
  const formatTimeSpent = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
  } else if (remainingSeconds === 0) {
      return `${minutes}m`;
  } else {
      return `${minutes}m ${remainingSeconds}s`;
  }
};
  
  // Calculate statistics
  const calculateStats = () => {
    if (results.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTimeSpent: 0,
    };
  }
    
    const totalAttempts = results.length;
    const averageScore = results.reduce((sum, result) => sum + result.score, 0) / totalAttempts;
    const passedCount = results.filter(result => result.passed).length;
    const passRate = (passedCount / totalAttempts) * 100;
    const averageTimeSpent = results.reduce((sum, result) => sum + result.timeSpent, 0) / totalAttempts;
    
    return {
      totalAttempts,
      averageScore,
      passRate,
      averageTimeSpent,
  };
};
  
  const stats = calculateStats();
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-neutral-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 bg-neutral-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-neutral-200 rounded"></div>
      </div>
    );
}
  
  return (
    <div>
      {/* Quiz Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">{quizTitle}</h2>
        <p className="text-sm text-neutral-500">Quiz ID: {quizId}</p>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium text-neutral-500">Total Attempts</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{stats.totalAttempts}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium text-neutral-500">Average Score</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{stats.averageScore.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium text-neutral-500">Pass Rate</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{stats.passRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium text-neutral-500">Average Time</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{formatTimeSpent(Math.round(stats.averageTimeSpent))}</p>
        </div>
      </div>
      
      {/* Search and Export */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="w-full md:w-auto flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Results
          </button>
        )}
      </div>
      
      {/* Results Table */}
      {filteredResults.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-neutral-900">No results found</h3>
          <p className="mt-1 text-neutral-500">
            {searchTerm
              ? 'Try adjusting your search to find what you\'re looking for.'
              : 'No one has taken this quiz yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('userName')}
                  >
                    <div className="flex items-center">
                      <span>User</span>
                      {sortBy === 'userName' && (
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
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center">
                      <span>Score</span>
                      {sortBy === 'score' && (
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
                    onClick={() => handleSort('timeSpent')}
                  >
                    <div className="flex items-center">
                      <span>Time Spent</span>
                      {sortBy === 'timeSpent' && (
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
                    onClick={() => handleSort('completedAt')}
                  >
                    <div className="flex items-center">
                      <span>Completed</span>
                      {sortBy === 'completedAt' && (
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
                    Status
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
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{result.userName}</div>
                      <div className="text-sm text-neutral-500">{result.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{result.score}%</div>
                      <div className="text-sm text-neutral-500">Passing: {result.passingScore}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{formatTimeSpent(result.timeSpent)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{formatDate(result.completedAt, 'medium')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.passed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => setSelectedResult(result)}
                        className="text-primary hover:text-primary-700"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Result Details Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-neutral-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-neutral-900 mb-4">
                      Quiz Result Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm font-medium text-neutral-500">User</p>
                        <p className="mt-1 text-sm text-neutral-900">{selectedResult.userName}</p>
                        <p className="text-sm text-neutral-500">{selectedResult.userEmail}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Quiz</p>
                        <p className="mt-1 text-sm text-neutral-900">{selectedResult.quizTitle}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Score</p>
                        <p className="mt-1 text-sm text-neutral-900">
                          {selectedResult.score}% ({selectedResult.passed ? 'Passed' : 'Failed'})
                        </p>
                        <p className="text-sm text-neutral-500">Passing: {selectedResult.passingScore}%</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Time</p>
                        <p className="mt-1 text-sm text-neutral-900">{formatTimeSpent(selectedResult.timeSpent)}</p>
                        <p className="text-sm text-neutral-500">
                          Completed: {formatDate(selectedResult.completedAt, 'medium')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-neutral-900 mb-2">Answers</h4>
                      
                      <div className="border border-neutral-200 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-neutral-200">
                          <thead className="bg-neutral-50">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Question
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                User Answer
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Correct Answer
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Points
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-200">
                            {selectedResult.answers.map((answer, index) => (
                              <tr key={index} className={answer.isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                                <td className="px-4 py-3 text-sm text-neutral-900">
                                  {answer.questionText}
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-900">
                                  {answer.userAnswer}
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-900">
                                  {answer.correctAnswer}
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-900">
                                  {answer.earnedPoints}/{answer.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setSelectedResult(null)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsViewer;
