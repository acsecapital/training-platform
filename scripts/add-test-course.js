const {initializeApp } = require('firebase/app');
const {getFirestore, collection, addDoc } = require('firebase/firestore');
require('dotenv').config({path: '.env.local});

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Test course data
const testCourse = {
  title: "LIPS Sales System Fundamentals",
  description: "Learn the fundamentals of the LIPS Sales System and how to apply it to close more deals.",
  longDescription: "This comprehensive course covers all aspects of the LIPS Sales System, from initial lead qualification to closing techniques. You'll learn how to identify customer needs, present solutions effectively, and overcome objections to close more deals.",
  thumbnail: "https://via.placeholder.com/800x450?text=LIPS+Sales+System",
  duration: "4 hours",
  modules: 5,
  level: "Beginner",
  instructor: "John Smith",
  instructorTitle: "Head of Sales Training",
  instructorBio: "John has over 15 years of experience in sales training and has helped thousands of sales professionals improve their performance.",
  instructorAvatar: "https://via.placeholder.com/150?text=JS",
  price: 0,
  rating: 4.8,
  reviewCount: 124,
  enrolledCount: 1500,
  lastUpdated: new Date().toISOString(),
  whatYouWillLearn: [
    "Understand the LIPS Sales System framework",
    "Qualify leads effectively using the LIPS methodology",
    "Present solutions that address customer pain points",
    "Handle objections confidently",
    "Close deals with higher success rates"
  ],
  requirements: [
    "No prior sales experience required",
    "Basic understanding of customer service principles"
  ],
  tags: ["sales", "lips", "beginner", "fundamentals"],
  category: "Sales",
  featured: true,
  status: "published",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  categoryIds: ["lips"]
};

// Add the test course to Firestore
async function addTestCourse() {
  try {
    const docRef = await addDoc(collection(firestore, 'courses'), testCourse);
    console.log('Test course added with ID:', docRef.id);
} catch (error) {
    console.error('Error adding test course:', error);
}
}

// Run the function
addTestCourse();
