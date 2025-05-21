import React, {useState, useEffect } from 'react';
import {getCoursesForEnrollment } from '@/services/courseService';
import {addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Course as CourseType } from '@/types/course.types'; // Rename to avoid confusion
import {UserProfile } from '@/types/user.types';
import {getUserById } from '@/services/userService';
import {Search, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import {toast } from 'sonner';

interface UserEnrollmentManagerProps {
  userId: string;
}

const UserEnrollmentManager: React.FC<UserEnrollmentManagerProps> = ({userId }) => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchData();
}, [userId]);

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      // Fetch courses
      const coursesData = await getCoursesForEnrollment(100);
      
      // Map service courses to CourseType
      const mappedCourses: CourseType[] = coursesData.map(course => {
        // Convert level to proper CourseLevel format
        let courseLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
        if (course.level === 'intermediate') {
          courseLevel = 'Intermediate';
      } else if (course.level === 'advanced') {
          courseLevel = 'Advanced';
      }
        
        // Convert status to acceptable values for CourseType
        let courseStatus: 'draft' | 'published' = 'draft';
        if (course.status === 'published') {
          courseStatus = 'published';
      }
        // Note: 'archived' status will be mapped to 'draft'
        
        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          thumbnail: course.thumbnail || '',
          // Convert duration to string if it's a number
          duration: typeof course.duration === 'number' 
            ? course.duration.toString() 
            : (course.duration || ''),
          level: courseLevel, // Use the converted level
          status: courseStatus, // Use the converted status
          instructor: course.instructorId || '', // Use instructorId instead of instructor
          lastUpdated: course.updatedAt || new Date().toISOString(),
          // Add any other required properties from CourseType
          modulesList: course.modulesList || [],
          createdAt: course.createdAt || new Date().toISOString(),
          updatedAt: course.updatedAt || new Date().toISOString(),
      };
    });
      
      setCourses(mappedCourses);

      // Fetch user
      const userData = await getUserById(userId);
      setUser(userData);
  } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
  } finally {
      setInitialLoading(false);
  }
};

  const handleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
    } else {
        return [...prev, courseId];
    }
  });
};

  const handleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
  } else {
      setSelectedCourses(filteredCourses.map(course => course.id));
  }
};

  const handleClearAll = () => {
    setSelectedCourses([]);
};

  const handleEnroll = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
  }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Get course details for enrollment records
      const courseDetails = courses.reduce((acc, course) => {
        if (selectedCourses.includes(course.id)) {
          acc[course.id] = course;
      }
        return acc;
    }, {} as Record<string, CourseType>);

      // Create enrollments for each course
      for (const courseId of selectedCourses) {
        try {
          // Check if course exists
          const course = courseDetails[courseId];
          if (!course) {
            console.error(`Course ${courseId} not found`);
            errorCount++;
            continue;
        }

          // Create enrollment record
          await addDoc(collection(firestore, `users/${userId}/enrollments`), {
            courseId,
            courseName: course.title,
            enrolledAt: serverTimestamp(),
            progress: 0,
            completedLessons: [],
            lastAccessedAt: serverTimestamp(),
            status: 'active',
            enrolledBy: {
              method: 'admin_enrollment',
              timestamp: serverTimestamp()
          }
        });

          successCount++;
      } catch (err) {
          console.error(`Error enrolling user in course ${courseId}:`, err);
          errorCount++;
      }
    }

      // Show success/error messages
      if (successCount > 0) {
        setSuccess(`Successfully enrolled user in ${successCount} course(s).`);
        toast.success(`Successfully enrolled user in ${successCount} course(s).`);
        setSelectedCourses([]);
    }

      if (errorCount > 0) {
        setError(`Failed to enroll in ${errorCount} course(s). Check console for details.`);
        toast.error(`Failed to enroll in ${errorCount} course(s).`);
    }
  } catch (err) {
      console.error('Error during enrollment:', err);
      setError('An unexpected error occurred during enrollment. Please try again.');
      toast.error('An unexpected error occurred during enrollment.');
  } finally {
      setLoading(false);
  }
};

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(courseSearchTerm.toLowerCase()))
  );

  if (initialLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg leading-6 font-medium text-neutral-900">Course Enrollment</h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Enroll this user in courses
          </p>
        </div>
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg leading-6 font-medium text-neutral-900">Course Enrollment</h3>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Enroll {user?.displayName || user?.email || 'this user'} in courses
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="px-4 py-3 bg-green-50 border-b border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-neutral-700">Select Courses</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-primary-600 hover:text-primary-900"
              >
                {selectedCourses.length === filteredCourses.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs text-neutral-600 hover:text-neutral-900"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={courseSearchTerm}
              onChange={(e) => setCourseSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-hidden border border-neutral-200 rounded-md max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-neutral-500">
                      No courses found
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className={`hover:bg-neutral-50 cursor-pointer ${
                        selectedCourses.includes(course.id) ? 'bg-primary-50' : ''
                    }`}
                      onClick={() => handleCourseSelection(course.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => handleCourseSelection(course.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {course.title}
                        </div>
                        <div className="text-sm text-neutral-500 truncate max-w-xs">
                          {course.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {course.level}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-sm text-neutral-500">
            {selectedCourses.length} course(s) selected
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleEnroll}
            disabled={loading || selectedCourses.length === 0}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Enroll User
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserEnrollmentManager;



