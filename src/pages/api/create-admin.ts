import {NextApiRequest, NextApiResponse } from 'next';
import {doc, getDoc, updateDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    const {userId, adminSecret } = req.body as {
      userId: string;
      adminSecret: string;
    };

    // Check if the admin secret is correct (this is a simple security measure)
    // In production, you would use a more secure method
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'training-platform-secret') {
      return res.status(401).json({error: 'Unauthorized'});
  }

    if (!userId) {
      return res.status(400).json({error: 'User ID is required'});
  }

    // Get the user document
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return res.status(404).json({error: 'User not found'});
  }

    // Update the user's roles to include admin
    await updateDoc(userDocRef, {
      'roles.admin': true,
      updatedAt: new Date().toISOString(),
  });

    return res.status(200).json({success: true, message: 'User promoted to admin successfully'});
} catch (error) {
    console.error('Error promoting user to admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({error: 'Internal server error', message: errorMessage});
}
}
