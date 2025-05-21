import React, {useState, useEffect } from 'react';
import {
  getCoursesForEnrollment,
  enrollTeamInCourses
} from '@/services/courseService';
import {getUsers } from '@/services/userService';
import {getCompanies, getCompanyTeams } from '@/services/companyService';
import {addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Plus,
  Upload,
  Download,
  AlertTriangle
} from 'lucide-react';
import {toast } from 'sonner';
import Button from '@/components/ui/Button';

interface BulkEnrollmentToolProps {
  onEnrollmentComplete?: () => void;
}

interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
}

interface Company {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  companyId: string;
  memberIds: string[]; // Add memberIds to the Team interface
}

const BulkEnrollmentTool: React.FC<BulkEnrollmentToolProps> = ({
  onEnrollmentComplete
}) => {
  // State for data
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // State for selections
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [enrollmentStep, setEnrollmentStep] = useState<'select' | 'review' | 'complete'>('select');

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
}, []);

  // Fetch teams when company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchTeams(selectedCompany);
  } else {
      setTeams([]);
      setSelectedTeam('');
  }
}, [selectedCompany]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch courses using the new function that doesn't rely on publishedAt
      const publishedCourses = await getCoursesForEnrollment(100);
      setCourses(publishedCourses);

      // Fetch users
      const usersList = await getUsers();
      // Map UserProfile to User type to ensure compatibility
      const mappedUsers = usersList.map(user => ({
        uid: user.uid,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName
    }));
      setUsers(mappedUsers);

      // Fetch companies
      const companiesList = await getCompanies();
      setCompanies(companiesList);
  } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const fetchTeams = async (companyId: string) => {
    try {
      const teamsList = await getCompanyTeams(companyId);
      setTeams(teamsList);
  } catch (err) {
      console.error('Error fetching teams:', err);
      toast.error('Failed to load teams');
  }
};

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
    } else {
        return [...prev, userId];
    }
  });
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

  const handleSelectAll = (type: 'users' | 'courses') => {
    if (type === 'users') {
      const filteredUsers = users
        .filter(user =>
          user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          (user.firstName + ' ' + user.lastName).toLowerCase().includes(userSearchTerm.toLowerCase())
        )
        .map(user => user.uid);

      setSelectedUsers(filteredUsers);
  } else {
      const filteredCourses = courses
        .filter(course =>
          course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(courseSearchTerm.toLowerCase())
        )
        .map(course => course.id);

      setSelectedCourses(filteredCourses);
  }
};

  const handleClearAll = (type: 'users' | 'courses') => {
    if (type === 'users') {
      setSelectedUsers([]);
  } else {
      setSelectedCourses([]);
  }
};

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
};

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
};

  const handleReview = () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
  }

    if (selectedUsers.length === 0 && !selectedTeam) {
      toast.error('Please select users or a team');
      return;
  }

    setEnrollmentStep('review');
};

  const handleBack = () => {
    setEnrollmentStep('select');
};

  const handleEnroll = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
  }

    if (selectedUsers.length === 0 && !selectedTeam) {
      toast.error('Please select users or a team');
      return;
  }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // If a team is selected, use the team enrollment function
      if (selectedTeam) {
        // Get team members - using memberIds from the Team interface
        // The Team interface has memberIds, not members
        const team = teams.find(team => team.id === selectedTeam);
        const teamMemberIds = team?.memberIds || [];

        // Enroll team members in courses
        const result = await enrollTeamInCourses(
          selectedCompany,
          selectedTeam,
          selectedCourses,
          teamMemberIds // Pass memberIds instead of members
        );

        if (result.success) {
          setSuccess(`Successfully enrolled ${result.enrolledUsers} team members in ${result.enrolledCourses} courses.`);
      } else {
          // Show error message
          if (result.errors.length > 0) {
            setError(`Enrollment failed: ${result.errors.join(', ')}`);
        } else {
            setError('Failed to enroll team. Please try again.');
        }

          // If some enrollments were successful, show partial success message
          if (result.enrolledUsers > 0) {
            setSuccess(`Partially successful: Enrolled ${result.enrolledUsers} team members in ${result.enrolledCourses} courses.`);
        }
      }
    } else {
        // Enroll individual users in courses
        let successCount = 0;
        let errorCount = 0;

        // Get course details for enrollment records
        const courseDetails = courses.reduce((acc, course) => {
          if (selectedCourses.includes(course.id)) {
            acc[course.id] = course;
        }
          return acc;
      }, {} as Record<string, Course>);

        // Create enrollments for each user and course
        for (const userId of selectedUsers) {
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
                  method: 'bulk_enrollment',
                  timestamp: serverTimestamp()
              }
            });

              successCount++;
          } catch (err) {
              console.error(`Error enrolling user ${userId} in course ${courseId}:`, err);
              errorCount++;
          }
        }
      }

        // Show success/error messages
        if (successCount > 0) {
          setSuccess(`Successfully created ${successCount} enrollments.`);
      }

        if (errorCount > 0) {
          setError(`Failed to create ${errorCount} enrollments. Check console for details.`);
      }
    }

      // Move to completion step
      setEnrollmentStep('complete');
  } catch (err) {
      console.error('Error during bulk enrollment:', err);
      setError('An unexpected error occurred during enrollment. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleDownloadTemplate = () => {
    // This will be implemented in a future step
    toast.info('CSV template download will be implemented in a future step');
};

  const handleUploadCSV = () => {
    // This will be implemented in a future step
    toast.info('CSV upload will be implemented in a future step');
};

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (user.firstName + ' ' + user.lastName).toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  // Get selected user and course details for review
  const selectedUserDetails = users.filter(user => selectedUsers.includes(user.uid));
  const selectedCourseDetails = courses.filter(course => selectedCourses.includes(course.id));
  const selectedTeamDetails = teams.find(team => team.id === selectedTeam);
  const selectedCompanyDetails = companies.find(company => company.id === selectedCompany);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">Bulk Enrollment Tool</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Enroll multiple users in courses at once.
          </p>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
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
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
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

        <div className="p-6">
          {enrollmentStep === 'select' && (
            <div className="space-y-6">
              {/* CSV Upload/Download Section */}
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">CSV Import/Export</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUploadCSV}
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload CSV
                  </Button>
                </div>
              </div>

              {/* Company and Team Selection */}
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Select Company and Team (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-1">
                      Company
                    </label>
                    <select
                      id="company"
                      className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={selectedCompany}
                      onChange={handleCompanyChange}
                    >
                      <option value="">Select a company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="team" className="block text-sm font-medium text-neutral-700 mb-1">
                      Team
                    </label>
                    <select
                      id="team"
                      className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={selectedTeam}
                      onChange={handleTeamChange}
                      disabled={!selectedCompany || teams.length === 0}
                    >
                      <option value="">Select a team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    {selectedCompany && teams.length === 0 && (
                      <p className="mt-1 text-xs text-neutral-500">
                        No teams found for this company
                      </p>
                    )}
                  </div>
                </div>

                {selectedTeam && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                      <AlertTriangle className="inline-block h-4 w-4 mr-1.5" />
                      When a team is selected, all team members will be enrolled regardless of individual user selection.
                    </p>
                  </div>
                )}
              </div>

              {/* Course Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-neutral-700">Select Courses</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSelectAll('courses')}
                      className="text-xs text-primary-600 hover:text-primary-900"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleClearAll('courses')}
                      className="text-xs text-neutral-600 hover:text-neutral-900"
                    >
                      Clear All
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

              {/* User Selection (only shown if no team is selected) */}
              {!selectedTeam && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-neutral-700">Select Users</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectAll('users')}
                        className="text-xs text-primary-600 hover:text-primary-900"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleClearAll('users')}
                        className="text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
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
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Email
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-neutral-500">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr
                              key={user.uid}
                              className={`hover:bg-neutral-50 cursor-pointer ${
                                selectedUsers.includes(user.uid) ? 'bg-primary-50' : ''
                            }`}
                              onClick={() => handleUserSelection(user.uid)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                                  checked={selectedUsers.includes(user.uid)}
                                  onChange={() => handleUserSelection(user.uid)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-neutral-900">
                                  {user.firstName} {user.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                {user.email}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 text-sm text-neutral-500">
                    {selectedUsers.length} user(s) selected
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleReview}
                  disabled={loading || (selectedCourses.length === 0 || (selectedUsers.length === 0 && !selectedTeam))}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Review Enrollments
                </Button>
              </div>
            </div>
          )}

          {enrollmentStep === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-neutral-900">Review Enrollments</h3>

              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Enrollment Summary</h4>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium">Courses:</span> {selectedCourseDetails.length} selected
                  </p>
                  {selectedTeam ? (
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Team:</span> {selectedTeamDetails?.name} ({selectedCompanyDetails?.name})
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Users:</span> {selectedUserDetails.length} selected
                    </p>
                  )}
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium">Total Enrollments:</span> {selectedCourseDetails.length * (selectedTeam ? 0 : selectedUserDetails.length)}
                    {selectedTeam && ' (Team member count will be determined during enrollment)'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-neutral-700">Selected Courses</h4>
                <div className="overflow-hidden border border-neutral-200 rounded-md max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {selectedCourseDetails.map((course) => (
                        <tr key={course.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {course.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {course.level}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!selectedTeam && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-neutral-700">Selected Users</h4>
                  <div className="overflow-hidden border border-neutral-200 rounded-md max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50 sticky top-0">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Email
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {selectedUserDetails.map((user) => (
                          <tr key={user.uid}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-neutral-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                              {user.email}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEnroll}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirm Enrollments
                </Button>
              </div>
            </div>
          )}

          {enrollmentStep === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900">Enrollment Complete</h3>
              <p className="text-sm text-neutral-500">
                The selected users have been successfully enrolled in the courses.
              </p>
              <div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setEnrollmentStep('select');
                    setSelectedUsers([]);
                    setSelectedCourses([]);
                    setSelectedCompany('');
                    setSelectedTeam('');
                    setSuccess(null);
                    setError(null);
                    if (onEnrollmentComplete) {
                      onEnrollmentComplete();
                  }
                }}
                >
                  Start New Enrollment
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkEnrollmentTool;


