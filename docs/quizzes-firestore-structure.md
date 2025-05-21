# Quizzes Firestore Database Structure

This document illustrates the structure of the quiz-related collections in the Firestore database used in the training platform and how these paths are represented in the codebase.

## Path Representation in Code

**IMPORTANT: The specific document IDs shown in this document (like "QQkqt6BgmjykIdITU3Al") are for illustration purposes only. Never hardcode these specific IDs in development. Always use variables or dynamic references.**

Firestore paths shown in this document can be accessed in the codebase using various patterns. Here are common ways these paths are represented in code:

```typescript
// Direct path reference
const quizRef = doc(db, 'quizzes', quizId);
const quizAttemptRef = doc(db, 'users', userId, 'quizAttempts', attemptId);

// Collection references
const quizzesRef = collection(db, 'quizzes');
const quizAttemptsRef = collection(db, 'users', userId, 'quizAttempts');

// Path strings
const quizPath = `quizzes/${quizId}`;
const quizAttemptPath = `users/${userId}/quizAttempts/${attemptId}`;
```

When reviewing the codebase, look for these patterns to understand how the data is being accessed and manipulated.

## Quizzes Collection

### Quiz Document: `/quizzes/QQkqt6BgmjykIdITU3Al`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const quizRef = doc(db, 'quizzes', quizId);

// CORRECT: Using variables in queries
const q = query(collection(db, 'quizzes'), where('courseId', '==', courseId));

// CORRECT: Using variables in path strings
const quizPath = `quizzes/${quizId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'quizzes', 'QQkqt6BgmjykIdITU3Al'); // BAD PRACTICE
```

```
QQkqt6BgmjykIdITU3Al
│
├── attempts: 0 (number)
│
├── courseId: "iOeBbyberFwrRoOLmb4j" (string)
│
├── courseName: "HMB Sands" (string)
│
├── createdAt: 2 May 2025 at 12:59:23 UTC-4 (timestamp)
│
├── description: "This is the exam to see whether anyone was paying attention and to provide them with a completion certificate." (string)
│
├── id: "7bf5258b-3231-4576-b6c8-7e847315ee1a" (string)
│
├── moduleId: "pk36lduZ6BKdiVxHC2uq" (string)
│
├── moduleName: "Diving 101" (string)
│
├── passingScore: 70 (number)
│
├── questions (array)
│   ├── 0 (map)
│   │   ├── correctOptionId: "7519940a-471b-4c88-afc4-176f0ad8afd0" (string)
│   │   ├── explanation: "The way you dive into a pool is forward with your hands stretched out. You will be hurt doing it any other way in most cases." (string)
│   │   ├── id: "772b2439-c8c2-425e-8a3a-e27ab8ca7913" (string)
│   │   ├── options (array)
│   │   │   ├── 0 (map)
│   │   │   │   ├── id: "a71fdb2e-0f96-4169-8eca-fa04a83fc81d" (string)
│   │   │   │   └── text: "Sideways with your hands stretched out?" (string)
│   │   │   ├── 1 (map)
│   │   │   │   ├── id: "3588fbaa-12a1-4354-87ca-18b3da9aa37e" (string)
│   │   │   │   └── text: "Backwards with your hands stretched out?" (string)
│   │   │   ├── 2 (map)
│   │   │   │   ├── id: "de2206a7-7aeb-4cc8-bbbb-cd22867852f2" (string)
│   │   │   │   └── text: "With your hands together and stretched out?" (string)
│   │   │   └── 3 (map)
│   │   │       ├── id: "7519940a-471b-4c88-afc4-176f0ad8afd0" (string)
│   │   │       └── text: "Forward with your hands stretched out?" (string)
│   │   ├── points: 4 (number)
│   │   ├── text: "How do you dive into a pool" (string)
│   │   └── type: "multiple-choice" (string)
│   ├── 1 (map)
│   │   ├── correctOptionId: "d5e2a0c8-298b-409a-a406-a6835ed998b6" (string)
│   │   ├── explanation: "This is going to make you sink to the bottom of the pool." (string)
│   │   ├── id: "5685061f-960d-4c99-b532-4ee2e1b6cd1a" (string)
│   │   ├── options (array)
│   │   │   ├── 0 (map)
│   │   │   │   ├── id: "1f0c9ab9-42ae-4a57-ae25-f6e9e5d090a8" (string)
│   │   │   │   └── text: "True" (string)
│   │   │   └── 1 (map)
│   │   │       ├── id: "d5e2a0c8-298b-409a-a406-a6835ed998b6" (string)
│   │   │       └── text: "False" (string)
│   │   ├── points: 5 (number)
│   │   ├── text: "The safest way to dive into a pool is with concrete tied to your feet." (string)
│   │   └── type: "true-false" (string)
│   └── 2 (map)
│       ├── correctOptionId: "" (string)
│       ├── explanation: "This answer may vary because everyone's facility is different in their community." (string)
│       ├── id: "c69d500e-51c8-4d4f-8fb6-81a180b3909b" (string)
│       ├── options (array) - empty
│       ├── points: 3 (number)
│       ├── text: "Tell me how you would dive into the river at your nearest facility at your community." (string)
│       └── type: "text" (string)
│
├── questionsCount: 3 (number)
│
├── status: "draft" (string)
│
├── timeLimit: 2 (number)
│
├── title: "Diving Exam" (string)
│
└── updatedAt: 2 May 2025 at 12:59:23 UTC-4 (timestamp)
```

