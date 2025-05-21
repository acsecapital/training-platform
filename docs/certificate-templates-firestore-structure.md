# Certificate Templates Firestore Database Structure

This document illustrates the structure of the certificate templates-related collections in the Firestore database used in the training platform and how these paths are represented in the codebase.

## Path Representation in Code

**IMPORTANT: The specific document IDs shown in this document (like "2L3EGRKQVCFi8YYeSxHx") are for illustration purposes only. Never hardcode these specific IDs in development. Always use variables or dynamic references.**

Firestore paths shown in this document can be accessed in the codebase using various patterns. Here are common ways these paths are represented in code:

```typescript
// Direct path reference
const templateRef = doc(db, 'certificateTemplates', templateId);

// Collection references
const templatesCollectionRef = collection(db, 'certificateTemplates');

// Path strings
const templatePath = `certificateTemplates/${templateId}`;
```

When reviewing the codebase, look for these patterns to understand how the data is being accessed and manipulated.

## Certificate Templates Collection

### Certificate Template Document: `/certificateTemplates/2L3EGRKQVCFi8YYeSxHx`

**Code Representation:**
```typescript
// CORRECT: Using variables for IDs
const templateRef = doc(db, 'certificateTemplates', templateId);

// CORRECT: Using variables in queries
const q = query(collection(db, 'certificateTemplates'), where('isDefault', '==', true));

// CORRECT: Using variables in path strings
const templatePath = `certificateTemplates/${templateId}`;

// NEVER DO THIS: Hardcoding specific IDs
// const badRef = doc(db, 'certificateTemplates', '2L3EGRKQVCFi8YYeSxHx'); // BAD PRACTICE
```

```
2L3EGRKQVCFi8YYeSxHx
│
├── createdAt: 25 April 2025 at 19:23:00 UTC-4 (timestamp)
│
├── description: "This is the Closer College TT Graduation Certificate for those who have passed the LIPS Sales System Course." (string)
│
├── fields (array)
│   ├── 0 (map) - studentName field
│   │   ├── alignment: "center" (string)
│   │   ├── fontColor: "#000000" (string)
│   │   ├── fontFamily: "'Monte Carlo Pro', 'Edwardian Script ITC', cursive" (string)
│   │   ├── fontSize: 40 (number)
│   │   ├── fontWeight: "normal" (string)
│   │   ├── height: 10 (number)
│   │   ├── id: "field-1745627461405" (string)
│   │   ├── type: "studentName" (string)
│   │   ├── width: 50 (number)
│   │   ├── x: 23.4791787299749 (number)
│   │   └── y: 40.89027938152551 (number)
│   │
│   ├── 1 (map) - completionDate field
│   │   ├── alignment: "center" (string)
│   │   ├── fontColor: "#000000" (string)
│   │   ├── fontFamily: "Arial, Helvetica, sans-serif" (string)
│   │   ├── fontSize: 16 (number)
│   │   ├── fontWeight: "normal" (string)
│   │   ├── height: 8 (number)
│   │   ├── id: "field-1745627750255" (string)
│   │   ├── type: "completionDate" (string)
│   │   ├── width: 14 (number)
│   │   ├── x: 21.671728540828525 (number)
│   │   └── y: 70.8990627820948 (number)
│   │
│   ├── 2 (map) - issuerName field
│   │   ├── alignment: "center" (string)
│   │   ├── fontColor: "#000000" (string)
│   │   ├── fontFamily: "Arial, Helvetica, sans-serif" (string)
│   │   ├── fontSize: 16 (number)
│   │   ├── fontWeight: "normal" (string)
│   │   ├── height: 8 (number)
│   │   ├── id: "field-1745627864811" (string)
│   │   ├── type: "issuerName" (string)
│   │   ├── width: 15 (number)
│   │   ├── x: 64.12070546226597 (number)
│   │   └── y: 79.57189471092664 (number)
│   │
│   ├── 3 (map) - certificateId field
│   │   ├── alignment: "center" (string)
│   │   ├── fontColor: "#000000" (string)
│   │   ├── fontFamily: "Arial, Helvetica, sans-serif" (string)
│   │   ├── fontSize: 16 (number)
│   │   ├── fontWeight: "normal" (string)
│   │   ├── height: 8 (number)
│   │   ├── id: "field-1745627937946" (string)
│   │   ├── type: "certificateId" (string)
│   │   ├── width: 20 (number)
│   │   ├── x: 2.5031364601428305 (number)
│   │   └── y: 88.3181280709602 (number)
│   │
│   ├── 4 (map) - qrCode field
│   │   ├── alignment: "center" (string)
│   │   ├── fontColor: "#000000" (string)
│   │   ├── fontFamily: "Helvetica" (string)
│   │   ├── fontSize: 16 (number)
│   │   ├── fontWeight: "normal" (string)
│   │   ├── height: 10 (number)
│   │   ├── id: "field-1745627985597" (string)
│   │   ├── type: "qrCode" (string)
│   │   ├── width: 8 (number)
│   │   ├── x: 2.7184665122563225 (number)
│   │   └── y: 69.19764067034922 (number)
│   │
│   └── 5 (map) - image field (signature)
│       ├── alignment: "center" (string)
│       ├── fontColor: "#000000" (string)
│       ├── fontFamily: "Helvetica" (string)
│       ├── fontSize: 16 (number)
│       ├── fontWeight: "normal" (string)
│       ├── height: 10 (number)
│       ├── id: "field-1745643954328" (string)
│       ├── imageUrl: "https://storage.googleapis.com/gen-lang-client-00697788-5c2c3.firebasestorage.app/media/1745643255223_MySignature.png" (string)
│       ├── type: "image" (string)
│       ├── width: 20 (number)
│       ├── x: 61.979166666666664 (number)
│       └── y: 68.88888888888889 (number)
│
├── isDefault: true (Boolean)
│
├── isPdfTemplate: true (Boolean)
│
├── name: "Closer College TT Graduation Certificate" (string)
│
├── pdfUrl: "https://storage.googleapis.com/gen-lang-client-00697788-5c2c3.firebasestorage.app/certificate-templates/1745623379059_Closer College Certificate 1.pdf" (string)
│
├── storagePath: "certificate-templates/1745623379059_Closer College Certificate 1.pdf" (string)
│
└── updatedAt: 26 April 2025 at 01:07:05 UTC-4 (timestamp)
```

