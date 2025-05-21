import {NextApiRequest, NextApiResponse } from 'next';
import {verifyCertificate } from '@/services/certificateService';

/**
 * API endpoint to verify a certificate
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    const {verificationCode } = req.body as { verificationCode: string };

    if (!verificationCode) {
      return res.status(400).json({error: 'Verification code is required'});
    }

    // Get IP address and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Verify certificate
    const result = await verifyCertificate(
      verificationCode,
      typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
      typeof userAgent === 'string' ? userAgent : userAgent[0]
    );

    // Return result
    res.status(200).json(result);
} catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({error: 'Failed to verify certificate'});
}
}
