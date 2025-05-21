"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = {enumerable: true, get: function() {return m[k]; } };
  }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", {enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", {value: true });
exports.processNotification = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Make sure admin is initialized in index.ts or initialize it here
const firestore = admin.firestore();
// Process notifications when they're created
exports.processNotification = functions.firestore
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
  }
    catch (error) {
        console.error('Error processing notification:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return snapshot.ref.update({
            error: errorMessage,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  }
});
//# sourceMappingURL=notificationFunctions.js.map