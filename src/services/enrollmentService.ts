import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  DocumentData, // Add DocumentData here
  documentId, // Import documentId
  QueryConstraint, // Import QueryConstraint
  CollectionReference, // Import CollectionReference
  DocumentSnapshot
} from 'firebase/firestore';
import {firestore } from './firebase';
import {
  EnrollmentWithDetails,
  UserEnrollment,
  TeamEnrollment,
  EnrollmentFilters,
  EnrollmentStats
} from '@/types/enrollment.types';
import {User } from '@/types/user.types';
import {Course } from '@/types/course.types';

/**
 * Get all user enrollments with pagination
 */
export const getAllEnrollments = async (
  pageSize: number = 20,
  lastVisible?: { id: string } | null,
  filters?: EnrollmentFilters
): Promise<{enrollments: EnrollmentWithDetails[], lastVisible: { id: string } | null }> => {
  try {
    // First, get all users
    const usersRef = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersRef);

    console.log(`Found ${usersSnapshot.docs.length} users`);

    // Array to store all enrollment promises
    const allEnrollmentPromises: Promise<EnrollmentWithDetails[]>[] = [];

    // For each user, get their enrollments
    usersSnapshot.docs.forEach(userDoc => {
      const userId = userDoc.id;
      const userData = userDoc.data() as User;

      // Skip this user if we're filtering for a different user
      if (filters?.userId && filters.userId !== userId) {
        return;
    }

      // Create a reference to the user's enrollments subcollection
      const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);

      // Start building query constraints
      const constraints: QueryConstraint[] = [orderBy('enrolledAt', 'desc')];

      // Apply filters if provided
      if (filters) {
        // Status filter
        if (filters.status) {
          constraints.push(where('status', '==', filters.status));
      }

        // Course filter
        if (filters.courseId) {
          constraints.push(where('courseId', '==', filters.courseId));
      }

        // Date filters
        if (filters.startDate) {
          constraints.push(where('enrolledAt', '>=', Timestamp.fromDate(filters.startDate)));
      }

        if (filters.endDate) {
          constraints.push(where('enrolledAt', '<=', Timestamp.fromDate(filters.endDate)));
      }
    }

      // Create the query with all constraints
      // Note: This may require composite indexes in Firestore
      const q = query(enrollmentsRef, ...constraints);

      // Add promise to get enrollments for this user
      const userEnrollmentsPromise = getDocs(q).then(async (enrollmentsSnapshot) => {
        console.log(`User ${userId} has ${enrollmentsSnapshot.docs.length} enrollments`);

        // Extract unique course IDs from enrollments
        const courseIds = enrollmentsSnapshot.docs.map(doc => doc.data().courseId as string).filter((id, index, self) => id && self.indexOf(id) === index);

        // Fetch all required course documents in a single batched read (up to 10 at a time)
        const courseDocs: (DocumentSnapshot<DocumentData> | DocumentData)[] = [];
        const courseIdChunks = [];
        for (let i = 0; i < courseIds.length; i += 10) {
          courseIdChunks.push(courseIds.slice(i, i + 10));
      }

        for (const chunk of courseIdChunks) {
          if (chunk.length > 0) {
            const courseSnapshot = await getDocs(query(collection(firestore, 'courses') as CollectionReference<Course>, where(documentId(), 'in', chunk)));
            courseSnapshot.forEach(doc => courseDocs.push(doc));
        }
      }

        // Create a map for quick lookup of course data by ID
        const courseDataMap = new Map<string, Course>();
        courseDocs.forEach(doc => {
          if ('exists' in doc && doc.exists && doc.exists()) { // Type guard for DocumentSnapshot
            const docId = doc.id;
            const docData = doc.data() as Course;
            courseDataMap.set(docId, docData);
        }
      });

        // Process each enrollment document, using the courseDataMap
        const enrollmentPromises = enrollmentsSnapshot.docs.map(async (enrollmentDoc) => {
          // Create a combined ID that includes both userId and enrollmentId
          const enrollmentData = {
            id: `${userId}|${enrollmentDoc.id}`,
            ...enrollmentDoc.data()
        } as UserEnrollment; // Assuming data() returns fields compatible with UserEnrollment

          // console.log(`Processing enrollment ${enrollmentDoc.id} for course ${enrollmentData.courseId}`); // Keep commented

          // Get course details from the map
          const courseData = courseDataMap.get(enrollmentData.courseId) || null;

          // Combine data
          const enrollmentWithDetails: EnrollmentWithDetails = {
            ...enrollmentData,
            userName: userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown User',
            userEmail: userData?.email || 'Unknown Email',
            courseTitle: courseData?.title || 'Unknown Course',
            courseThumbnail: courseData?.thumbnail || '',
            courseLevel: courseData?.level || 'Unknown Level',
            // Add location data from user profile
            location: userData?.location || '',
            // These fields might be undefined if not present in the user profile
            country: userData?.country,
            city: userData?.city, // userData.city is string, EnrollmentWithDetails.city is string | undefined
            departmentId: (userData?.department && typeof userData.department === 'object' && 'id' in userData.department)
                            ? (userData.department as { id: string }).id
                            : userData?.departmentId
        };

          // If team enrollment, get team and company details (still individual reads, consider optimization if this is a bottleneck)
          if (enrollmentData.enrolledBy?.teamId) {
            const teamDoc = await getDoc(doc(firestore, 'teams', enrollmentData.enrolledBy.teamId));
            if (teamDoc.exists() && teamDoc.data()) {
              enrollmentWithDetails.teamName = (teamDoc.data() as { name: string }).name;
              enrollmentWithDetails.teamId = enrollmentData.enrolledBy.teamId;
          }

            if (enrollmentData.enrolledBy?.companyId) {
              const companyDoc = await getDoc(doc(firestore, 'companies', enrollmentData.enrolledBy.companyId));
              if (companyDoc.exists() && companyDoc.data()) {
                enrollmentWithDetails.companyName = (companyDoc.data() as { name: string }).name;
                enrollmentWithDetails.companyId = enrollmentData.enrolledBy.companyId;
            }
          }
        }

          // Get user's company and department if not already set (still individual reads, consider optimization if this is a bottleneck)
          if (!enrollmentWithDetails.companyId && userData?.companyId && typeof userData.companyId === 'string') {
            enrollmentWithDetails.companyId = userData.companyId;

            // Try to get company name
            try {
              const companyDoc = await getDoc(doc(firestore, 'companies', userData.companyId));
              if (companyDoc.exists() && companyDoc.data()) {
                enrollmentWithDetails.companyName = (companyDoc.data() as { name: string }).name;
            }

          } catch (err) {
              console.error('Error fetching company details:', err);
          }
        }

          return enrollmentWithDetails;
      });

        return Promise.all(enrollmentPromises);
    });

      allEnrollmentPromises.push(userEnrollmentsPromise);
  });

    // Wait for all enrollment promises to resolve
    const allEnrollmentsNestedArray = await Promise.all(allEnrollmentPromises);

    // Flatten the array of arrays
    let allEnrollments = allEnrollmentsNestedArray.flat();

    console.log(`Total enrollments found before filtering: ${allEnrollments.length}`);

    // Apply client-side filters that can't be handled by Firestore queries
    if (filters) {
      // Apply search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        allEnrollments = allEnrollments.filter(enrollment =>
          (enrollment.userName && enrollment.userName.toLowerCase().includes(searchLower)) ||
          (enrollment.userEmail && enrollment.userEmail.toLowerCase().includes(searchLower)) ||
          (enrollment.courseTitle && enrollment.courseTitle.toLowerCase().includes(searchLower)) ||
          (enrollment.courseName && enrollment.courseName.toLowerCase().includes(searchLower))
        );
        console.log(`Enrollments after search filter: ${allEnrollments.length}`);
    }

      // Apply company filter
      if (filters.companyId) {
        allEnrollments = allEnrollments.filter(enrollment => {
          // Check all possible places where company ID might be stored
          return (
            enrollment.enrolledBy?.companyId === filters.companyId ||
            enrollment.companyId === filters.companyId
          );
      });
        console.log(`Enrollments after company filter: ${allEnrollments.length}`);
    }

      // Apply department filter (only if we have a department ID)
      if (filters.departmentId) {
        allEnrollments = allEnrollments.filter(enrollment => {
          // Check all possible places where department ID might be stored
          return (
            enrollment.departmentId === filters.departmentId
          );
      });
        console.log(`Enrollments after department filter: ${allEnrollments.length}`);
    }

      // Apply team filter
      if (filters.teamId) {
        allEnrollments = allEnrollments.filter(enrollment => {
          // Check all possible places where team ID might be stored
          return (
            enrollment.enrolledBy?.teamId === filters.teamId ||
            enrollment.teamId === filters.teamId
          );
      });
        console.log(`Enrollments after team filter: ${allEnrollments.length}`);
    }

      // Apply country filter
      if (filters.country) {
        allEnrollments = allEnrollments.filter(enrollment =>
          enrollment.country === filters.country
        );
        console.log(`Enrollments after country filter: ${allEnrollments.length}`);
    }

      // Apply city filter
      if (filters.city) {
        allEnrollments = allEnrollments.filter(enrollment =>
          enrollment.city === filters.city
        );
        console.log(`Enrollments after city filter: ${allEnrollments.length}`);
    }

      // Apply location filter (text search on location field)
      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        allEnrollments = allEnrollments.filter(enrollment => {
          // Check if location exists and contains the search term
          if (enrollment.location && enrollment.location.toLowerCase().includes(locationLower)) {
            return true;
        }

          // Also check city and country fields if they exist
          if (enrollment.city && enrollment.city.toLowerCase().includes(locationLower)) {
            return true;
        }

          if (enrollment.country && typeof enrollment.country === 'string' && enrollment.country.toLowerCase().includes(locationLower)) {
            return true;
        }

          return false;
      });
        console.log(`Enrollments after location filter: ${allEnrollments.length}`);
    }
  }

    // Sort by enrolledAt (descending)
    allEnrollments.sort((a, b) => {
      const dateA = a.enrolledAt instanceof Timestamp ? a.enrolledAt.toMillis() : new Date(a.enrolledAt).getTime();
      const dateB = b.enrolledAt instanceof Timestamp ? b.enrolledAt.toMillis() : new Date(b.enrolledAt).getTime();
      return dateB - dateA;
  });

    console.log(`Total enrollments after all filtering: ${allEnrollments.length}`);

    // Apply pagination
    let startIndex = 0;
    if (lastVisible) {
      // After this check, lastVisible should be of type { id: string }.
      // If TypeScript still infers 'lastVisible' as 'never' here,
      // the problem is likely in the definition of EnrollmentWithDetails or related types.
      const idToFind = (lastVisible as { id: string }).id; // Explicit assertion
      const index = allEnrollments.findIndex(e => e.id === idToFind);
      if (index !== -1) {
        startIndex = index + 1;
      } else {
        // lastVisible.id was not found, so start from the beginning.
        // This can happen if filters changed the dataset such that the previous lastVisible is no longer relevant.
        startIndex = 0;
      }
    }

    const paginatedEnrollments = allEnrollments.slice(startIndex, startIndex + pageSize);

    // Get the last visible document for pagination
    const newLastVisible = paginatedEnrollments.length > 0 && paginatedEnrollments.length === pageSize
      ? { id: paginatedEnrollments[paginatedEnrollments.length - 1].id }
      : null;

    return {
      enrollments: paginatedEnrollments,
      lastVisible: newLastVisible
  };
} catch (error) {
    console.error('Error fetching enrollments:', error);
    throw new Error('Failed to fetch enrollments');
}
};

