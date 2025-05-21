// Script to check user enrollments in Firestore
const {initializeApp, cert } = require('firebase-admin/app');
const {getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Function to check enrollments for a specific user
async function checkUserEnrollments(userId) {
  
  
  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      
      return;
  }
    
    const userData = userDoc.data();
    
    
    // Check enrollments subcollection
    const enrollmentsSnapshot = await db.collection(`users/${userId}/enrollments`).get();
    
    if (enrollmentsSnapshot.empty) {
      
      return;
  }
    
    
    
    // Print details of each enrollment
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollment = doc.data();
      
      
      
      
      
      
      
      
      // Get course details
      try {
        const courseDoc = await db.collection('courses').doc(enrollment.courseId).get();
        if (courseDoc.exists) {
          const courseData = courseDoc.data();
          
      } else {
          
      }
    } catch (error) {
        
    }
  }
} catch (error) {
    console.error(`Error checking enrollments: ${error.message}`);
}
}

// Check if userId was provided as command line argument
const userId = process.argv[2];
if (!userId) {
  
  
  process.exit(1);
}

// Run the check
checkUserEnrollments(userId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
