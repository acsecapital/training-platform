# Firestore Database Structure

This document illustrates the structure of the Firestore database used in the training platform and how these paths are represented in the codebase.

## Path Representation in Code

**IMPORTANT: The specific document IDs shown in this document (like "iOeBbyberFwrRoOLmb4j") are for illustration purposes only. Never hardcode these specific IDs in development. Always use variables or dynamic references.**

Firestore paths shown in this document can be accessed in the codebase using various patterns. Here are common ways these paths are represented in code:

```typescript
// Direct path reference
const courseRef = doc(db, 'courses', courseId);
const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
const lessonRef = doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId);
const categoryRef = doc(db, 'categories', categoryId);

// Collection references
const coursesRef = collection(db, 'courses');
const modulesRef = collection(db, 'courses', courseId, 'modules');
const lessonsRef = collection(db, 'courses', courseId, 'modules', moduleId, 'lessons');
const categoriesRef = collection(db, 'categories');

// Path strings
const coursePath = `courses/${courseId}`;
const modulePath = `courses/${courseId}/modules/${moduleId}`;
const lessonPath = `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;
const categoryPath = `categories/${categoryId}`;
```

When reviewing the codebase, look for these patterns to understand how the data is being accessed and manipulated.

## Courses Collection

### Course Document: `/courses/iOeBbyberFwrRoOLmb4j`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const courseRef = doc(db, 'courses', courseId);

// CORRECT: Using variables in queries
const q = query(collection(db, 'courses'), where(documentId(), '==', courseId));

// CORRECT: Using variables in path strings
const coursePath = `courses/${courseId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'courses', 'iOeBbyberFwrRoOLmb4j'); // BAD PRACTICE
```

```
iOeBbyberFwrRoOLmb4j
│
├── categoryIds (array)
│   └── 0: "hj1WhIu1OfLF8uZJvRDT" (string)
│
├── createdAt: "2025-04-30T13:56:55.698Z" (string)
│
├── description: "- ModuleList component exists and is used in course module pages - ModuleForm component implemented for create/edit operations" (string)
│
├── duration: "2h 45m" (string)
│
├── durationDetails (map)
│   ├── hours: 2 (number)
│   ├── minutes: 45 (number)
│   ├── seconds: 0 (number)
│   └── totalSeconds: 9900 (number)
│
├── instructor: "Senior Sales Trainer" (string)
│
├── instructorAvatar: "" (string)
│
├── instructorBio: "The man, the myth, the legend. How does he do it? He does it with grace and flare. And aside from that he helps you pass your exams." (string)
│
├── instructorTitle: "Senior Sales Trainer" (string)
│
├── isFree: false (Boolean)
│
├── lessons: 3 (number)
│
├── level: "Advanced" (string)
│
├── modules: 0 (number)
│
├── modulesList (array)
│   ├── 0: "FWUPNc3sjtnOSwuM0hw8" (string)
│   ├── 1: "lOtGuUEy4ZjYazdq1Cou" (string)
│   └── 2: "pk36lduZ6BKdiVxHC2uq" (string)
│
├── price: 49.99 (number)
│
├── status: "published" (string)
│
├── thumbnail: "" (string)
│
├── title: "HMB Sands" (string)
│
├── trialPeriod: "7 days" (string)
│
├── updatedAt: "2025-05-10T02:22:16.186Z" (string)
│
└── whatYouWillLearn (array)
    ├── 0: "Learn to Fish" (string)
    ├── 1: "Learn to Ride" (string)
    ├── 2: "Learn to Collide" (string)
    └── 3: "Learn to Subside" (string)