/**
 * Get enrollments for a specific user
 */
export const getUserEnrollments = async (userId: string): Promise<UserEnrollment[]> => {
  try {
    const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
    const q = query(enrollmentsRef, orderBy('enrolledAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as UserEnrollment[];
} catch (error) {
    console.error('Error fetching user enrollments:', error);
    throw new Error('Failed to fetch user enrollments');
}
};

/**
 * Get enrollments for a specific course
 * This requires iterating through all users and checking their enrollments subcollections
 */
export const getCourseEnrollments = async (courseId: string): Promise<EnrollmentWithDetails[]> => {
  try {
    // First, get all users
    const usersRef = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersRef);

    // Fetch the details for the specific courseId once, as it's the same for all enrollments here
    const courseDocRef = doc(firestore, 'courses', courseId);
    const courseDoc = await getDoc(courseDocRef);
    const courseDataGlobal = courseDoc.exists() ? courseDoc.data() as Course : null;

    if (!courseDataGlobal) {
      // Log a warning if the course is not found, as enrollments might lack some details.
      console.warn(`Course with ID ${courseId} not found. Enrollments for this course may have incomplete course details.`);
    }
    console.log(`Checking enrollments for course ${courseId} across ${usersSnapshot.docs.length} users`);

    // Array to store all enrollment promises
    const allEnrollmentPromises: Promise<EnrollmentWithDetails[]>[] = [];

    // For each user, check if they have an enrollment for this course
    usersSnapshot.docs.forEach(userDoc => {
      const userId = userDoc.id;
      const userData = userDoc.data() as User;

      // Create a reference to the user's enrollments subcollection
      const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
      const enrollmentQuery = query(
        enrollmentsRef,
        where('courseId', '==', courseId)
      );

      // Add promise to get enrollments for this user
      const userEnrollmentsPromise = getDocs(enrollmentQuery).then(enrollmentsSnapshot => {
        if (enrollmentsSnapshot.empty) {
          return [];
      }

        // Process each enrollment document
        return Promise.all(enrollmentsSnapshot.docs.map((enrollmentDoc) => {
          const enrollmentData = {
            id: `${userId}|${enrollmentDoc.id}`,
            ...enrollmentDoc.data()
        } as UserEnrollment;

          // Combine data
          const enrollmentWithDetails: EnrollmentWithDetails = {
            ...enrollmentData,
            userName: userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'Unknown User',
            userEmail: userData?.email || 'Unknown Email', // Added from getAllEnrollments for consistency
            // Populate fields similar to getAllEnrollments for consistency
            location: userData?.location || '',
            country: userData?.country,
            city: userData?.city,
            departmentId: (userData?.department && typeof userData.department === 'object' && 'id' in userData.department)
                            ? (userData.department as { id: string }).id
                            : userData?.departmentId,
            // courseTitle, courseThumbnail, courseLevel are populated later or might already be in enrollmentData
            courseTitle: enrollmentData.courseName || (courseDataGlobal?.title || 'Unknown Course'),
            courseThumbnail: courseDataGlobal?.thumbnail || '',
            courseLevel: courseDataGlobal?.level || 'Unknown Level'
        };

          return enrollmentWithDetails;
      }));
    });

      allEnrollmentPromises.push(userEnrollmentsPromise);
  });

    // Wait for all enrollment promises to resolve
    const allEnrollmentsNestedArray = await Promise.all(allEnrollmentPromises);

    // Flatten the array of arrays and sort by enrollment date
    const allEnrollments = allEnrollmentsNestedArray.flat().sort((a, b) => {
      const dateA = a.enrolledAt instanceof Timestamp ? a.enrolledAt.toMillis() : new Date(a.enrolledAt).getTime();
      const dateB = b.enrolledAt instanceof Timestamp ? b.enrolledAt.toMillis() : new Date(b.enrolledAt).getTime();
      return dateB - dateA;
  });

    console.log(`Found ${allEnrollments.length} enrollments for course ${courseId}`);

    return allEnrollments;
} catch (error) {
    console.error('Error fetching course enrollments:', error);
    throw new Error('Failed to fetch course enrollments');
}
};

/**
 * Get team enrollments
 */
export const getTeamEnrollments = async (teamId: string): Promise<TeamEnrollment[]> => {
  try {
    const teamEnrollmentsRef = collection(firestore, 'teamEnrollments');
    const q = query(teamEnrollmentsRef, where('teamId', '==', teamId), orderBy('enrolledAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as TeamEnrollment[];
} catch (error) {
    console.error('Error fetching team enrollments:', error);
    throw new Error('Failed to fetch team enrollments');
}
};

/**
 * Get a single enrollment by ID
 * Note: enrollmentId format is "userId|enrollmentId"
 */
export const getEnrollmentById = async (enrollmentId: string): Promise<EnrollmentWithDetails | null> => {
  try {
    // Parse the combined ID to get userId and the actual enrollmentId
    const [userId, actualEnrollmentId] = enrollmentId.split('|');

    if (!userId || !actualEnrollmentId) {
      console.error('Invalid enrollment ID format:', enrollmentId);
      return null;
  }

    console.log(`Fetching enrollment with userId: ${userId}, enrollmentId: ${actualEnrollmentId}`);

    // Get the enrollment from the user's subcollection
    const enrollmentRef = doc(firestore, `users/${userId}/enrollments`, actualEnrollmentId);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      console.log(`Enrollment not found for userId: ${userId}, enrollmentId: ${actualEnrollmentId}`);
      return null;
  }

    // Create enrollment data with the combined ID format
    const enrollmentData = {
      id: `${userId}|${enrollmentDoc.id}`,
      userId, // Ensure userId is set
      ...enrollmentDoc.data()
  } as UserEnrollment;

    // Get user details
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() as User : null;

    // Get course details
    const courseDoc = await getDoc(doc(firestore, 'courses', enrollmentData.courseId));
    const courseData = courseDoc.exists() ? courseDoc.data() as Course : null;

    // Combine data
    const enrollmentWithDetails: EnrollmentWithDetails = {
      ...enrollmentData,
      userName: userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown User',
      userEmail: userData?.email || 'Unknown Email',
      courseTitle: courseData?.title || 'Unknown Course',
      courseThumbnail: courseData?.thumbnail || '',
      courseLevel: courseData?.level || 'Unknown Level',
      // Add these for consistency with getAllEnrollments
      location: userData?.location || '',
      country: userData?.country,
      city: userData?.city,
      departmentId: (userData?.department && typeof userData.department === 'object' && 'id' in userData.department)
                    ? (userData.department as { id: string }).id
                    : userData?.departmentId
  };

    // If team enrollment, get team and company details
    if (enrollmentData.enrolledBy?.teamId) {
      const teamDoc = await getDoc(doc(firestore, 'teams', enrollmentData.enrolledBy.teamId));
      if (teamDoc.exists() && teamDoc.data()) {
        enrollmentWithDetails.teamName = (teamDoc.data() as { name: string }).name;
        enrollmentWithDetails.teamId = enrollmentData.enrolledBy.teamId;
    }

      if (enrollmentData.enrolledBy?.companyId) {
        const companyDoc = await getDoc(doc(firestore, 'companies', enrollmentData.enrolledBy.companyId));
        if (companyDoc.exists() && companyDoc.data()) {
          enrollmentWithDetails.companyName = (companyDoc.data() as { name: string }).name;
          enrollmentWithDetails.companyId = enrollmentData.enrolledBy.companyId;
      }
    }
  }

    // Get user's company and department if not already set
    if (!enrollmentWithDetails.companyId && userData?.companyId && typeof userData.companyId === 'string') {
      enrollmentWithDetails.companyId = userData.companyId;

      // Try to get company name
      try {
        const companyDoc = await getDoc(doc(firestore, 'companies', userData.companyId));
        if (companyDoc.exists() && companyDoc.data()) {
          enrollmentWithDetails.companyName = (companyDoc.data() as { name: string }).name;
      }
    } catch (err) {
        console.error('Error fetching company details:', err);
    }
  }

    return enrollmentWithDetails;
} catch (error) {
    console.error('Error fetching enrollment:', error);
    throw new Error('Failed to fetch enrollment');
}
};

/**
 * Update enrollment status
 * Note: enrollmentId format is "userId|enrollmentId"
 */
export const updateEnrollmentStatus = async (
  enrollmentId: string,
  status: 'active' | 'completed' | 'expired' | 'suspended'
): Promise<void> => {
  try {
    // Parse the combined ID to get userId and the actual enrollmentId
    const [userId, actualEnrollmentId] = enrollmentId.split('|');

    if (!userId || !actualEnrollmentId) {
      throw new Error('Invalid enrollment ID format');
  }

    const enrollmentRef = doc(firestore, `users/${userId}/enrollments`, actualEnrollmentId);
    await updateDoc(enrollmentRef, {
      status,
      updatedAt: serverTimestamp()
  });
} catch (error) {
    console.error('Error updating enrollment status:', error);
    throw new Error('Failed to update enrollment status');
}
};

/**
 * Delete an enrollment
 * Note: enrollmentId format is "userId|enrollmentId"
 */
export const deleteEnrollment = async (enrollmentId: string): Promise<void> => {
  try {
    // Parse the combined ID to get userId and the actual enrollmentId
    const [userId, actualEnrollmentId] = enrollmentId.split('|');

    if (!userId || !actualEnrollmentId) {
      throw new Error('Invalid enrollment ID format');
  }

    await deleteDoc(doc(firestore, `users/${userId}/enrollments`, actualEnrollmentId));
} catch (error) {
    console.error('Error deleting enrollment:', error);
    throw new Error('Failed to delete enrollment');
}
};

/**
 * Get enrollment statistics
 */
export const getEnrollmentStats = async (): Promise<EnrollmentStats> => {
  try {
    // First, get all users
    const usersRef = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersRef);

     // For each user, get their enrollments
    const userPromises = usersSnapshot.docs.map(async userDoc => {
      const userId = userDoc.id;

      // Create a reference to the user's enrollments subcollection
      const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
      const enrollmentsSnapshot = await getDocs(enrollmentsRef);

      // Add each enrollment to the array
      const userEnrollments = enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<UserEnrollment, 'id'>) // Spread known properties
    })) as UserEnrollment[];

      return userEnrollments;
  });

    // Wait for all promises to resolve
    const enrollmentsNestedArray = await Promise.all(userPromises);

    // Flatten the array of arrays
    const enrollments = enrollmentsNestedArray.flat();

    // Calculate statistics
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const expiredEnrollments = enrollments.filter(e => e.status === 'expired').length;

    // Calculate average progress
    const totalProgress = enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0);
    const averageProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0;

    // Group enrollments by day
    const enrollmentsByDay = groupEnrollmentsByDay(enrollments);

    // Group enrollments by course
    const enrollmentsByCourse = groupEnrollmentsByCourse(enrollments);

    return {
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      expiredEnrollments,
      averageProgress,
      enrollmentsByDay,
      enrollmentsByCourse
  };
} catch (error) {
    console.error('Error fetching enrollment stats:', error);
    throw new Error('Failed to fetch enrollment statistics');
}
};

