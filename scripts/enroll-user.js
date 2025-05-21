// Script to directly enroll a user in a course
const {initializeApp, cert } = require('firebase-admin/app');
const {getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Function to enroll a user in a course
async function enrollUserInCourse(userId, courseId) {
  console.log(`Enrolling user ${userId} in course ${courseId}`);
  
  try {
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error(`User ${userId} not found in Firestore`);
      return;
  }
    
    const userData = userDoc.data();
    console.log(`User: ${userData.email} (${userData.firstName} ${userData.lastName})`);
    
    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      console.error(`Course ${courseId} not found in Firestore`);
      return;
  }
    
    const courseData = courseDoc.data();
    console.log(`Course: ${courseData.title}`);
    
    // Check if user is already enrolled
    const enrollmentsRef = db.collection(`users/${userId}/enrollments`);
    const existingEnrollment = await enrollmentsRef
      .where('courseId', '==', courseId)
      .get();
    
    if (!existingEnrollment.empty) {
      console.log(`User is already enrolled in this course. Updating enrollment...`);
      
      const enrollmentDoc = existingEnrollment.docs[0];
      await enrollmentDoc.ref.update({
        status: 'active',
        enrolledAt: new Date(),
        lastAccessedAt: new Date(),
        updatedAt: new Date()
    });
      
      console.log(`Enrollment updated successfully`);
      return;
  }
    
    // Create new enrollment
    const enrollmentData = {
      courseId,
      courseName: courseData.title,
      enrolledAt: new Date(),
      progress: 0,
      completedLessons: [],
      lastAccessedAt: new Date(),
      status: 'active'
  };
    
    const newEnrollment = await enrollmentsRef.add(enrollmentData);
    console.log(`Enrollment created successfully with ID: ${newEnrollment.id}`);
    
    // Initialize course progress
    const progressRef = db.collection('courseProgress').doc(`${userId}_${courseId}`);
    const progressExists = await progressRef.get();
    
    if (!progressExists.exists) {
      await progressRef.set({
        courseId,
        userId,
        startDate: new Date(),
        lastAccessDate: new Date(),
        completedLessons: [],
        completedModules: [],
        quizScores: {},
        quizAttempts: {},
        lessonProgress: {},
        moduleProgress: {},
        overallProgress: 0,
        completed: false,
        timeSpent: 0
    });
      
      console.log(`Course progress initialized successfully`);
  }
    
    console.log(`User ${userId} successfully enrolled in course ${courseId}`);
} catch (error) {
    console.error(`Error enrolling user: ${error.message}`);
}
}

// Check if userId and courseId were provided as command line arguments
const userId = process.argv[2];
const courseId = process.argv[3];

if (!userId || !courseId) {
  console.log('Please provide a user ID and course ID as command line arguments');
  console.log('Usage: node enroll-user.js <userId> <courseId>');
  process.exit(1);
}

// Run the enrollment
enrollUserInCourse(userId, courseId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