### Key Observations:
- Quiz documents contain detailed information about assessments in the training platform
- Each quiz is associated with a specific course and module (via `courseId` and `moduleId`)
- Quizzes have a `passingScore` (70 in this example) that determines success criteria
- The `questions` array contains complex nested objects for different question types:
  - Multiple-choice questions with options and a correct option ID
  - True/false questions with two options
  - Text questions with no predefined options
- Each question has an explanation that can be shown after answering
- Questions have point values that can vary (3-5 points in this example)
- The `questionsCount` field (3) matches the actual number of questions in the array
- Quizzes have a `timeLimit` field (2 in this example, likely in minutes)
- The `status` field ("draft") indicates the quiz's publication state

## Common Code Patterns

When working with quiz data in the codebase, you'll likely encounter these common patterns:

### Creating Quiz Documents
```typescript
// CORRECT: Creating a new quiz
await setDoc(doc(db, 'quizzes', quizId), {
  title: 'New Quiz',
  description: 'Quiz description',
  courseId: courseId,
  courseName: courseName,
  moduleId: moduleId,
  moduleName: moduleName,
  questions: [],
  questionsCount: 0,
  passingScore: 70,
  timeLimit: 10,
  status: 'draft',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

### Updating Quiz Documents
```typescript
// CORRECT: Updating a quiz
await updateDoc(doc(db, 'quizzes', quizId), {
  title: 'Updated Quiz Title',
  description: 'Updated description',
  updatedAt: serverTimestamp(),
});

// CORRECT: Adding a question to a quiz
await updateDoc(doc(db, 'quizzes', quizId), {
  questions: arrayUnion(newQuestion),
  questionsCount: increment(1),
  updatedAt: serverTimestamp(),
});
```

### Querying Quiz Documents
```typescript
// CORRECT: Get quizzes for a specific course
const q = query(
  collection(db, 'quizzes'),
  where('courseId', '==', courseId)
);

// CORRECT: Get quizzes for a specific module
const moduleQuizzesQuery = query(
  collection(db, 'quizzes'),
  where('moduleId', '==', moduleId)
);

// CORRECT: Get published quizzes only
const publishedQuizzesQuery = query(
  collection(db, 'quizzes'),
  where('status', '==', 'published')
);
```

This document will be updated with additional Firestore paths as they are provided.