```

### Key Observations:
- The course has a `modules` field with a value of 0 (number)
- The course has a `modulesList` array containing 3 module IDs
- There's a discrepancy between the `modules` count (0) and the actual number of modules in `modulesList` (3)
- The course has a `lessons` field with a value of 3 (number)
- The course has instructor information fields:
  - `instructor`: The name of the instructor
  - `instructorTitle`: The instructor's title (e.g., "Senior Sales Trainer")
  - `instructorBio`: A biography of the instructor
  - `instructorAvatar`: A URL to the instructor's profile image
- The `price` field is stored as a number (49.99)

## Modules Collection

### Module Document: `/courses/nJDli18b8ti2NJXAhx2D/modules/ni1FzB3nIzNKchefbwmt`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);

// CORRECT: Collection reference with variables
const modulesRef = collection(db, 'courses', courseId, 'modules');

// CORRECT: Path string with variables
const modulePath = `courses/${courseId}/modules/${moduleId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'courses', 'nJDli18b8ti2NJXAhx2D', 'modules', 'ni1FzB3nIzNKchefbwmt'); // BAD PRACTICE
```

```
ni1FzB3nIzNKchefbwmt
│
├── availableFrom: "2025-04-30T00:15" (string)
│
├── availableTo: "2025-05-01T00:16" (string)
│
├── completionPercentageRequired: 100 (number)
│
├── createdAt: "2025-04-30T04:16:25.138Z" (string)
│
├── description: "We eat a lot by eating everything we can see." (string)
│
├── id: "ni1FzB3nIzNKchefbwmt" (string)
│
├── instructor: "Guest Lecturer" (string) // Optional - overrides course instructor
│
├── instructorAvatar: "https://example.com/guest-avatar.jpg" (string) // Optional
│
├── instructorBio: "Guest lecturer specializing in this specific module topic." (string) // Optional
│
├── instructorTitle: "Guest Specialist" (string) // Optional
│
├── isRequired: true (Boolean)
│
├── lessonCount: 2 (number)
│
├── order: 0 (number)
│
├── prerequisites (array) - empty
│
├── status: "published" (string)
│
├── title: "How to eat a lot" (string)
│
└── updatedAt: "2025-05-09T16:21:03.335Z" (string)
```

### Key Observations:
- Modules are stored as subcollections under their parent course
- Each module has a `lessonCount` field (2 in this example)
- Modules have an `order` field to determine their sequence in the course
- Modules can have prerequisites (empty array in this example)
- Modules can have optional instructor fields that override the course instructor:
  - `instructor`: The name of the module-specific instructor
  - `instructorTitle`: The module-specific instructor's title
  - `instructorBio`: A biography of the module-specific instructor
  - `instructorAvatar`: A URL to the module-specific instructor's profile image

## Lessons Collection

### Lesson Document: `/courses/nJDli18b8ti2NJXAhx2D/modules/ni1FzB3nIzNKchefbwmt/lessons/RpnakW091oHDRPDp8nJR`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const lessonRef = doc(
  db,
  'courses', courseId,
  'modules', moduleId,
  'lessons', lessonId
);

// CORRECT: Collection reference with variables
const lessonsRef = collection(
  db,
  'courses', courseId,
  'modules', moduleId,
  'lessons'
);

// CORRECT: Path string with variables
const lessonPath = `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(
//   db,
//   'courses', 'nJDli18b8ti2NJXAhx2D',
//   'modules', 'ni1FzB3nIzNKchefbwmt',
//   'lessons', 'RpnakW091oHDRPDp8nJR'
// ); // BAD PRACTICE
```

```
RpnakW091oHDRPDp8nJR
│
├── content: "<p>This is a great way to eat and full your belly for a week without spending a dime on food.</p>" (string)
│
├── createdAt: "2025-05-04T14:32:24.260Z" (string)
│
├── description: "Buy a Subway and get 12 cards" (string)
│
├── duration: 0 (number)
│
├── instructor: "Special Guest" (string) // Optional - overrides module and course instructors
│
├── instructorAvatar: "https://example.com/special-guest.jpg" (string) // Optional
│
├── instructorBio: "Special guest for this specific lesson only." (string) // Optional
│
├── instructorTitle: "Industry Expert" (string) // Optional
│
├── order: 0 (number)
│
├── status: "published" (string)
│
├── title: "Buy a Subway" (string)
│
├── type: "text" (string)
│
└── updatedAt: "2025-05-04T14:32:24.260Z" (string)
```

### Key Observations:
- Lessons are stored as subcollections under their parent module
- Lessons have an `order` field to determine their sequence in the module
- Lessons have a `type` field (in this case "text")
- Lessons have a `content` field that can contain HTML
- Lessons have a `duration` field (0 in this example)
- Lessons can have optional instructor fields that override both module and course instructors:
  - `instructor`: The name of the lesson-specific instructor
  - `instructorTitle`: The lesson-specific instructor's title
  - `instructorBio`: A biography of the lesson-specific instructor
  - `instructorAvatar`: A URL to the lesson-specific instructor's profile image

## Categories Collection

### Category Document: `/categories/HrpZ0Uqy8QcNg55OuNFJ`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const categoryRef = doc(db, 'categories', categoryId);

// CORRECT: Using variables in queries
const q = query(collection(db, 'categories'), where(documentId(), '==', categoryId));

// CORRECT: Using variables in path strings
const categoryPath = `categories/${categoryId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'categories', 'HrpZ0Uqy8QcNg55OuNFJ'); // BAD PRACTICE
```

```
HrpZ0Uqy8QcNg55OuNFJ
│
├── courseCount: 0 (number)
│
├── createdAt: "2025-05-02T19:54:37.150Z" (string)
│
├── description: "This is a race to the top" (string)
│
├── name: "Fresh Start" (string)
│
├── slug: "race" (string)
│
└── updatedAt: "2025-05-02T19:54:37.150Z" (string)
```

### Key Observations:
- Categories have a `courseCount` field to track the number of courses in each category
- Categories have a `slug` field for URL-friendly identifiers
- The `courseCount` is 0 in this example, which may indicate a new category or a potential data inconsistency

## Common Code Patterns

When working with this data in the codebase, you'll likely encounter these common patterns:

### Creating Documents
```typescript
// Creating a new course
await setDoc(doc(db, 'courses', courseId), {
  title: 'New Course',
  description: 'Course description',
  modules: 0,
  modulesList: [],
  lessons: 0,
  // Instructor fields
  instructor: 'Instructor Name',
  instructorTitle: 'Instructor Title',
  instructorBio: 'Instructor biography text',
  instructorAvatar: 'https://example.com/avatar.jpg',
  // other fields...
});

// Creating a new module
await setDoc(doc(db, 'courses', courseId, 'modules', moduleId), {
  title: 'New Module',
  description: 'Module description',
  order: 0,
  lessonCount: 0,
  // Optional module-specific instructor fields
  instructor: 'Module-specific Instructor',
  instructorTitle: 'Module-specific Title',
  instructorBio: 'Module-specific biography',
  instructorAvatar: 'https://example.com/module-instructor.jpg',
  // other fields...
});
```

### Updating Documents
```typescript
// Updating a course
await updateDoc(doc(db, 'courses', courseId), {
  title: 'Updated Title',
  description: 'Updated description',
  // Updating instructor fields
  instructor: 'Updated Instructor Name',
  instructorTitle: 'Updated Instructor Title',
  instructorBio: 'Updated instructor biography',
  instructorAvatar: 'https://example.com/updated-avatar.jpg',
});

// Incrementing module count
await updateDoc(doc(db, 'courses', courseId), {
  modules: increment(1),
  modulesList: arrayUnion(moduleId),
});
```

### Querying Documents
```typescript
// Get all published courses
const q = query(
  collection(db, 'courses'),
  where('status', '==', 'published')
);

// Get modules in order
const modulesQuery = query(
  collection(db, 'courses', courseId, 'modules'),
  orderBy('order', 'asc')
);

// Get lessons in a module
const lessonsQuery = query(
  collection(db, 'courses', courseId, 'modules', moduleId, 'lessons'),
  orderBy('order', 'asc')
);
```

This document will be updated with additional Firestore paths as they are provided.
