import React, {useState, useEffect } from 'react';
import {collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import Button from '@/components/ui/Button';
import {toast } from 'react-hot-toast';
import {issueCertificatesInBatch } from '@/services/batchCertificateService';
import {User } from '@/types/user.types';
import {Course } from '@/types/course.types';
import {CertificateTemplate } from '@/types/certificate.types';

// Custom user interface for certificate issuance
interface UserWithId {
  id: string;
  uid: string;
  displayName?: string;
  email: string;
  roles?: {
    admin?: boolean;
    instructor?: boolean;
    student?: boolean;
    manager?: boolean;
};
}

interface BatchCertificateIssuanceProps {
  onComplete?: () => void;
}

const BatchCertificateIssuance: React.FC<BatchCertificateIssuanceProps> = ({onComplete }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [students, setStudents] = useState<UserWithId[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [issuanceStatus, setIssuanceStatus] = useState<{
    total: number;
    processed: number;
    success: number;
    failed: number;
} | null>(null);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesQuery = query(
          collection(firestore, 'courses'),
          orderBy('title')
        );
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesList = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      })) as Course[];

        setCourses(coursesList);
    } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
    }
  };

    fetchCourses();
}, []);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesQuery = query(
          collection(firestore, 'certificateTemplates'),
          orderBy('name')
        );
        const templatesSnapshot = await getDocs(templatesQuery);
        const templatesList = templatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      })) as CertificateTemplate[];

        setTemplates(templatesList);
    } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load certificate templates');
    }
  };

    fetchTemplates();
}, []);

  // Fetch students when course is selected
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setSelectedStudents([]);
      return;
  }

    const fetchStudents = async () => {
      try {
        // Get all users enrolled in the course
        const enrollmentsQuery = query(
          collection(firestore, 'courseEnrollments'),
          where('courseId', '==', selectedCourse)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

        // Extract user IDs
        const userIds = enrollmentsSnapshot.docs.map(doc => doc.data().userId);

        if (userIds.length === 0) {
          setStudents([]);
          return;
      }

        // Fetch user details
        const usersQuery = query(
          collection(firestore, 'users'),
          where('id', 'in', userIds)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      })) as UserWithId[];

        setStudents(usersList);
    } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
    }
  };

    fetchStudents();
}, [selectedCourse]);

  // Handle course selection
  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourse(e.target.value);
    setSelectedStudents([]);
};

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
};

  // Handle student selection
  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement>, studentId: string) => {
    if (e.target.checked) {
      setSelectedStudents(prev => [...prev, studentId]);
  } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
  }
};

  // Handle select all students
  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
  } else {
      setSelectedStudents(students.map(student => student.id));
  }
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
  }

    if (!selectedTemplate) {
      toast.error('Please select a certificate template');
      return;
  }

    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
  }

    try {
      setLoading(true);
      setIssuanceStatus({
        total: selectedStudents.length,
        processed: 0,
        success: 0,
        failed: 0
    });

      // Get course and template details
      const course = courses.find(c => c.id === selectedCourse);
      const template = templates.find(t => t.id === selectedTemplate);

      if (!course || !template) {
        throw new Error('Course or template not found');
    }

      // Issue certificates in batch
      const result = await issueCertificatesInBatch({
        courseId: selectedCourse,
        templateId: selectedTemplate,
        userIds: selectedStudents,
        isPublic,
        expiryDate: expiryDate || undefined,
        // Add required values and metadata properties
        values: {},
        metadata: {completionDate: new Date().toISOString() }, // Providing a default completion date
        onProgress: (processed, success, failed) => {
          setIssuanceStatus({
            total: selectedStudents.length,
            processed,
            success,
            failed
        });
      }
    });

      toast.success(`Successfully issued ${result.success} certificates`);

      if (result.failed > 0) {
        toast.error(`Failed to issue ${result.failed} certificates`);
    }

      // Reset form
      setSelectedStudents([]);

      if (onComplete) {
        onComplete();
    }
  } catch (error) {
      console.error('Error issuing certificates:', error);
      toast.error('Failed to issue certificates');
  } finally {
      setLoading(false);
  }
};

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-900">Batch Certificate Issuance</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Course Selection */}
          <div>
            <label htmlFor="course" className="block text-sm font-medium text-neutral-700 mb-1">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              id="course"
              value={selectedCourse}
              onChange={handleCourseChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-neutral-700 mb-1">
              Certificate Template <span className="text-red-500">*</span>
            </label>
            <select
              id="template"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
              required
            >
              <option value="">Select a template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-neutral-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                id="expiryDate"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center h-full pt-6">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                disabled={loading}
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-neutral-700">
                Make certificates public
              </label>
            </div>
          </div>

          {/* Student Selection */}
          {selectedCourse && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Students <span className="text-red-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="text-sm text-primary-600 hover:text-primary-800"
                  disabled={loading || students.length === 0}
                >
                  {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {students.length === 0 ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4 text-center">
                  <p className="text-neutral-500">No students enrolled in this course</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-neutral-300 rounded-md">
                  <div className="divide-y divide-neutral-200">
                    {students.map(student => (
                      <div key={student.id} className="flex items-center p-3 hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => handleStudentChange(e, student.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                          disabled={loading}
                        />
                        <label htmlFor={`student-${student.id}`} className="ml-3 block text-sm text-neutral-700">
                          {student.displayName || student.email || student.id}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-1 text-sm text-neutral-500">
                {selectedStudents.length} of {students.length} students selected
              </p>
            </div>
          )}

          {/* Issuance Status */}
          {issuanceStatus && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-neutral-900 mb-2">Issuance Progress</h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>{issuanceStatus.processed} of {issuanceStatus.total} processed</span>
                </div>

                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full"
                    style={{width: `${(issuanceStatus.processed / issuanceStatus.total) * 100}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-green-600">{issuanceStatus.success} successful</span>
                  <span className="text-red-600">{issuanceStatus.failed} failed</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || selectedStudents.length === 0}
            >
              {loading ? 'Issuing Certificates...' : 'Issue Certificates'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BatchCertificateIssuance;
