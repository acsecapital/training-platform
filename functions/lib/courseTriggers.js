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
exports.processEmailQueue = exports.onCoursePublished = exports.onCourseCompleted = exports.onModuleDelete = exports.onModuleCreate = exports.processNotification = exports.generateCertificate = void 0;
const functions = __importStar(require("firebase-functions")); // v1 SDK for triggers like onCreate/onDelete/onUpdate/onRequest
// Note: v2 imports might be needed if you exclusively use v2 features like onSchedule v2, but mixing can be complex.
// Sticking mainly to v1 for simplicity based on original code structure.
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger")); // v2 logger is generally preferred
const cors = require("cors"); // Use this version of cors  
// Initialize Firebase Admin SDK ONLY ONCE
admin.initializeApp();
// Get Firestore instance
const firestore = admin.firestore();
// === CORS Handler ===
// Initialize CORS middleware
const corsHandler = cors({origin: true });
// === API Endpoints (Moved from apiEndpoints.ts) ===
exports.generateCertificate = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        try {
            logger.info("generateCertificate called", {body: request.body, headers: request.headers }); // Use logger
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                logger.warn("generateCertificate: Unauthorized - Missing or invalid Bearer token.");
                response.status(401).send({error: 'Unauthorized});
                return;
          }
            const idToken = authHeader.split('Bearer ')[1];
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
          }
            catch (authError) {
                logger.error("generateCertificate: Token verification failed:", authError);
                response.status(401).send({error: 'Unauthorized - Invalid Token});
                return;
          }
            const userId = decodedToken.uid;
            const {courseId } = request.body;
            if (!courseId || typeof courseId !== 'string') {// Added type check
                logger.warn(`generateCertificate: Bad Request - Missing or invalid courseId. Received: ${courseId}`);
                response.status(400).send({error: 'Missing or invalid courseId});
                return;
          }
            const progressRef = firestore.collection('courseProgress')
                .where('userId', '==', userId)
                .where('courseId', '==', courseId)
                .where('completed', '==', true)
                .limit(1);
            const progressSnapshot = await progressRef.get();
            if (progressSnapshot.empty) {
                logger.warn(`generateCertificate: Forbidden - Course ${courseId} not completed by user ${userId}.`);
                response.status(403).send({error: 'Course not completed});
                return;
          }
            // Generate a unique enough ID (consider UUID library for production)
            const certificateId = `CERT-${userId.substring(0, 6)}-${courseId.substring(0, 6)}-${Date.now()}`;
            const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase(); // Example verification code
            logger.info(`generateCertificate: Generating certificate ${certificateId} for user ${userId}, course ${courseId}`);
            await firestore.collection('certificates').doc(certificateId).set({
                userId,
                courseId,
                certificateId,
                issuedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: null,
                verificationCode // Use a more secure code in production
          });
            response.status(200).send({
                success: true,
                certificateId,
                // Provide a conceptual download URL, actual implementation might differ
                downloadUrl: `/api/certificates/${certificateId}/download` // Example, depends on client/API structure
          });
      }
        catch (error) {
            logger.error('Error generating certificate:', error);
            response.status(500).send({error: 'Internal server error});
      }
  });
});
// === Notification Functions (Moved from notificationFunctions.ts) ===
exports.processNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snapshot, context) => {
    const notificationId = context.params.notificationId;
    const notification = snapshot.data();
    if (!notification || !notification.userId) {
        logger.error(`processNotification (${notificationId}): Invalid notification data or missing userId.`);
        // Update status to 'failed' maybe?
        // await snapshot.ref.update({status: 'failed', error: 'Missing userId});
        return;
  }
    const userId = notification.userId;
    logger.info(`processNotification (${notificationId}): Processing notification for user ${userId}.`);
    try {
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new Error(`User ${userId} not found`);
      }
        const userData = userDoc.data();
        if (!userData) {
            throw new Error(`User data for ${userId} is undefined`);
      }
        // Use optional chaining and provide defaults for preferences
        const preferences = userData.notificationPreferences || {email: true, push: false };
        const userEmail = userData.email; // Assuming email field exists
        // Queue Email if enabled
        if (preferences.email && userEmail) {
            logger.info(`processNotification (${notificationId}): Queuing email for user ${userId}.`);
            await firestore.collection('emailQueue').add({
                to: userEmail,
                subject: notification.title || 'New Notification',
                html: `<p>${notification.message || 'You have a new notification.'}</p>`,
                text: notification.message || 'You have a new notification.',
                metadata: {
                    notificationId: snapshot.id,
                    notificationType: notification.type || 'general' // Use default type
              },
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                scheduledFor: admin.firestore.FieldValue.serverTimestamp() // Send immediately
          });
      }
        else if (preferences.email && !userEmail) {
            logger.warn(`processNotification (${notificationId}): Email preference enabled for user ${userId}, but no email address found.`);
      }
        // TODO: Implement Push Notification Logic if needed
        if (preferences.push && userData.fcmTokens) {
            logger.info(`processNotification (${notificationId}): Sending push notification for user ${userId}.`);
            // Example: const tokens = userData.fcmTokens; // Assuming fcmTokens is an array
            // await admin.messaging().sendToDevice(tokens, {notification: {title: notification.title, body: notification.message } });
      }
        logger.info(`processNotification (${notificationId}): Successfully processed.`);
        await snapshot.ref.update({
            processed: true,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            error: null // Clear any previous error
      });
  }
    catch (error) {// Catch specific errors if possible
        logger.error(`processNotification (${notificationId}): Error processing:`, error);
        try {
            await snapshot.ref.update({
                status: 'failed',
                error: error.message || 'Unknown processing error',
                processedAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
        catch (updateError) {
            logger.error(`processNotification (${notificationId}): Error updating status to failed:`, updateError);
      }
  }
});
// === Course Trigger Functions (Module Counter + Your Existing v2 Triggers) ===
// Helper function to update module count
async function updateCourseModuleCount(courseId) {
    if (!courseId) {
        logger.error("updateCourseModuleCount: Course ID is missing.");
        return;
  }
    const courseDocRef = firestore.collection("courses").doc(courseId);
    const modulesSubcollectionRef = courseDocRef.collection("modules");
    try {
        const modulesSnapshot = await modulesSubcollectionRef.get();
        const count = modulesSnapshot.size;
        await courseDocRef.update({modules: count }); // Ensure field name matches frontend expectation
        logger.info(`Updated module count for course ${courseId} to ${count}.`);
  }
    catch (error) {
        // Check if error is because the parent doc doesn't exist (might happen in rare cases)
        if (error.code === 5) {// Firestore error code for NOT_FOUND
            logger.warn(`updateCourseModuleCount: Parent course document ${courseId} not found. Cannot update count.`);
      }
        else {
            logger.error(`Error updating module count for course ${courseId}:`, error);
      }
  }
}
// v1 Trigger: When a module document is CREATED
exports.onModuleCreate = functions.firestore
    .document("courses/{courseId}/modules/{moduleId}")
    .onCreate(async (_snapshot, context) => {
    const courseId = context.params.courseId;
    logger.info(`Module created in course ${courseId}, triggering count update.`);
    await updateCourseModuleCount(courseId);
});
// v1 Trigger: When a module document is DELETED
exports.onModuleDelete = functions.firestore
    .document("courses/{courseId}/modules/{moduleId}")
    .onDelete(async (_snapshot, context) => {
    const courseId = context.params.courseId;
    logger.info(`Module deleted in course ${courseId}, triggering count update.`);
    await updateCourseModuleCount(courseId);
});
// Your existing v2 trigger: onCourseCompleted
// Keep using v2 syntax if it works for you and is needed for specific v2 features
exports.onCourseCompleted = functions.firestore // Use v1 document trigger syntax here for consistency if preferred
    .document('courseProgress/{progressId}')
    .onUpdate(async (change, context) => {
    const progressId = context.params.progressId;
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) {
        logger.error(`onCourseCompleted (${progressId}): Before or After data is undefined`);
        return;
  }
    // Check if course was just completed
    if (!before.completed && after.completed) {
        logger.info(`onCourseCompleted (${progressId}): Detected completion.`);
        try {
            const {userId, courseId } = after;
            if (!userId || !courseId) {
                logger.error(`onCourseCompleted (${progressId}): Missing userId or courseId.`);
                return;
          }
            const courseDoc = await firestore.collection('courses').doc(courseId).get();
            if (!courseDoc.exists) {
                logger.error(`onCourseCompleted (${progressId}): Course ${courseId} not found`);
                return;
          }
            const courseData = courseDoc.data();
            if (!courseData) {
                logger.error(`onCourseCompleted (${progressId}): Course data missing for ${courseId}`);
                return;
          }
            const userDoc = await firestore.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                logger.error(`onCourseCompleted (${progressId}): User ${userId} not found`);
                return;
          }
            const userData = userDoc.data();
            if (!userData) {
                logger.error(`onCourseCompleted (${progressId}): User data missing for ${userId}`);
                return;
          }
            const certificateId = `CERT-${userId.substring(0, 6)}-${courseId.substring(0, 6)}-${Date.now()}`;
            const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            logger.info(`onCourseCompleted (${progressId}): Generating certificate ${certificateId}.`);
            await firestore.collection('certificates').doc(certificateId).set({
                userId, courseId, courseName: courseData.title || 'Untitled Course',
                userName: userData.displayName || 'Student', certificateId,
                issuedAt: admin.firestore.FieldValue.serverTimestamp(), expiresAt: null,
                verificationCode, status: 'active', instructor: courseData.instructor || null,
                instructorTitle: courseData.instructorTitle || null
          });
            await change.after.ref.update({
                certificateId, certificateIssueDate: admin.firestore.FieldValue.serverTimestamp()
          });
            logger.info(`onCourseCompleted (${progressId}): Certificate generated and progress updated.`);
      }
        catch (error) {
            logger.error(`onCourseCompleted (${progressId}): Error generating certificate:`, error);
      }
  }
});
// Your existing v2 trigger: onCoursePublished
// Keep using v2 syntax if it works for you and is needed for specific v2 features
exports.onCoursePublished = functions.firestore // Use v1 document trigger syntax here for consistency if preferred
    .document('courses/{courseId}')
    .onCreate(async (snapshot, context) => {
    const courseId = context.params.courseId;
    const courseData = snapshot.data();
    if (!courseData) {
        logger.error(`onCoursePublished (${courseId}): Course data is undefined.`);
        return;
  }
    logger.info(`onCoursePublished (${courseId}): Checking status: ${courseData.status}`);
    if (courseData.status === 'published') {
        try {
            logger.info(`onCoursePublished (${courseId}): Queuing notification.`);
            await firestore.collection('notificationQueue').add({
                type: 'new_course_available', courseId: snapshot.id,
                courseName: courseData.title || 'Untitled Course',
                courseDescription: courseData.description || '',
                status: 'pending', createdAt: admin.firestore.FieldValue.serverTimestamp(),
                processedAt: null
          });
            logger.info(`onCoursePublished (${courseId}): Notification queued.`);
      }
        catch (error) {
            logger.error(`onCoursePublished (${courseId}): Error queueing notification:`, error);
      }
  }
});
// === Scheduled Functions (Moved from index.ts originally) ===
// Helper function to send email (implement with your email provider)
async function sendEmail(emailData) {
    // Implementation with nodemailer or other email service placeholder
    logger.info('Sending email placeholder:', {to: emailData?.to, subject: emailData?.subject });
    // Simulate sending time
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async work
    // In real scenario, handle potential errors from email provider
    if (emailData?.to === "error@example.com") {// Simulate an error case
        throw new Error("Simulated email sending failure");
  }
    return Promise.resolve();
}
// Example scheduled function to process email queue (Using v1 syntax for simplicity)
exports.processEmailQueue = functions.pubsub
    .schedule('every 5 minutes') // Common v1 schedule syntax
    .onRun(async (context) => {
    const eventAgeMs = Date.now() - Date.parse(context.timestamp);
    const eventMaxAgeMs = 60 * 1000; // 1 minute tolerance for execution start
    if (eventAgeMs > eventMaxAgeMs) {
        logger.warn(`processEmailQueue: Dropping event ${context.eventId} with age ${eventAgeMs} ms.`);
        return; // Prevent duplicate runs on retries
  }
    logger.info("processEmailQueue: Running scheduled job.");
    const emailQueueRef = firestore.collection('emailQueue');
    let emailsProcessed = 0;
    try {
        const pendingEmails = await emailQueueRef
            .where('status', '==', 'pending')
            // .where('scheduledFor', '<=', admin.firestore.Timestamp.now()) // Careful: Might need index
            .orderBy('scheduledFor', 'asc') // Process oldest first
            .limit(50) // Process in batches
            .get();
        if (pendingEmails.empty) {
            logger.info("processEmailQueue: No pending emails to process.");
            return;
      }
        logger.info(`processEmailQueue: Found ${pendingEmails.size} pending emails.`);
        const batch = firestore.batch();
        const sendPromises = [];
        pendingEmails.forEach((doc) => {
            const email = doc.data();
            const ref = doc.ref;
            logger.info(`processEmailQueue: Processing email ${doc.id}`);
            batch.update(ref, {
                status: 'processing',
                processedAt: admin.firestore.FieldValue.serverTimestamp()
          });
            sendPromises.push(sendEmail(email)
                .then(() => {
                logger.info(`processEmailQueue: Successfully sent email ${doc.id}`);
                batch.update(ref, {
                    status: 'sent',
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    error: admin.firestore.FieldValue.delete() // Clear previous error
              });
          })
                .catch((error) => {
                logger.error(`processEmailQueue: Failed to send email ${doc.id}:`, error);
                batch.update(ref, {
                    status: 'failed',
                    error: error.message || 'Unknown send error',
                    attempts: admin.firestore.FieldValue.increment(1) // Increment attempts
              });
          }));
            emailsProcessed++;
      });
        await batch.commit(); // Commit 'processing' status updates first
        await Promise.all(sendPromises); // Wait for emails to send and update statuses
        logger.info(`processEmailQueue: Finished processing batch of ${emailsProcessed} emails.`);
  }
    catch (error) {
        logger.error("processEmailQueue: Error running job:", error);
  }
});
//# sourceMappingURL=courseTriggers.js.map