// Script to check user authentication state and Firestore user document
const {initializeApp, cert } = require('firebase-admin/app');
const {getFirestore } = require('firebase-admin/firestore');
const {getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

// Function to check user auth and Firestore document
async function checkUserAuth(userIdentifier) {
  console.log(`Checking user with identifier: ${userIdentifier}`);
  
  try {
    // Try to get user by email first
    let authUser;
    
    if (userIdentifier.includes('@')) {
      console.log('Identifier appears to be an email address');
      try {
        const userByEmail = await auth.getUserByEmail(userIdentifier);
        authUser = userByEmail;
        console.log('Found user by email');
    } catch (error) {
        console.log(`Error getting user by email: ${error.message}`);
    }
  }
    
    // If not found by email, try as UID
    if (!authUser) {
      try {
        const userByUid = await auth.getUser(userIdentifier);
        authUser = userByUid;
        console.log('Found user by UID');
    } catch (error) {
        console.log(`Error getting user by UID: ${error.message}`);
    }
  }
    
    if (!authUser) {
      console.log('User not found in Firebase Authentication');
      return;
  }
    
    // Print Auth user details
    console.log('\nFIREBASE AUTH USER:');
    console.log('UID:', authUser.uid);
    console.log('Email:', authUser.email);
    console.log('Display Name:', authUser.displayName);
    console.log('Provider Data:', authUser.providerData);
    
    // Now check Firestore user document
    console.log('\nChecking Firestore user documents...');
    
    // Check by UID
    const userByUidDoc = await db.collection('users').doc(authUser.uid).get();
    if (userByUidDoc.exists) {
      const userData = userByUidDoc.data();
      console.log('\nFIRESTORE USER DOCUMENT (by UID):');
      console.log('Document ID:', userByUidDoc.id);
      console.log('Email:', userData.email);
      console.log('Name:', `${userData.firstName || ''} ${userData.lastName || ''}`.trim());
      console.log('User ID fields:');
      console.log('- id:', userData.id);
      console.log('- uid:', userData.uid);
      
      // Check enrollments
      const enrollmentsSnapshot = await db.collection(`users/${userByUidDoc.id}/enrollments`).get();
      console.log(`\nEnrollments (by UID path): ${enrollmentsSnapshot.size}`);
  } else {
      console.log('No Firestore user document found with UID:', authUser.uid);
      
      // Try to find user by email
      const usersSnapshot = await db.collection('users')
        .where('email', '==', authUser.email)
        .get();
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('\nFIRESTORE USER DOCUMENT (by email query):');
        console.log('Document ID:', userDoc.id);
        console.log('Email:', userData.email);
        console.log('Name:', `${userData.firstName || ''} ${userData.lastName || ''}`.trim());
        console.log('User ID fields:');
        console.log('- id:', userData.id);
        console.log('- uid:', userData.uid);
        
        // Check enrollments
        const enrollmentsSnapshot = await db.collection(`users/${userDoc.id}/enrollments`).get();
        console.log(`\nEnrollments (by document ID path): ${enrollmentsSnapshot.size}`);
        
        // If the document ID doesn't match the auth UID, this could be the issue
        if (userDoc.id !== authUser.uid) {
          console.log('\n⚠️ POTENTIAL ISSUE DETECTED:');
          console.log('The Firestore document ID does not match the Firebase Auth UID.');
          console.log('This could cause enrollment issues if the code is using the wrong ID.');
          console.log('\nRECOMMENDED ACTION:');
          console.log(`1. Update the Firestore document ID to match the Auth UID`);
          console.log(`2. Or ensure all code uses the document ID (${userDoc.id}) instead of the Auth UID (${authUser.uid})`);
      }
    } else {
        console.log('No Firestore user document found with email:', authUser.email);
    }
  }
} catch (error) {
    console.error(`Error checking user: ${error.message}`);
}
}

// Check if user identifier was provided as command line argument
const userIdentifier = process.argv[2];
if (!userIdentifier) {
  console.log('Please provide a user identifier (email or UID) as a command line argument');
  console.log('Usage: node check-user-auth.js <email or uid>');
  process.exit(1);
}

// Run the check
checkUserAuth(userIdentifier)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
