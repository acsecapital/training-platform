import {NextApiRequest, NextApiResponse } from 'next';
import {withAuth } from '@/utils/apiAuth';
import {doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

/**
 * Interface for authenticated user
 */
interface AuthenticatedUser {
  id: string;
  displayName?: string;
  email?: string;
}

/**
 * Interface for certificate data
 */
interface CertificateData {
  userId: string;
  courseName: string;
  pdfUrl: string;
  verificationCode: string;
  sharedWith?: string[];
}

/**
 * API endpoint to share a certificate via email
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    const {certificateId, email, message, pdfUrl, verificationUrl } = req.body as {
      certificateId: string;
      email: string;
      message?: string;
      pdfUrl?: string;
      verificationUrl?: string;
    };

    // Cast the user from the request - first cast to unknown to avoid type errors
    const user = ((req as unknown) as { user: AuthenticatedUser }).user;

    if (!certificateId || !email) {
      return res.status(400).json({error: 'Certificate ID and email are required'});
    }

    // Get certificate details
    const certificateRef = doc(firestore, 'certificates', certificateId);
    const certificateDoc = await getDoc(certificateRef);

    if (!certificateDoc.exists()) {
      return res.status(404).json({error: 'Certificate not found'});
    }

    const certificateData = certificateDoc.data() as CertificateData;

    // Check if the certificate belongs to the user
    if (certificateData.userId !== user.id) {
      return res.status(403).json({error: 'You do not have permission to share this certificate'});
    }

    // Send email
    await sendCertificateEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      subject: `Certificate Shared: ${certificateData.courseName}`,
      userName: user.displayName || 'A user',
      courseName: certificateData.courseName,
      message: message || '',
      pdfUrl: pdfUrl || certificateData.pdfUrl,
      verificationUrl: verificationUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/verify-certificate/${certificateData.verificationCode}`
  });

    // Log the share
    const shareId = uuidv4();
    const shareRef = doc(firestore, 'certificateShares', shareId);

    await setDoc(shareRef, {
      id: shareId,
      certificateId,
      sharedBy: user.id,
      sharedTo: email,
      message: message || '',
      method: 'email',
      sharedAt: serverTimestamp(),
      timestamp: new Date().getTime()
  });

    // Update certificate sharedWith array
    const sharedWith: string[] = certificateData.sharedWith || [];
    if (!sharedWith.includes(email)) {
      sharedWith.push(email);
      await setDoc(certificateRef, { sharedWith }, { merge: true });
    }

    res.status(200).json({success: true });
} catch (error) {
    console.error('Error sharing certificate:', error);
    res.status(500).json({error: 'Failed to share certificate'});
}
}

/**
 * Send certificate email
 */
async function sendCertificateEmail(options: {
  to: string;
  from: string;
  subject: string;
  userName: string;
  courseName: string;
  message: string;
  pdfUrl: string;
  verificationUrl: string;
}) {
  // Create email transport
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
  }
});

  // Create email content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
      }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
      }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid #dee2e6;
      }
        .content {
          padding: 20px;
      }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
          border-top: 1px solid #dee2e6;
      }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 20px;
      }
        .message {
          background-color: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #007bff;
          margin: 20px 0;
      }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Certificate Shared</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>${options.userName} has shared their certificate for completing <strong>${options.courseName}</strong> with you.</p>

          ${options.message ? `
          <div class="message">
            <p><em>${options.message}</em></p>
          </div>
          ` : ''}

          <p>You can view and verify this certificate using the link below:</p>
          <p style="text-align: center;">
            <a href="${options.verificationUrl}" class="button">View Certificate</a>
          </p>

          ${options.pdfUrl ? `
          <p>You can also download the certificate as a PDF:</p>
          <p style="text-align: center;">
            <a href="${options.pdfUrl}" class="button" style="background-color: #28a745;">Download PDF</a>
          </p>
          ` : ''}

          <p>Thank you!</p>
        </div>
        <div class="footer">
          <p>This email was sent from our certificate sharing system. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Training Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email
  await transport.sendMail({
    to: options.to,
    from: options.from,
    subject: options.subject,
    html
});
}

// Wrap the handler with authentication middleware
export default withAuth(handler);
