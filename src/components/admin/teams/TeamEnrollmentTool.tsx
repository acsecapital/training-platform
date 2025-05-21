import React, {useState, useEffect } from 'react';
import {Team, Employee } from '@/types/company.types';
import {getTeamById, getTeamMembers, addTeamMember, removeTeamMember, getCompanyEmployees } from '@/services/companyService';
import {getPublishedCourses, enrollTeamInCourses } from '@/services/courseService';
import {Search, Filter, CheckCircle, XCircle, Plus, Trash2, AlertCircle } from 'lucide-react';
import {useAuth } from '@/context/AuthContext';

interface TeamEnrollmentToolProps {
  companyId: string;
  teamId: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  category: string;
}

const TeamEnrollmentTool: React.FC<TeamEnrollmentToolProps> = ({companyId, teamId }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  // Mock courses data
  const mockCourses: Course[] = [
    {
      id: '1',
      title: 'Sales Fundamentals',
      description: 'Learn the basics of sales techniques and strategies',
      duration: 120,
      level: 'Beginner',
      category: 'Sales',
  },
    {
      id: '2',
      title: 'Advanced Negotiation',
      description: 'Master the art of negotiation in complex sales scenarios',
      duration: 180,
      level: 'Advanced',
      category: 'Sales',
  },
    {
      id: '3',
      title: 'Customer Relationship Management',
      description: 'Build and maintain strong customer relationships',
      duration: 150,
      level: 'Intermediate',
      category: 'Customer Service',
  },
    {
      id: '4',
      title: 'Digital Marketing Essentials',
      description: 'Learn the fundamentals of digital marketing',
      duration: 200,
      level: 'Beginner',
      category: 'Marketing',
  },
    {
      id: '5',
      title: 'Leadership Skills',
      description: 'Develop essential leadership skills for managers',
      duration: 240,
      level: 'Intermediate',
      category: 'Management',
  },
  ];

  // Mock available employees data
  const mockAvailableEmployees: Employee[] = [
    {
      id: '101',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david@example.com',
      companyId,
      role: 'employee',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jobTitle: 'Sales Representative',
  },
    {
      id: '102',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@example.com',
      companyId,
      role: 'employee',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jobTitle: 'Marketing Specialist',
  },
    {
      id: '103',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael@example.com',
      companyId,
      role: 'employee',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jobTitle: 'Customer Support',
  },
  ];

  useEffect(() => {
    fetchTeamData();
}, [companyId, teamId]);

  const {user } = useAuth();

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch team data
      const teamData = await getTeamById(companyId, teamId);

      if (!teamData) {
        setError('Team not found');
        return;
    }

      setTeam(teamData);

      // Fetch team members
      const teamMembers = await getTeamMembers(companyId, teamId);
      setMembers(teamMembers);

      // Fetch all company employees to find available ones
      const allEmployees = await getCompanyEmployees(companyId);

      // Filter out employees who are already team members
      const teamMemberIds = teamMembers.map(member => member.id);
      const availableEmps = allEmployees.filter(emp => !teamMemberIds.includes(emp.id));

      setAvailableEmployees(availableEmps);

      // Fetch published courses
      const {courses: publishedCourses } = await getPublishedCourses(undefined, undefined, 100);

      // Map to our Course interface
      const formattedCourses: Course[] = publishedCourses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        duration: course.duration,
        level: course.level,
        category: course.category
    }));

      setCourses(formattedCourses);
  } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleAddMember = async (employeeId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await addTeamMember(companyId, teamId, employeeId);

      // In a real implementation, you would refresh the team members
      // For now, we'll simulate adding the member
      const employeeToAdd = availableEmployees.find(emp => emp.id === employeeId);

      if (employeeToAdd) {
        setMembers(prev => [...prev, employeeToAdd]);
        setAvailableEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        setSuccess(`${employeeToAdd.firstName} ${employeeToAdd.lastName} added to the team.`);
    }
  } catch (err) {
      console.error('Error adding team member:', err);
      setError('Failed to add team member. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleRemoveMember = async (employeeId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await removeTeamMember(companyId, teamId, employeeId);

      // In a real implementation, you would refresh the team members
      // For now, we'll simulate removing the member
      const employeeToRemove = members.find(emp => emp.id === employeeId);

      if (employeeToRemove) {
        setMembers(prev => prev.filter(emp => emp.id !== employeeId));
        setAvailableEmployees(prev => [...prev, employeeToRemove]);
        setSuccess(`${employeeToRemove.firstName} ${employeeToRemove.lastName} removed from the team.`);
    }
  } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove team member. Please try again.');
  } finally {
      setLoading(false);
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

  const handleEnrollTeam = async () => {
    if (selectedCourses.length === 0) {
      setError('Please select at least one course.');
      return;
  }

    if (members.length === 0) {
      setError('Team has no members to enroll.');
      return;
  }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get user IDs from team members
      const memberUserIds = members.map(member => member.id);

      // Call the enrollment service
      const result = await enrollTeamInCourses(
        companyId,
        teamId,
        selectedCourses,
        memberUserIds
      );

      if (result.success) {
        const selectedCourseNames = courses
          .filter(course => selectedCourses.includes(course.id))
          .map(course => course.title)
          .join(', ');

        setSuccess(`Successfully enrolled ${result.enrolledUsers} team members in ${result.enrolledCourses} courses: ${selectedCourseNames}`);
        setSelectedCourses([]);
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
  } catch (err) {
      console.error('Error enrolling team:', err);
      setError('Failed to enroll team. Please try again.');
  } finally {
      setLoading(false);
  }
};

  // Filter employees based on search term
  const filteredEmployees = availableEmployees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.jobTitle?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.level.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  if (loading && !team) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error && !team) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
}

  if (!team) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-md">
        Team not found.
      </div>
    );
}

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">Team Enrollment Tool</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Enroll team members in courses and track their progress.
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

        <div className="px-6 py-4">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Team Members</h3>
            <div className="overflow-hidden border border-neutral-200 rounded-md">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Job Title
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
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">
                        No team members yet. Add members below.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-800 font-medium">
                              {member.firstName[0].toUpperCase()}{member.lastName[0].toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {member.firstName} {member.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {member.jobTitle || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={loading}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Add Team Members</h3>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search employees..."
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-hidden border border-neutral-200 rounded-md">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Job Title
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
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-800 font-medium">
                              {employee.firstName[0].toUpperCase()}{employee.lastName[0].toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {employee.firstName} {employee.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {employee.jobTitle || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleAddMember(employee.id)}
                            className="text-primary-600 hover:text-primary-900"
                            disabled={loading}
                          >
                            Add to Team
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Select Courses for Enrollment</h3>
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
            <div className="overflow-hidden border border-neutral-200 rounded-md">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                          checked={selectedCourses.length === courses.length}
                          onChange={() => {
                            if (selectedCourses.length === courses.length) {
                              setSelectedCourses([]);
                          } else {
                              setSelectedCourses(courses.map(course => course.id));
                          }
                        }}
                        />
                        <span className="ml-2">Title</span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Level
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                        No courses found.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => (
                      <tr
                        key={course.id}
                        className={`hover:bg-neutral-50 ${
                          selectedCourses.includes(course.id) ? 'bg-primary-50' : ''
                      }`}
                        onClick={() => handleCourseSelection(course.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                              checked={selectedCourses.includes(course.id)}
                              onChange={() => handleCourseSelection(course.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="ml-4 text-sm font-medium text-neutral-900">
                              {course.title}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500">
                          <div className="max-w-xs truncate">
                            {course.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {course.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {course.level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {course.duration} min
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleEnrollTeam}
              disabled={loading || selectedCourses.length === 0 || members.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Enroll Team in Selected Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamEnrollmentTool;
