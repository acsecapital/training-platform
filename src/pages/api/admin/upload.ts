import {NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import admin from 'firebase-admin';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
},
};

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    const form = formidable({multiples: true });

    // Parse the form
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(new Error(err.message));
        resolve([fields, files]);
    });
  });

    // Get the file and category
    const file = files.file;
    const category = fields.category || 'general';
    console.log('Received files:', files);
    console.log('Category:', category);

    if (!file) {
      return res.status(400).json({error: 'No file uploaded'});
  }

    // Handle both single file and array of files
    const fileToProcess = Array.isArray(file) ? file[0] : file;

    // Read the file
    const fileContent = fs.readFileSync(fileToProcess.filepath);

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const timestamp = Date.now();
    const fileName = fileToProcess.originalFilename?.replace(/[^a-zA-Z0-9.]/g, '_') || 'unnamed';
    const destination = `media/${timestamp}_${fileName}`;

    const fileUpload = bucket.file(destination);
    await fileUpload.save(fileContent, {
      metadata: {
        contentType: fileToProcess.mimetype || 'application/octet-stream',
    },
  });

    // Make the file publicly accessible
    await fileUpload.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;

    // Return success response
    return res.status(200).json({
      success: true,
      file: {
        name: fileToProcess.originalFilename,
        url: publicUrl,
        path: destination,
        type: fileToProcess.mimetype,
        size: fileToProcess.size,
        category: category,
    },
  });
} catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Failed to upload file',
      message: errorMessage
  });
}
}
