import React from 'react';

interface LearningStatsProps {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLessons: number;
  completedLessons: number;
}

const LearningStats: React.FC<LearningStatsProps> = ({
  totalCourses,
  completedCourses,
  inProgressCourses,
  totalLessons,
  completedLessons,
}) => {
  // Calculate completion percentage
  const completionPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;
    
  // Calculate completion rate
  const completionRate = `${completionPercentage}%`;
    
  // Calculate average progress
  const averageProgress = totalCourses > 0 
    ? Math.round((completedCourses / totalCourses) * 100) 
    : 0;
  
  // Calculate time spent in minutes (placeholder - would come from progress data)
  const totalMinutesSpent = Math.floor((totalLessons * 5) * (completionPercentage / 100));
  const hours = Math.floor(totalMinutesSpent / 60);
  const minutes = totalMinutesSpent % 60;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6">Learning Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Courses */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Courses</p>
          <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
        </div>
        
        {/* Completed Courses */}
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
        </div>
        
        {/* In Progress */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-600 font-medium">In Progress</p>
          <p className="text-2xl font-bold text-gray-900">{inProgressCourses}</p>
        </div>
        
        {/* Total Time Spent */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Time Spent</p>
          <p className="text-2xl font-bold text-gray-900">
            {hours > 0 ? `${hours}h ` : ''}{minutes}m
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-700">Overall Progress</p>
          <p className="text-sm font-medium text-gray-700">{completionRate}</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: completionRate }}
          />
        </div>
        
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-neutral-900">{completedCourses}</span>
          <span className="ml-2 text-sm text-neutral-500">certificates earned</span>
        </div>
        <p className="text-sm text-neutral-600 mt-2">
          {completedCourses > 0 ? 'View your certificates' : 'Complete courses to earn certificates'}
        </p>
      </div>
    </div>
  );
};

export default LearningStats;
