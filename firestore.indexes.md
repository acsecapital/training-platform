# Required Firestore Indexes for Enrollment Filters

To support all the filtering capabilities in the enrollment management system, you'll need to create the following composite indexes in your Firestore database.

## Basic Filters

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "status", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "courseId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

## Date Range Filters

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledAt", "order": "ASCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

## Combined Status and Course Filters

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "status", "order": "ASCENDING" },
    {"fieldPath": "courseId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

## Organization Filters

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledBy.companyId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledBy.teamId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

## Combined Organization and Status Filters

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledBy.companyId", "order": "ASCENDING" },
    {"fieldPath": "status", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledBy.teamId", "order": "ASCENDING" },
    {"fieldPath": "status", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

## Combined Organization and Course Filters

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledBy.companyId", "order": "ASCENDING" },
    {"fieldPath": "courseId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledBy.teamId", "order": "ASCENDING" },
    {"fieldPath": "courseId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "DESCENDING" }
  ]
}
```

## Date Range with Other Filters

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "status", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "ASCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "courseId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "ASCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledBy.companyId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "ASCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "enrollments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "enrolledBy.teamId", "order": "ASCENDING" },
    {"fieldPath": "enrolledAt", "order": "ASCENDING" }
  ]
}
```

## How to Create These Indexes

1. Go to the Firebase Console
2. Navigate to Firestore Database
3. Click on the "Indexes" tab
4. Click "Add Index"
5. For "Collection ID", enter the path to your enrollments subcollection (e.g., "users/{userId}/enrollments")
6. Add the fields as specified in each index above
7. Click "Create"

Alternatively, you can use the Firebase CLI to deploy these indexes all at once.
