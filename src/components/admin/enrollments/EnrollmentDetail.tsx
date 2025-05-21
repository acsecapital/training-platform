import React, {useState, useEffect } from 'react';
import {getEnrollmentById, updateEnrollmentStatus, deleteEnrollment } from '@/services/enrollmentService';
import {EnrollmentWithDetails } from '@/types/enrollment.types';
import {formatDate } from '@/utils/formatters';
import {Timestamp } from 'firebase/firestore';
import {
  User, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BarChart2,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import {useRouter } from 'next/router';
import {toast } from 'sonner';
import Button from '@/components/ui/Button';

interface EnrollmentDetailProps {
  enrollmentId: string;
}

const EnrollmentDetail: React.FC<EnrollmentDetailProps> = ({enrollmentId }) => {
  const [enrollment, setEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEnrollment();
}, [enrollmentId]);

  const fetchEnrollment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const enrollmentData = await getEnrollmentById(enrollmentId);
      setEnrollment(enrollmentData);
  } catch (err: any) {
      console.error('Error fetching enrollment:', err);
      setError('Failed to load enrollment details. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleStatusUpdate = async (status: 'active' | 'completed' | 'expired' | 'suspended') => {
    try {
      await updateEnrollmentStatus(enrollmentId, status);
      
      // Update local state
      if (enrollment) {
        setEnrollment({...enrollment, status });
    }
      
      toast.success(`Enrollment status updated to ${status}`);
  } catch (err) {
      console.error('Error updating enrollment status:', err);
      toast.error('Failed to update enrollment status');
  }
};

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) {
      try {
        await deleteEnrollment(enrollmentId);
        toast.success('Enrollment deleted successfully');
        router.push('/admin/enrollments');
    } catch (err) {
        console.error('Error deleting enrollment:', err);
        toast.error('Failed to delete enrollment');
    }
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <div className="flex">
          <div className="py-1">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-4" />
          </div>
          <div>
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
}

  if (!enrollment) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <div className="flex">
          <div className="py-1">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-4" />
          </div>
          <div>
            <p className="font-bold">Not Found</p>
            <p className="text-sm">The enrollment you're looking for doesn't exist or has been deleted.</p>
          </div>
        </div>
      </div>
    );
}

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Completed
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1.5" />
            Expired
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1.5" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            Unknown
          </span>
        );
  }
};

  return (
    <div className="space-y-6">
      {/* Back button and actions */}
      <div className="flex justify-between items-center">
        <Link
          href="/admin/enrollments"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Enrollments
        </Link>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/users/${enrollment.userId}`)}
          >
            <User className="h-4 w-4 mr-1.5" />
            View User
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/courses/${enrollment.courseId}`)}
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            View Course
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Enrollment header */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-900">
              Enrollment Details
            </h2>
            {getStatusBadge(enrollment.status)}
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4">User Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Name</p>
                  <p className="mt-1 text-sm text-neutral-900">{enrollment.userName || 'Unknown User'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Email</p>
                  <p className="mt-1 text-sm text-neutral-900">{enrollment.userEmail || 'No email'}</p>
                </div>
                {enrollment.teamName && (
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Team</p>
                    <p className="mt-1 text-sm text-neutral-900">{enrollment.teamName}</p>
                  </div>
                )}
                {enrollment.companyName && (
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Company</p>
                    <p className="mt-1 text-sm text-neutral-900">{enrollment.companyName}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Course Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Course Title</p>
                  <p className="mt-1 text-sm text-neutral-900">{enrollment.courseTitle || enrollment.courseName || 'Unknown Course'}</p>
                </div>
                {enrollment.courseLevel && (
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Level</p>
                    <p className="mt-1 text-sm text-neutral-900">{enrollment.courseLevel}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment details */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900">Enrollment Status</h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Enrolled On</p>
                  <p className="mt-1 text-sm text-neutral-900">
                    {enrollment.enrolledAt ? 
                      (enrollment.enrolledAt instanceof Timestamp ? 
                        formatDate(enrollment.enrolledAt.toDate().toISOString()) : 
                        formatDate(enrollment.enrolledAt)) : 
                      'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Last Accessed</p>
                  <p className="mt-1 text-sm text-neutral-900">
                    {enrollment.lastAccessedAt ? 
                      (enrollment.lastAccessedAt instanceof Timestamp ? 
                        formatDate(enrollment.lastAccessedAt.toDate().toISOString()) : 
                        formatDate(enrollment.lastAccessedAt)) : 
                      'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Status</p>
                  <p className="mt-1">{getStatusBadge(enrollment.status)}</p>
                </div>
                {enrollment.enrolledBy && (
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Enrollment Method</p>
                    <p className="mt-1 text-sm text-neutral-900">
                      {enrollment.enrolledBy.method === 'self' ? 'Self-enrolled' : 
                       enrollment.enrolledBy.method === 'team_enrollment' ? 'Team enrollment' :
                       enrollment.enrolledBy.method === 'admin' ? 'Admin enrollment' :
                       enrollment.enrolledBy.method === 'bulk_import' ? 'Bulk import' : 
                       'Unknown method'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Progress</p>
                  <div className="mt-2">
                    <div className="w-full bg-neutral-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{width: `${enrollment.progress || 0}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{enrollment.progress || 0}% complete</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Completed Lessons</p>
                  <p className="mt-1 text-sm text-neutral-900">
                    {enrollment.completedLessons?.length || 0} lessons completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900">Actions</h3>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => handleStatusUpdate('active')}
              disabled={enrollment.status === 'active'}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Mark as Active
            </Button>
            <Button
              variant="primary"
              onClick={() => handleStatusUpdate('completed')}
              disabled={enrollment.status === 'completed'}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Mark as Completed
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('suspended')}
              disabled={enrollment.status === 'suspended'}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Suspend Enrollment
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('expired')}
              disabled={enrollment.status === 'expired'}
            >
              <Clock className="h-4 w-4 mr-1.5" />
              Mark as Expired
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentDetail;


