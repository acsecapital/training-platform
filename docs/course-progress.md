# Course Progress Data Structure

This document outlines the Firestore data structure for tracking user progress in courses within the training platform.

## Overview

Course progress data is stored in multiple locations to support different access patterns and ensure data consistency:

1. **Primary Source**: `courseProgress` collection (root level)
2. **Legacy/Secondary Source**: `users/{userId}/courseProgress/{courseId}` subcollection
3. **Enrollment Reference**: `users/{userId}/enrollments/{courseId}` subcollection

The `courseProgress` collection is the single source of truth for progress data, while the other locations may contain derived or legacy data.

## Collection: `courseProgress`

### Document ID Format

Documents in the `courseProgress` collection use a composite ID format:
```
{userId}_{courseId}
```

For example: `user123_course456`

### Document Structure

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | The ID of the user |
| `courseId` | String | The ID of the course |
| `startDate` | String (ISO date) | When the user started the course |
| `lastAccessDate` | String (ISO date) | When the user last accessed the course |
| `lastUpdated` | Timestamp | Server timestamp of the last update |
| `completed` | Boolean | Whether the course is completed |
| `completedDate` | String (ISO date) | When the course was completed (null if not completed) |
| `overallProgress` | Number | Overall progress percentage (0-100) |
| `completedLessons` | Array<String> | Array of completed lesson IDs in format `{moduleId}_{lessonId}` |
| `completedModules` | Array<String> | Array of completed module IDs |
| `lessonProgress` | Map | Map of lesson progress (see below) |
| `moduleProgress` | Map | Map of module progress (see below) |
| `quizScores` | Map | Map of quiz scores by quiz ID |
| `quizAttempts` | Map | Map of quiz attempt counts by quiz ID |
| `timeSpent` | Number | Total time spent in seconds |
| `revoked` | Boolean | Whether the enrollment has been revoked |
| `revokedBy` | String | ID of admin who revoked the enrollment |
| `revokedAt` | String (ISO date) | When the enrollment was revoked |
| `revokedNote` | String | Note explaining why the enrollment was revoked |
| `adminOverride` | Map | Details of the last admin override (see below) |

### Lesson Progress Structure

The `lessonProgress` field is a map where keys are in the format `{moduleId}_{lessonId}` and values have the following structure:

```javascript
{
  "moduleId": "module123",
  "lessonId": "lesson456",
  "completed": true,
  "progress": 100,
  "completedDate": "2023-05-15T14:30:00.000Z",
  "lastAccessDate": "2023-05-15T14:30:00.000Z",
  "timeSpent": 300, // seconds
  "adminOverride": {
    "action": "mark_lesson_complete",
    "adminId": "admin789",
    "timestamp": "2023-05-15T14:30:00.000Z",
    "note": "Manually marked as completed by admin"
}
}
```

### Module Progress Structure

The `moduleProgress` field is a map where keys are module IDs and values have the following structure:

```javascript
{
  "completed": true,
  "progress": 100,
  "completedDate": "2023-05-15T14:30:00.000Z",
  "lastAccessDate": "2023-05-15T14:30:00.000Z",
  "timeSpent": 1200, // seconds
  "adminOverride": {
    "action": "mark_module_complete",
    "adminId": "admin789",
    "timestamp": "2023-05-15T14:30:00.000Z",
    "note": "Manually marked as completed by admin"
}
}
```

### Admin Override Structure

The `adminOverride` field contains information about the last administrative override:

```javascript
{
  "action": "mark_complete", // or "reset_progress", "revoke", etc.
  "adminId": "admin789",
  "timestamp": "2023-05-15T14:30:00.000Z",
  "note": "Manually marked as completed by admin"
}
```

## Collection: `users/{userId}/enrollments/{courseId}`

This collection stores enrollment information, including a subset of progress data.

### Document Structure

| Field | Type | Description |
|-------|------|-------------|
| `courseId` | String | The ID of the course |
| `courseName` | String | The name of the course |
| `enrolledAt` | Timestamp | When the user enrolled |
| `enrolledBy` | Map | Information about how the user was enrolled |
| `lastAccessedAt` | String (ISO date) | When the user last accessed the course |
| `progress` | Number | Overall progress percentage (0-100) |
| `status` | String | Status of enrollment: "active", "completed", "revoked" |
| `completedLessons` | Array<String> | Array of completed lesson IDs |
| `adminOverride` | Map | Details of the last admin override |

