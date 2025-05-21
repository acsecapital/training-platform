# Feedback Firestore Database Structure

This document illustrates the structure of the feedback-related collections in the Firestore database used in the training platform and how these paths are represented in the codebase.

## Path Representation in Code

**IMPORTANT: The specific document IDs shown in this document (like "19KWAjlFurw8uITFCSCx") are for illustration purposes only. Never hardcode these specific IDs in development. Always use variables or dynamic references.**

Firestore paths shown in this document can be accessed in the codebase using various patterns. Here are common ways these paths are represented in code:

```typescript
// Direct path reference
const feedbackRef = doc(db, 'feedback', feedbackId);

// Collection references
const feedbackCollectionRef = collection(db, 'feedback');

// Path strings
const feedbackPath = `feedback/${feedbackId}`;
```

When reviewing the codebase, look for these patterns to understand how the data is being accessed and manipulated.

## Feedback Collection

### Feedback Document: `/feedback/19KWAjlFurw8uITFCSCx`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const feedbackRef = doc(db, 'feedback', feedbackId);

// CORRECT: Using variables in queries
const q = query(collection(db, 'feedback'), where('category', '==', 'content'));

// CORRECT: Using variables in path strings
const feedbackPath = `feedback/${feedbackId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'feedback', '19KWAjlFurw8uITFCSCx'); // BAD PRACTICE
```

```
19KWAjlFurw8uITFCSCx
│
├── category: "content" (string)
│
├── createdAt: 30 April 2025 at 19:20:59 UTC-4 (timestamp)
│
├── feedback: "The content is fairly decent." (string)
│
├── metadata (map) - empty
│
├── rating: 4 (number)
│
├── source: "main_layout" (string)
│
├── status: "reviewed" (string)
│
├── userEmail: "egcharle@gmail.com" (string)
│
├── userId: "ooLqfbct2uOG70u7DItDsuH53c62" (string)
│
└── userName: "Eric Charles" (string)
```

### Key Observations:
- Feedback documents store user feedback about various aspects of the platform
- Each feedback document has a `category` field (e.g., "content") to indicate what the feedback is about
- The `rating` field (4 in this example) provides a numerical assessment
- The `feedback` field contains the actual text feedback from the user
- The `source` field indicates where in the application the feedback was submitted from
- The `status` field ("reviewed" in this example) tracks the administrative review status
- User information is stored directly in the document (userId, userEmail, userName)
- The `metadata` map can store additional contextual information (empty in this example)

## Common Code Patterns

When working with feedback data in the codebase, you'll likely encounter these common patterns:

### Creating Feedback Documents
```typescript
// CORRECT: Creating a new feedback entry
await setDoc(doc(db, 'feedback', feedbackId), {
  category: 'content',
  feedback: userFeedbackText,
  rating: userRating,
  source: currentPage,
  status: 'new',
  userId: currentUser.uid,
  userEmail: currentUser.email,
  userName: currentUser.displayName,
  metadata: {}, // Optional additional context
  createdAt: serverTimestamp(),
});
```

### Updating Feedback Status
```typescript
// CORRECT: Updating feedback status after review
await updateDoc(doc(db, 'feedback', feedbackId), {
  status: 'reviewed',
  reviewedAt: serverTimestamp(),
  reviewedBy: adminId,
  adminNotes: notes,
});
```

### Querying Feedback
```typescript
// CORRECT: Get feedback by category
const q = query(
  collection(db, 'feedback'),
  where('category', '==', 'content')
);

// CORRECT: Get unreviewed feedback
const unreviewedQuery = query(
  collection(db, 'feedback'),
  where('status', '==', 'new')
);

// CORRECT: Get feedback from a specific user
const userFeedbackQuery = query(
  collection(db, 'feedback'),
  where('userId', '==', userId)
);

// CORRECT: Get recent feedback
const recentFeedbackQuery = query(
  collection(db, 'feedback'),
  orderBy('createdAt', 'desc'),
  limit(10)
);
```

This document will be updated with additional Firestore paths as they are provided.
