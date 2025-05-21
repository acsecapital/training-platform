# Media Firestore Database Structure

This document illustrates the structure of the media-related collections in the Firestore database used in the training platform and how these paths are represented in the codebase.

## Path Representation in Code

**IMPORTANT: The specific document IDs shown in this document (like "IyfoN96jFDfSinw5MYcf") are for illustration purposes only. Never hardcode these specific IDs in development. Always use variables or dynamic references.**

Firestore paths shown in this document can be accessed in the codebase using various patterns. Here are common ways these paths are represented in code:

```typescript
// Direct path reference
const mediaRef = doc(db, 'media', mediaId);

// Collection references
const mediaCollectionRef = collection(db, 'media');

// Path strings
const mediaPath = `media/${mediaId}`;
```

When reviewing the codebase, look for these patterns to understand how the data is being accessed and manipulated.

## Media Collection

### Media Document: `/media/IyfoN96jFDfSinw5MYcf`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const mediaRef = doc(db, 'media', mediaId);

// CORRECT: Using variables in queries
const q = query(collection(db, 'media'), where('category', '==', 'course'));

// CORRECT: Using variables in path strings
const mediaPath = `media/${mediaId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'media', 'IyfoN96jFDfSinw5MYcf'); // BAD PRACTICE
```

```
IyfoN96jFDfSinw5MYcf
│
├── category: "course" (string)
│
├── createdAt: "2025-04-27T04:08:22.785Z" (string)
│
├── name: "photodune-2392898-server-m.jpg" (string)
│
├── path: "media/1745726901369_photodune_2392898_server_m.jpg" (string)
│
├── size: 326470 (number)
│
├── type: "image/jpeg" (string)
│
└── url: "https://storage.googleapis.com/gen-lang-client-00697788-5c2c3.firebasestorage.app/media/1745726901369_photodune_2392898_server_m.jpg" (string)
```

### Key Observations:
- Media documents store metadata about files uploaded to the platform
- Each media document has a `category` field (e.g., "course") to indicate its usage context
- The `name` field stores the original filename
- The `path` field contains the storage path within Firebase Storage
- The `size` field stores the file size in bytes
- The `type` field indicates the MIME type of the file
- The `url` field contains the complete URL to access the file from Firebase Storage
- Note that the actual file content is stored in Firebase Storage, not in Firestore

## Common Code Patterns

When working with media data in the codebase, you'll likely encounter these common patterns:

### Creating Media Documents
```typescript
// CORRECT: Creating a new media document after file upload
const storageRef = ref(storage, `media/${timestamp}_${file.name.replace(/\s+/g, '_')}`);
await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(storageRef);

await setDoc(doc(db, 'media', mediaId), {
  name: file.name,
  path: storageRef.fullPath,
  url: downloadURL,
  type: file.type,
  size: file.size,
  category: category,
  createdAt: serverTimestamp(),
});
```

### Querying Media Documents
```typescript
// CORRECT: Get media by category
const q = query(
  collection(db, 'media'),
  where('category', '==', 'course')
);

// CORRECT: Get media by type
const imagesQuery = query(
  collection(db, 'media'),
  where('type', '==', 'image/jpeg')
);

// CORRECT: Get recent media
const recentMediaQuery = query(
  collection(db, 'media'),
  orderBy('createdAt', 'desc'),
  limit(10)
);
```

### Deleting Media
```typescript
// CORRECT: Deleting media (both document and storage file)
const mediaDoc = await getDoc(doc(db, 'media', mediaId));
const mediaData = mediaDoc.data();

// Delete from Storage
const storageRef = ref(storage, mediaData.path);
await deleteObject(storageRef);

// Delete from Firestore
await deleteDoc(doc(db, 'media', mediaId));
```

This document will be updated with additional Firestore paths as they are provided.