### Key Observations:
- Certificate template documents store the layout and design information for certificates
- Each template has a PDF background (`pdfUrl` and `storagePath`)
- The `fields` array contains detailed positioning and styling information for each element on the certificate
- Different field types include:
  - `studentName`: The name of the student receiving the certificate
  - `completionDate`: When the certificate was issued
  - `issuerName`: The organization issuing the certificate
  - `certificateId`: A unique identifier for the certificate
  - `qrCode`: A QR code for verification
  - `image`: Images like signatures
- Each field has precise positioning (`x`, `y`), dimensions (`width`, `height`), and styling properties
- The `isDefault` flag indicates if this is the default template
- The `isPdfTemplate` flag indicates this template uses a PDF background

## Common Code Patterns

When working with certificate templates in the codebase, you'll likely encounter these common patterns:

### Creating Certificate Templates
```typescript
// CORRECT: Creating a new certificate template
await setDoc(doc(db, 'certificateTemplates', templateId), {
  name: templateName,
  description: templateDescription,
  pdfUrl: pdfDownloadURL,
  storagePath: pdfStoragePath,
  isDefault: false,
  isPdfTemplate: true,
  fields: [],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

### Adding Fields to Templates
```typescript
// CORRECT: Adding a field to a template
await updateDoc(doc(db, 'certificateTemplates', templateId), {
  fields: arrayUnion({
    id: `field-${Date.now()}`,
    type: 'studentName',
    x: 25,
    y: 40,
    width: 50,
    height: 10,
    alignment: 'center',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 24,
    fontWeight: 'bold',
    fontColor: '#000000',
}),
  updatedAt: serverTimestamp(),
});
```

### Querying Templates
```typescript
// CORRECT: Get the default template
const defaultTemplateQuery = query(
  collection(db, 'certificateTemplates'),
  where('isDefault', '==', true),
  limit(1)
);

// CORRECT: Get all templates
const allTemplatesQuery = query(
  collection(db, 'certificateTemplates'),
  orderBy('name', 'asc')
);
```

### Generating Certificates
```typescript
// CORRECT: Using a template to generate a certificate
const templateDoc = await getDoc(doc(db, 'certificateTemplates', templateId));
const templateData = templateDoc.data();

// Generate certificate using template data
const certificate = {
  templateId: templateId,
  userId: userId,
  courseId: courseId,
  courseName: courseName,
  issueDate: serverTimestamp(),
  certificateId: generateUniqueId(),
  verificationUrl: `https://example.com/verify/${certificateId}`,
  // Additional data needed for the certificate
};

await setDoc(doc(db, 'certificates', certificateId), certificate);
```

This document will be updated with additional Firestore paths as they are provided.
