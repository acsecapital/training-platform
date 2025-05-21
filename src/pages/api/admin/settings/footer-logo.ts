import {NextApiRequest, NextApiResponse } from 'next';
import {doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    // Get the logo URL and path from the request body
    const {logoUrl, logoPath } = req.body;

    if (!logoUrl || !logoPath) {
      return res.status(400).json({error: 'Logo URL and path are required'});
  }

    // Get the settings document
    const settingsDocRef = doc(firestore, 'settings', 'site');
    const settingsDoc = await getDoc(settingsDocRef);

    if (settingsDoc.exists()) {
      // Update the existing settings document
      await updateDoc(settingsDocRef, {
        footerLogo: {
          url: logoUrl,
          path: logoPath,
          updatedAt: new Date().toISOString(),
      },
    });
  } else {
      // Create a new settings document
      await setDoc(settingsDocRef, {
        footerLogo: {
          url: logoUrl,
          path: logoPath,
          updatedAt: new Date().toISOString(),
      },
    });
  }

    return res.status(200).json({success: true, message: 'Footer logo updated successfully'});
} catch (error) {
    console.error('Error updating footer logo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({error: 'Internal server error', message: errorMessage });
}
}
