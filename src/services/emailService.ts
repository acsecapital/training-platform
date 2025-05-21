import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string; // Keep as string, it's a MIME type
}>;
  cc?: string | string[];
  bcc?: string | string[];
  metadata?: Record<string, unknown>;
}

/**
 * Send an email by adding it to the email queue in Firestore
 * The actual sending will be handled by a Cloud Function or backend service
 */
export const sendEmail = async (options: EmailOptions): Promise<string> => {
  try {
    // Validate email options
    if (!options.to) {
      throw new Error('Recipient email is required');
  }

    if (!options.subject) {
      throw new Error('Email subject is required');
  }

    if (!options.html) {
      throw new Error('Email HTML content is required');
  }

    // Convert to array if single email
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const cc = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [];
    const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [];

    // Create email document in queue
    const emailQueueRef = collection(firestore, 'emailQueue');
    const docRef = await addDoc(emailQueueRef, {
      to: recipients,
      cc,
      bcc,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
      from: options.from || 'Closer College <noreply@closercollegett.com>',
      replyTo: options.replyTo || 'support@closercollegett.com',
      attachments: options.attachments || [],
      metadata: options.metadata || {},
      status: 'pending',
      createdAt: serverTimestamp(),
      scheduledFor: serverTimestamp(),
      attempts: 0,
      error: null
  });

    return docRef.id;
} catch (error) {
    console.error('Error queueing email:', error);
    throw error;
}
};

/**
 * Send a batch of emails (for newsletters, announcements, etc.)
 */
export const sendBatchEmails = async (
  recipients: string[],
  subject: string,
  html: string,
  text?: string,
  metadata?: Record<string, unknown>
): Promise<string[]> => {
  try {
    const emailIds: string[] = [];

    // Send emails in batches of 50
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      // Create batch email document
      const batchEmailRef = collection(firestore, 'emailBatches');
      const batchDocRef = await addDoc(batchEmailRef, {
        recipients: batch,
        subject,
        html,
        text: text || '',
        from: 'Closer College <noreply@closercollegett.com>',
        replyTo: 'support@closercollegett.com',
        metadata: metadata || {},
        status: 'pending',
        createdAt: serverTimestamp(),
        scheduledFor: serverTimestamp(),
        attempts: 0,
        error: null
    });

      emailIds.push(batchDocRef.id);
  }

    return emailIds;
} catch (error) {
    console.error('Error sending batch emails:', error);
    throw error;
}
};

/**
 * Schedule an email to be sent at a specific time
 */
export const scheduleEmail = async (
  options: EmailOptions,
  scheduledDate: Date
): Promise<string> => {
  try {
    // Validate email options
    if (!options.to) {
      throw new Error('Recipient email is required');
  }

    if (!options.subject) {
      throw new Error('Email subject is required');
  }

    if (!options.html) {
      throw new Error('Email HTML content is required');
  }

    // Convert to array if single email
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const cc = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [];
    const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [];

    // Create email document in queue
    const emailQueueRef = collection(firestore, 'emailQueue');
    const docRef = await addDoc(emailQueueRef, {
      to: recipients,
      cc,
      bcc,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
      from: options.from || 'Closer College <noreply@closercollegett.com>',
      replyTo: options.replyTo || 'support@closercollegett.com',
      attachments: options.attachments || [],
      metadata: options.metadata || {},
      status: 'scheduled',
      createdAt: serverTimestamp(),
      scheduledFor: Timestamp.fromDate(scheduledDate),
      attempts: 0,
      error: null
  });

    return docRef.id;
} catch (error) {
    console.error('Error scheduling email:', error);
    throw error;
}
};

/**
 * Get email tracking pixel HTML
 */
export const getTrackingPixel = (emailId: string): string => {
  const trackingUrl = `https://closercollegett.com/api/email/track?id=${emailId}`;
  return `<img src="${trackingUrl}" alt="" width="1" height="1" style="display:none;" />`;
};

/**
 * Add tracking to links in HTML content
 */
export const addLinkTracking = (html: string, emailId: string, userId?: string): string => {
  // Simple regex to find links in HTML
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>(.*?)<\/a>/gi;

  return html.replace(linkRegex, (match: string, url: string, attrs: string, text: string) => {
    // Skip if already tracked or is an anchor link
    if (url.includes('track=') || url.startsWith('#')) { // Now safe: url is string
      return match;
  }

    // Add tracking parameters
    const separator = url.includes('?') ? '&' : '?'; // Now safe: url is string
    const trackedUrl = `${url}${separator}track=email&id=${emailId}${userId ? `&uid=${userId}` : ''}`;

    return `<a href="${trackedUrl}"${attrs}>${text}</a>`;
});
};