// Helper function to group enrollments by day
const groupEnrollmentsByDay = (enrollments: UserEnrollment[]): { date: string; count: number }[] => {
  const groupedByDay: Record<string, number> = {};

  enrollments.forEach(enrollment => {
    const enrolledAt = enrollment.enrolledAt;
    let dateStr: string;

    if (typeof enrolledAt === 'string') {
      dateStr = enrolledAt.split('T')[0];
  } else if (enrolledAt instanceof Timestamp) {
      const date = enrolledAt.toDate();
      dateStr = date.toISOString().split('T')[0];
  } else {
      return; // Skip if invalid date
  }

    if (groupedByDay[dateStr]) {
      groupedByDay[dateStr]++;
  } else {
      groupedByDay[dateStr] = 1;
  }
});

  // Convert to array format
  return Object.entries(groupedByDay).map(([date, count]) => ({
    date,
    count
})).sort((a, b) => a.date.localeCompare(b.date));
};

// Helper function to group enrollments by course
const groupEnrollmentsByCourse = (enrollments: UserEnrollment[]): { courseId: string; courseName: string; count: number }[] => {
  const groupedByCourse: Record<string, {courseName: string, count: number }> = {};

  enrollments.forEach(enrollment => {
    const {courseId, courseName } = enrollment;

    if (groupedByCourse[courseId]) {
      groupedByCourse[courseId].count++;
  } else {
      groupedByCourse[courseId] = {
        courseName: courseName || 'Unknown Course',
        count: 1
    };
  }
});

  // Convert to array format
  return Object.entries(groupedByCourse).map(([courseId, data]) => ({
    courseId,
    courseName: data.courseName,
    count: data.count
})).sort((a, b) => b.count - a.count);
};

/**
 * Create a test enrollment for debugging purposes
 * This function should only be used during development
 */
export const createTestEnrollment = async (
  userId: string,
  courseId: string,
  courseName: string
): Promise<string> => {
  try {
    // Create a reference to the user's enrollments subcollection
    const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);

    // Create enrollment data
    const enrollmentData = {
      courseId,
      courseName,
      enrolledAt: serverTimestamp(),
      progress: 0,
      completedLessons: [],
      lastAccessedAt: serverTimestamp(),
      status: 'active',
  };

    // Add the enrollment document
    const docRef = await addDoc(enrollmentsRef, enrollmentData);
    console.log(`Created test enrollment with ID: ${docRef.id}`);

    return docRef.id;
} catch (error) {
    console.error('Error creating test enrollment:', error);
    throw new Error('Failed to create test enrollment');
}
};

