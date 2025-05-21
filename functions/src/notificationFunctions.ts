import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Make sure admin is initialized in index.ts or initialize it here
const firestore = admin.firestore();

// Process notifications when they're created
export const processNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const notification = snapshot.data();
    const userId = notification.userId;

    try {
      // Get user's notification preferences
      const userRef = firestore.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error(`User ${userId} not found`);
      }

      const userData = userDoc.data();
      if (!userData) {
        throw new Error(`User data for ${userId} is undefined`);
      }

      const preferences = userData.notificationPreferences || {
        email: true,
        push: false
      };

      // If email notifications are enabled, queue an email
      if (preferences.email) {
        await firestore.collection('emailQueue').add({
          to: userData.email,
          subject: notification.title,
          html: `<p>${notification.message}</p>`,
          text: notification.message,
          metadata: {
            notificationId: snapshot.id,
            notificationType: notification.type
          },
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          scheduledFor: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // If push notifications are enabled, send a push notification
      if (preferences.push && userData.fcmTokens) {
        // Implementation for push notifications using FCM
      }

      // Update notification status
      return snapshot.ref.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error: unknown) {
      console.error('Error processing notification:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return snapshot.ref.update({
        error: errorMessage,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });


