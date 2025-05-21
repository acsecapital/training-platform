import React, {useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {useAuth } from '@/context/AuthContext';
import {firestore } from '@/services/firebase';
import {collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import {toast } from 'sonner';
import Button from '@/components/ui/Button';
import {User } from '@/types/user.types';
import {Course, CourseProgress } from '@/types/course.types';
import Link from 'next/link';

interface UserWithId extends User {
  id: string;
}

export default function ProgressOverridesPage() {
  const {user: adminUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithId[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for users by email or name
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
  }

    setLoading(true);
    setError(null);
    setSearchResults([]);
    setSelectedUser(null);
    setUserEnrollments([]);

    try {
      // Search by email (exact match)
      const emailQuery = query(
        collection(firestore, 'users'),
        where('email', '==', searchTerm.trim().toLowerCase())
      );
      
      // Search by name (contains)
      const nameQuery = query(
        collection(firestore, 'users'),
        where('displayName', '>=', searchTerm.trim()),
        where('displayName', '<=', searchTerm.trim() + '\uf8ff')
      );

      const [emailSnapshot, nameSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(nameQuery)
      ]);

      // Combine results and remove duplicates
      const results = new Map<string, UserWithId>();
      
      emailSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        // Create a user object with required fields, using defaults for missing properties
        const user: UserWithId = {
          id: doc.id,
          uid: doc.id,
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          displayName: userData.displayName || userData.email || '',
          location: userData.location || '',
          country: userData.country || '',
          city: userData.city || '',
          department: userData.department || {
            id: '',
            name: '',
            departmentId: '',
            departmentName: '',
            companyId: userData.companyId || '',
            companyName: userData.companyName || '',
            displayName: '',
            description: '',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            employeeCount: 0
        },
          departmentId: userData.departmentId || '',
          companyId: userData.companyId || '',
          ...userData // Include any other fields from the document
      };
        results.set(doc.id, user);
    });
      
      nameSnapshot.docs.forEach(doc => {
        if (!results.has(doc.id)) {
          const userData = doc.data();
          // Create a user object with required fields, using defaults for missing properties
          const user: UserWithId = {
            id: doc.id,
            uid: doc.id,
            email: userData.email || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            displayName: userData.displayName || userData.email || '',
            location: userData.location || '',
            country: userData.country || '',
            city: userData.city || '',
            department: userData.department || {
              id: '',
              name: '',
              departmentId: '',
              departmentName: '',
              companyId: userData.companyId || '',
              companyName: userData.companyName || '',
              displayName: '',
              description: '',
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
              employeeCount: 0
          },
            departmentId: userData.departmentId || '',
            companyId: userData.companyId || '',
            ...userData // Include any other fields from the document
        };
          results.set(doc.id, user);
      }
    });

      const users = Array.from(results.values());
      setSearchResults(users);

      if (users.length === 0) {
        toast.info('No users found');
    }
  } catch (err: any) {
      console.error('Error searching users:', err);
      setError(`Error searching users: ${err.message}`);
      toast.error(`Error searching users: ${err.message}`);
  } finally {
      setLoading(false);
  }
};

  // Get user enrollments
  const handleSelectUser = async (user: UserWithId) => {
    setSelectedUser(user);
    setUserEnrollments([]);
    setLoading(true);
    setError(null);

    try {
      // Get user enrollments
      const enrollmentsRef = collection(firestore, `users/${user.id}/enrollments`);
      const enrollmentsSnapshot = await getDocs(enrollmentsRef);
      
      if (enrollmentsSnapshot.empty) {
        toast.info('User has no course enrollments');
        setUserEnrollments([]);
        return;
    }

      // Get course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        enrollmentsSnapshot.docs.map(async (enrollmentDoc) => {
          const enrollment = {id: enrollmentDoc.id, ...enrollmentDoc.data() };
          
          // Get course details
          const courseRef = doc(firestore, 'courses', enrollmentDoc.id);
          const courseDoc = await getDoc(courseRef);
          
          let course = null;
          if (courseDoc.exists()) {
            course = {id: courseDoc.id, ...courseDoc.data() } as Course;
        }

          // Get progress details
          const progressRef = doc(firestore, 'courseProgress', `${user.id}_${enrollmentDoc.id}`);
          const progressDoc = await getDoc(progressRef);
          
          let progress = null;
          if (progressDoc.exists()) {
            progress = progressDoc.data() as CourseProgress;
        }

          return {
            enrollment,
            course,
            progress
        };
      })
      );

      setUserEnrollments(enrollmentsWithCourses);
  } catch (err: any) {
      console.error('Error fetching user enrollments:', err);
      setError(`Error fetching user enrollments: ${err.message}`);
      toast.error(`Error fetching user enrollments: ${err.message}`);
  } finally {
      setLoading(false);
  }
};

  return (
    <AdminLayout title="Progress Overrides | Admin">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold mb-6">Course Progress Overrides</h1>
          
          <div className="mb-8">
            <p className="text-neutral-600 mb-4">
              This utility allows administrators to override course progress for users. You can mark courses, modules, or lessons as completed, reset progress, or revoke enrollments.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-700">
                <strong>Warning:</strong> These actions directly modify user data and cannot be automatically undone. Use with caution.
              </p>
            </div>
          </div>
          
          {/* User Search */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Search for User</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email or name"
                className="flex-1 border border-neutral-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={loading}
                variant="primary"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {searchResults.map((user) => (
                      <tr key={user.id} className={selectedUser?.id === user.id ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.displayName || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            onClick={() => handleSelectUser(user)}
                            variant="outline"
                            size="sm"
                          >
                            View Enrollments
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* User Enrollments */}
          {selectedUser && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Enrollments for {selectedUser.displayName || selectedUser.email}</h2>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : userEnrollments.length === 0 ? (
                <div className="bg-neutral-50 p-6 rounded-md text-center">
                  <p className="text-neutral-600">No enrollments found for this user.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {userEnrollments.map((item) => (
                    <div key={item.enrollment.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                      <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
                        <h3 className="text-lg font-medium">{item.course?.title || 'Unknown Course'}</h3>
                        <p className="text-sm text-neutral-500">
                          Status: <span className={`font-medium ${item.enrollment.status === 'completed' ? 'text-green-600' : item.enrollment.status === 'active' ? 'text-blue-600' : 'text-neutral-600'}`}>
                            {item.enrollment.status.charAt(0).toUpperCase() + item.enrollment.status.slice(1)}
                          </span>
                        </p>
                      </div>
                      <div className="px-6 py-4">
                        <div className="mb-4">
                          <p className="text-sm text-neutral-600 mb-1">Progress: {item.progress?.overallProgress || item.enrollment.progress || 0}%</p>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.enrollment.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`}
                              style={{width: `${item.progress?.overallProgress || item.enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/admin/progress-overrides/${selectedUser.id}/${item.enrollment.id}`} passHref>
                            <Button variant="primary" size="sm">
                              Manage Progress
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}





