import {NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

// Define the expected request body structure
interface ContactFormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    // Get form data from request body
    const {name, email, company, message } = req.body as ContactFormData;

    // Validate form data
    if (!name || !email || !message) {
      return res.status(400).json({error: 'Name, email, and message are required'});
  }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({error: 'Invalid email address'});
  }

    // Create email transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.FROM_EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

    // Set up email data
    const mailOptions = {
      from: `"Training Platform" <${process.env.FROM_EMAIL}>`,
      to: process.env.FROM_EMAIL, // Send to the same email
      replyTo: email,
      subject: `New Enterprise Inquiry from ${name}`,
      html: `
        <h2>New Enterprise Training Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p><em>This inquiry came from the Training Platform's Enterprise Solutions contact form.</em></p>
      `,
  };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success response
    return res.status(200).json({success: true, message: 'Your enterprise inquiry has been sent successfully! Our team will contact you within 1-2 business days.'});
} catch (error) {
    console.error('Error sending contact form email:', error);
    return res.status(500).json({
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
  });
}
}
