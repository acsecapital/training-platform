import {NextApiRequest, NextApiResponse } from 'next';
import {getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import {app as firebaseApp } from '@/services/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    // Get the storage instance
    const storage = getStorage(firebaseApp);

    // Create a test file in the media folder
    const testRef = ref(storage, 'media/test.txt');

    // Upload a simple text file
    await uploadString(testRef, 'This is a test file to verify storage permissions.');

    // Try to get the download URL
    const url = await getDownloadURL(testRef);

    return res.status(200).json({
      success: true,
      message: 'Storage permissions are working correctly',
      url
  });
} catch (error) {
    console.error('Error testing storage permissions:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? (error as {code: string}).code : 'unknown_error';

    return res.status(500).json({
      error: 'Storage permission test failed',
      message: errorMessage,
      code: errorCode
  });
}
}
