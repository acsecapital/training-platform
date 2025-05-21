import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

const corsHandler = cors({origin: true });
const firestore = admin.firestore();

// Generate certificate endpoint
export const generateCertificate = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Verify authentication
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.status(401).send({error: 'Unauthorized'});
        return;
    }
      
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
      
      // Get request data
      const {courseId } = request.body;
      if (!courseId) {
        response.status(400).send({error: 'Missing courseId'});
        return;
    }
      
      // Check if user completed the course
      const progressRef = firestore.collection('courseProgress')
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .where('completed', '==', true)
        .limit(1);
      
      const progressSnapshot = await progressRef.get();
      if (progressSnapshot.empty) {
        response.status(403).send({error: 'Course not completed'});
        return;
    }
      
      // Generate certificate (implementation details would go here)
      const certificateId = `CERT-${userId.substring(0, 6)}-${courseId.substring(0, 6)}-${Date.now()}`;
      
      // Store certificate in Firestore
      await firestore.collection('certificates').doc(certificateId).set({
        userId,
        courseId,
        certificateId,
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: null, // Set expiration if needed
        verificationCode: certificateId // Use a more secure code in production
    });
      
      response.status(200).send({
        success: true, 
        certificateId,
        downloadUrl: `/api/certificates/${certificateId}/download`
    });
  } catch (error) {
      console.error('Error generating certificate:', error);
      response.status(500).send({error: 'Internal server error'});
    }
  });
});