## Collection: `users/{userId}/courseProgress/{courseId}`

This is a legacy collection that may contain older progress data. It should be kept in sync with the main `courseProgress` collection.

### Document Structure

Similar to the main `courseProgress` collection but may have fewer fields or slightly different structure.

## Relationships and Consistency

- When updating progress in the `courseProgress` collection, the corresponding enrollment document should also be updated.
- The `syncUserCourseProgress` utility function ensures consistency between these collections.
- If a course is marked as completed, the `overallProgress` should be set to 100 and the `status` in the enrollment document should be set to "completed".

## Calculating Progress

Overall progress is calculated based on the number of completed lessons:

```
overallProgress = (completedLessons.length / totalLessonsInCourse) * 100
```

Module progress is calculated based on the number of completed lessons in that module:

```
moduleProgress = (completedLessonsInModule.length / totalLessonsInModule) * 100
```

## Admin Overrides

Administrators can override progress at three levels:

1. **Course Level**: Mark a course as completed, reset progress, or revoke enrollment
2. **Module Level**: Mark a module as completed or reset module progress
3. **Lesson Level**: Mark a lesson as completed or reset lesson progress

When an admin override occurs, the `adminOverride` field is updated with details about the action.

## Example Document

```javascript
// Document ID: user123_course456
{
  "userId": "user123",
  "courseId": "course456",
  "startDate": "2023-05-01T10:00:00.000Z",
  "lastAccessDate": "2023-05-15T14:30:00.000Z",
  "lastUpdated": Timestamp(2023, 5, 15, 14, 30, 0),
  "completed": true,
  "completedDate": "2023-05-15T14:30:00.000Z",
  "overallProgress": 100,
  "completedLessons": ["module1_lesson1", "module1_lesson2", "module2_lesson1"],
  "completedModules": ["module1", "module2"],
  "lessonProgress": {
    "module1_lesson1": {
      "moduleId": "module1",
      "lessonId": "lesson1",
      "completed": true,
      "progress": 100,
      "completedDate": "2023-05-10T11:20:00.000Z",
      "lastAccessDate": "2023-05-10T11:20:00.000Z",
      "timeSpent": 300
  },
    "module1_lesson2": {
      "moduleId": "module1",
      "lessonId": "lesson2",
      "completed": true,
      "progress": 100,
      "completedDate": "2023-05-12T13:45:00.000Z",
      "lastAccessDate": "2023-05-12T13:45:00.000Z",
      "timeSpent": 450
  },
    "module2_lesson1": {
      "moduleId": "module2",
      "lessonId": "lesson1",
      "completed": true,
      "progress": 100,
      "completedDate": "2023-05-15T14:30:00.000Z",
      "lastAccessDate": "2023-05-15T14:30:00.000Z",
      "timeSpent": 600,
      "adminOverride": {
        "action": "mark_lesson_complete",
        "adminId": "admin789",
        "timestamp": "2023-05-15T14:30:00.000Z",
        "note": "User reported completion but system didn't record it"
    }
  }
},
  "moduleProgress": {
    "module1": {
      "completed": true,
      "progress": 100,
      "completedDate": "2023-05-12T13:45:00.000Z",
      "lastAccessDate": "2023-05-12T13:45:00.000Z",
      "timeSpent": 750
  },
    "module2": {
      "completed": true,
      "progress": 100,
      "completedDate": "2023-05-15T14:30:00.000Z",
      "lastAccessDate": "2023-05-15T14:30:00.000Z",
      "timeSpent": 600,
      "adminOverride": {
        "action": "mark_module_complete",
        "adminId": "admin789",
        "timestamp": "2023-05-15T14:30:00.000Z",
        "note": "User completed all content but system didn't mark module as complete"
    }
  }
},
  "quizScores": {
    "quiz1": 85,
    "quiz2": 92
},
  "quizAttempts": {
    "quiz1": 1,
    "quiz2": 2
},
  "timeSpent": 1350,
  "adminOverride": {
    "action": "mark_complete",
    "adminId": "admin789",
    "timestamp": "2023-05-15T14:30:00.000Z",
    "note": "User completed all required content"
}
}
```
