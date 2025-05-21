# Users Firestore Database Structure

This document illustrates the structure of the user-related collections in the Firestore database used in the training platform and how these paths are represented in the codebase.

## Path Representation in Code

**IMPORTANT: The specific document IDs shown in this document (like "user123") are for illustration purposes only. Never hardcode these specific IDs in development. Always use variables or dynamic references.**

Firestore paths shown in this document can be accessed in the codebase using various patterns. Here are common ways these paths are represented in code:

```typescript
// Direct path reference
const userRef = doc(db, 'users', userId);
const userProfileRef = doc(db, 'userProfiles', userId);
const userProgressRef = doc(db, 'users', userId, 'progress', courseId);
const userEnrollmentRef = doc(db, 'users', userId, 'enrollments', enrollmentId);

// Collection references
const usersRef = collection(db, 'users');
const userProfilesRef = collection(db, 'userProfiles');
const userProgressRef = collection(db, 'users', userId, 'progress');
const userEnrollmentsRef = collection(db, 'users', userId, 'enrollments');

// Path strings
const userPath = `users/${userId}`;
const userProfilePath = `userProfiles/${userId}`;
const userProgressPath = `users/${userId}/progress/${courseId}`;
const userEnrollmentPath = `users/${userId}/enrollments/${enrollmentId}`;
```

When reviewing the codebase, look for these patterns to understand how the data is being accessed and manipulated.

## Users Collection

### User Document: `/users/AaAqZ6CdKkVZQEdyJNvbEELfaqh2`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const userRef = doc(db, 'users', userId);

// CORRECT: Using variables in queries
const q = query(collection(db, 'users'), where(documentId(), '==', userId));

// CORRECT: Using variables in path strings
const userPath = `users/${userId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'users', 'AaAqZ6CdKkVZQEdyJNvbEELfaqh2'); // BAD PRACTICE
```

```
AaAqZ6CdKkVZQEdyJNvbEELfaqh2
│
├── accountType: "individual" (string)
│
├── address: null (null)
│
├── avatarUrl: null (null)
│
├── city: null (null)
│
├── communicationPreferences (map)
│   ├── email: true (Boolean)
│   └── phone: true (Boolean)
│
├── company: "Boss" (string)
│
├── companyId: null (null)
│
├── companyName: null (null)
│
├── country: null (null)
│
├── createdAt: 24 November 2024 at 08:50:02 UTC-4 (timestamp)
│
├── department: null (null)
│
├── departmentId: null (null)
│
├── departmentName: null (null)
│
├── email: "egcharle1@gmail.com" (string)
│
├── firstName: "Navvy" (string)
│
├── fullName: null (null)
│
├── id: "AaAqZ6CdKkVZQEdyJNvbEELfaqh2" (string)
│
├── industry: "Retail" (string)
│
├── jobTitle: "Father Dad" (string)
│
├── joinedAt: "null" (string)
│
├── lastName: "Kane" (string)
│
├── lastUpdated: 24 November 2024 at 10:32:33 UTC-4 (timestamp)
│
├── marketingPreferences (map)
│   ├── emailUpdates: true (Boolean)
│   ├── productNews: true (Boolean)
│   └── trainingTips: true (Boolean)
│
├── phone: null (null)
│
├── state: null (null)
│
├── tags (array) - empty
│
├── timezone: null (null)
│
├── updatedAt: 24 November 2024 at 10:32:33 UTC-4 (timestamp)
│
└── zipCode: null (null)
```

### Key Observations:
- User documents contain personal information (name, email, etc.)
- Users have communication and marketing preferences stored as nested maps
- Many fields can be null, indicating optional information
- The document includes timestamps for creation and updates
- The user ID is stored in the document as the `id` field, which matches the document ID

## User Enrollments Collection

### Enrollment Document: `/users/AaAqZ6CdKkVZQEdyJNvbEELfaqh2/enrollments/AzJC5QeX3xiu2bIFQD2L`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const enrollmentRef = doc(db, 'users', userId, 'enrollments', enrollmentId);

// CORRECT: Collection reference for all enrollments of a user
const enrollmentsRef = collection(db, 'users', userId, 'enrollments');

// CORRECT: Query for a specific enrollment
const q = query(
  collection(db, 'users', userId, 'enrollments'),
  where('courseId', '==', courseId)
);

// CORRECT: Path string with variables
const enrollmentPath = `users/${userId}/enrollments/${enrollmentId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'users', 'AaAqZ6CdKkVZQEdyJNvbEELfaqh2', 'enrollments', 'AzJC5QeX3xiu2bIFQD2L'); // BAD PRACTICE
```

```
AzJC5QeX3xiu2bIFQD2L
│
├── completedLessons (array) - empty
│
├── courseId: "nJDli18b8ti2NJXAhx2D" (string)
│
├── courseName: "Plenty For 20" (string)
│
├── enrolledAt: 2 May 2025 at 11:34:15 UTC-4 (timestamp)
│
├── enrolledBy (map)
│   ├── method: "admin_enrollment" (string)
│   └── timestamp: 2 May 2025 at 11:34:15 UTC-4 (timestamp)
│
├── lastAccessedAt: 2 May 2025 at 11:34:15 UTC-4 (timestamp)
│
├── progress: 0 (number)
│
└── status: "active" (string)
```

### Key Observations:
- Enrollments are stored as subcollections under each user document
- Each enrollment document contains information about a user's enrollment in a specific course
- The `courseId` field references the course the user is enrolled in
- The `completedLessons` array tracks which lessons the user has completed
- The `progress` field (0 in this example) tracks the user's overall progress in the course
- The `enrolledBy` map contains metadata about how the enrollment was created
- Timestamps are used to track when the user enrolled and last accessed the course

## Common Code Patterns

When working with user data in the codebase, you'll likely encounter these common patterns:

### Creating User Documents
```typescript
// CORRECT: Creating a new user
await setDoc(doc(db, 'users', userId), {
  email: userEmail,
  displayName: userName,
  createdAt: serverTimestamp(),
  // other fields...
});

// CORRECT: Creating a user profile
await setDoc(doc(db, 'userProfiles', userId), {
  bio: '',
  photoURL: defaultPhotoURL,
  // other fields...
});

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'users', 'user123'); // BAD PRACTICE
```

### Updating User Documents
```typescript
// CORRECT: Updating a user profile
await updateDoc(doc(db, 'userProfiles', userId), {
  bio: newBio,
  photoURL: newPhotoURL,
});

// CORRECT: Tracking course progress
await setDoc(doc(db, 'users', userId, 'progress', courseId), {
  lastAccessed: serverTimestamp(),
  completedLessons: [],
  currentLesson: firstLessonId,
});
```

### Querying User Documents
```typescript
// CORRECT: Get a specific user
const userDoc = await getDoc(doc(db, 'users', userId));

// CORRECT: Get all enrollments for a user
const enrollmentsQuery = query(
  collection(db, 'users', userId, 'enrollments'),
  orderBy('enrolledAt', 'desc')
);

// CORRECT: Get user progress for a specific course
const progressDoc = await getDoc(doc(db, 'users', userId, 'progress', courseId));
```

This document will be updated with additional Firestore paths as they are provided.
