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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod };
};
Object.defineProperty(exports, "__esModule", {value: true });
exports.generateCertificate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const corsHandler = (0, cors_1.default)({origin: true });
const firestore = admin.firestore();
// Generate certificate endpoint
exports.generateCertificate = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        try {
            // Verify authentication
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                response.status(401).send({error: 'Unauthorized});
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            // Get request data
            const {courseId } = request.body;
            if (!courseId) {
                response.status(400).send({error: 'Missing courseId});
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
                response.status(403).send({error: 'Course not completed});
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
                expiresAt: null,
                verificationCode: certificateId // Use a more secure code in production
            });
            response.status(200).send({
                success: true,
                certificateId,
                downloadUrl: `/api/certificates/${certificateId}/download`
            });
        }
        catch (error) {
            console.error('Error generating certificate:', error);
            response.status(500).send({error: 'Internal server error});
        }
    });
});
//# sourceMappingURL=apiEndpoints.js.map