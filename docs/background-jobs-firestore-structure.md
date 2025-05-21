# Background Jobs Firestore Database Structure

This document illustrates the structure of the background jobs-related collections in the Firestore database used in the training platform and how these paths are represented in the codebase.

## Path Representation in Code

**IMPORTANT: The specific document IDs shown in this document (like "07D2PIu9jJg0vz1mXO1z") are for illustration purposes only. Never hardcode these specific IDs in development. Always use variables or dynamic references.**

Firestore paths shown in this document can be accessed in the codebase using various patterns. Here are common ways these paths are represented in code:

```typescript
// Direct path reference
const jobRef = doc(db, 'backgroundJobs', jobId);

// Collection references
const jobsCollectionRef = collection(db, 'backgroundJobs');

// Path strings
const jobPath = `backgroundJobs/${jobId}`;
```

When reviewing the codebase, look for these patterns to understand how the data is being accessed and manipulated.

## Background Jobs Collection

### Background Job Document: `/backgroundJobs/07D2PIu9jJg0vz1mXO1z`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const jobRef = doc(db, 'backgroundJobs', jobId);

// CORRECT: Using variables in queries
const q = query(collection(db, 'backgroundJobs'), where('type', '==', 'process_notifications'));

// CORRECT: Using variables in path strings
const jobPath = `backgroundJobs/${jobId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'backgroundJobs', '07D2PIu9jJg0vz1mXO1z'); // BAD PRACTICE
```

```
07D2PIu9jJg0vz1mXO1z
│
├── completedAt: "2025-04-27T15:07:23.171Z" (string)
│
├── createdAt: "2025-04-27T05:39:36.941Z" (string)
│
├── metadata (map) - empty
│
├── result: 0 (number)
│
├── scheduledFor: "2025-04-27T05:39:36.941Z" (string)
│
├── startedAt: "2025-04-27T15:07:22.720Z" (string)
│
├── status: "completed" (string)
│
└── type: "process_notifications" (string)
```

### Key Observations:
- Background job documents track asynchronous tasks in the system
- Each job has a `type` field (e.g., "process_notifications") that indicates the kind of task
- The job lifecycle is tracked through multiple timestamp fields:
  - `createdAt`: When the job was created
  - `scheduledFor`: When the job was scheduled to run
  - `startedAt`: When the job actually started execution
  - `completedAt`: When the job finished execution
- The `status` field ("completed" in this example) tracks the current state of the job
- The `result` field can store the outcome of the job (0 in this example)
- The `metadata` map can store additional contextual information (empty in this example)

## Common Code Patterns

When working with background jobs in the codebase, you'll likely encounter these common patterns:

### Creating Background Job Documents
```typescript
// CORRECT: Creating a new background job
await setDoc(doc(db, 'backgroundJobs', jobId), {
  type: 'process_notifications',
  status: 'pending',
  createdAt: serverTimestamp(),
  scheduledFor: scheduledTime || serverTimestamp(),
  metadata: {
    // Job-specific parameters
    targetUsers: userIds,
    notificationType: 'course_reminder',
  },
});
```

### Updating Job Status
```typescript
// CORRECT: Marking a job as started
await updateDoc(doc(db, 'backgroundJobs', jobId), {
  status: 'in_progress',
  startedAt: serverTimestamp(),
});

// CORRECT: Marking a job as completed
await updateDoc(doc(db, 'backgroundJobs', jobId), {
  status: 'completed',
  completedAt: serverTimestamp(),
  result: processedCount,
});

// CORRECT: Marking a job as failed
await updateDoc(doc(db, 'backgroundJobs', jobId), {
  status: 'failed',
  completedAt: serverTimestamp(),
  error: errorMessage,
});
```

### Querying Jobs
```typescript
// CORRECT: Get pending jobs
const pendingJobsQuery = query(
  collection(db, 'backgroundJobs'),
  where('status', '==', 'pending'),
  orderBy('scheduledFor', 'asc')
);

// CORRECT: Get jobs by type
const notificationJobsQuery = query(
  collection(db, 'backgroundJobs'),
  where('type', '==', 'process_notifications')
);

// CORRECT: Get recently completed jobs
const recentJobsQuery = query(
  collection(db, 'backgroundJobs'),
  where('status', '==', 'completed'),
  orderBy('completedAt', 'desc'),
  limit(10)
);
```

This document will be updated with additional Firestore paths as they are provided.
