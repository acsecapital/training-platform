import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {useAuth } from '@/context/AuthContext';
import ClientSideCertificateGenerator from '@/components/certificates/ClientSideCertificateGenerator';
import Button from '@/components/ui/Button';

interface CourseCertificateContentProps {
  courseId: string;
}

const CourseCertificateContent: React.FC<CourseCertificateContentProps> = ({courseId }) => {
  const router = useRouter();
  const {user, isAuthenticated } = useAuth();

  const [courseTitle, setCourseTitle] = useState('');
  const [userName, setUserName] = useState('');
  const [completionDate, setCompletionDate] = useState<Date | null>(null);
  const [certificateId, setCertificateId] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [certificateSaved, setCertificateSaved] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>();

  // Fetch course and enrollment data
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!isAuthenticated || !user) {
          router.push(`/auth/login?redirect=/courses/${courseId}/certificate`);
          return;
      }

        // Fetch course data
        const courseDoc = await getDoc(doc(firestore, 'courses', courseId));

        if (!courseDoc.exists()) {
          setError('Course not found');
          return;
      }

        const courseData = courseDoc.data();
        setCourseTitle(courseData.title || 'Untitled Course');

        // Fetch enrollment data
        const enrollmentDoc = await getDoc(doc(firestore, `users/${user.uid}/enrollments`, courseId));

        if (!enrollmentDoc.exists()) {
          setError('You are not enrolled in this course');
          return;
      }

        const enrollmentData = enrollmentDoc.data();
        setProgress(enrollmentData.progress || 0);

        // Check if course is completed
        if ((enrollmentData.progress || 0) < 100) {
          setError('You need to complete the course to access the certificate');
          return;
      }

        // Set certificate data
        setUserName(user.displayName || 'Student');
        setCompletionDate(enrollmentData.completedAt ? new Date(enrollmentData.completedAt) : new Date());
        setCertificateId(enrollmentData.certificateId || `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load certificate data. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, [courseId, isAuthenticated, user, router]);

  // Save certificate to Firestore
  const saveCertificate = async (certificateData: {
    pdfUrl: string;
    certificateId: string;
    template: string;
    signatureUrl?: string;
}) => {
    if (!user || !courseId) return;

    try {
      setIsSaving(true);

      // Create certificate document
      const certificateRef = await addDoc(collection(firestore, 'certificates'), {
        certificateId: certificateData.certificateId,
        studentId: user.uid,
        studentName: userName,
        courseId: courseId,
        courseName: courseTitle,
        completionDate: completionDate?.toISOString(),
        pdfUrl: certificateData.pdfUrl,
        template: certificateData.template,
        signatureUrl: certificateData.signatureUrl,
        createdAt: serverTimestamp(),
    });

      // Update enrollment with certificate ID
      await updateDoc(doc(firestore, `users/${user.uid}/enrollments`, courseId), {
        certificateId: certificateData.certificateId,
        certificateUrl: certificateData.pdfUrl,
        certificateCreatedAt: serverTimestamp(),
    });

      setCertificateSaved(true);
  } catch (err) {
      console.error('Error saving certificate:', err);
  } finally {
      setIsSaving(false);
  }
};

  // Handle certificate generation
  const handleCertificateGenerated = (pdfUrl: string) => {
    setCertificateUrl(pdfUrl);
};

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <div className="text-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold mb-2">Certificate Not Available</h1>
            <p className="text-neutral-600 mb-6">{error}</p>

            {progress < 100 && (
              <div className="mb-6">
                <div className="w-full bg-neutral-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-neutral-500">
                  Your current progress: {progress}%
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                href={`/courses/${courseId}`}
                variant="outline"
              >
                Course Details
              </Button>
              <Button
                href={`/courses/${courseId}/learn`}
                variant="primary"
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
}

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <div className="text-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold mb-2">Course Completed!</h1>
            <p className="text-neutral-600 mb-2">
              Congratulations on completing <span className="font-semibold">{courseTitle}</span>
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              Your certificate is ready to download
            </p>
          </div>

          {completionDate && (
            <div className="mb-8">
              <ClientSideCertificateGenerator
                userName={userName}
                courseName={courseTitle}
                completionDate={completionDate}
                certificateId={certificateId}
                onGenerate={handleCertificateGenerated}
                autoGenerate={true}
                allowCustomization={true}
                onSave={saveCertificate}
              />
            </div>
          )}

          {isSaving && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-blue-600 rounded-full"></div>
                <p className="text-blue-700">Saving your certificate...</p>
              </div>
            </div>
          )}

          {certificateSaved && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-center">
              <p className="text-green-700">
                Your certificate has been saved and can be verified using the certificate ID.
              </p>
            </div>
          )}

          {certificateUrl && (
            <div className="flex justify-center mb-8">
              <a
                href={certificateUrl}
                download={`${courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-600 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Certificate
              </a>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              href="/my-learning"
              variant="outline"
            >
              My Learning
            </Button>
            <Button
              href={`/verify-certificate?id=${certificateId}`}
              variant="outline"
            >
              Verify Certificate
            </Button>
            <Button
              href="/courses"
              variant="primary"
            >
              Explore More Courses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCertificateContent;
