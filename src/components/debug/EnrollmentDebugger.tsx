import React, {useState, useEffect } from 'react';
import {useAuth } from '@/context/AuthContext';
import {collection, getDocs, query, orderBy } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import Button from '@/components/ui/Button';

const EnrollmentDebugger: React.FC = () => {
  const {user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebugger, setShowDebugger] = useState(false);

  const fetchEnrollments = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch enrollments directly from Firestore
      const enrollmentsRef = collection(firestore, `users/${user.uid}/enrollments`);
      const enrollmentsQuery = query(enrollmentsRef, orderBy('enrolledAt', 'desc'));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      const enrollmentsData = enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
      
      setEnrollments(enrollmentsData);
  } catch (err: any) {
      console.error('Error fetching enrollments:', err);
      setError(err.message || 'Failed to fetch enrollments');
  } finally {
      setLoading(false);
  }
};

  useEffect(() => {
    if (showDebugger && user) {
      fetchEnrollments();
  }
}, [showDebugger, user]);

  if (!showDebugger) {
    return (
      <div className="mt-8 text-center">
        <Button 
          variant="outline" 
          onClick={() => setShowDebugger(true)}
        >
          Show Enrollment Debugger
        </Button>
      </div>
    );
}

  return (
    <div className="mt-8 p-4 border border-neutral-300 rounded-lg bg-neutral-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Enrollment Debugger</h3>
        <Button 
          variant="outline" 
          onClick={() => setShowDebugger(false)}
          size="sm"
        >
          Hide
        </Button>
      </div>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">User Information</h4>
        <pre className="bg-neutral-100 p-3 rounded text-xs overflow-auto">
          {user ? JSON.stringify({
            id: user.id,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            roles: user.roles
        }, null, 2) : 'No user logged in'}
        </pre>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Direct Firestore Enrollments</h4>
          <Button 
            variant="outline" 
            onClick={fetchEnrollments}
            size="sm"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-3 text-sm">
            Error: {error}
          </div>
        )}
        
        {enrollments.length === 0 ? (
          <div className="bg-yellow-50 text-yellow-700 p-3 rounded text-sm">
            No enrollments found in Firestore for this user.
          </div>
        ) : (
          <pre className="bg-neutral-100 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(enrollments, null, 2)}
          </pre>
        )}
      </div>
      
      <div className="text-xs text-neutral-500">
        <p>Firestore Path: <code>users/{user?.uid}/enrollments</code></p>
        <p className="mt-1">
          If enrollments exist here but don't show on the page, there might be an issue with how the 
          CourseContext is fetching or processing the data.
        </p>
      </div>
    </div>
  );
};

export default EnrollmentDebugger;
