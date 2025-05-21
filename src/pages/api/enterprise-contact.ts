import {NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

// Define the expected request body structure
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
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
    const {firstName, lastName, email, phone, company, country, message } = req.body as ContactFormData;

    // Validate form data
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({error: 'First name, last name, email, and message are required'});
  }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({error: 'Invalid email address'});
  }

    console.log('Creating email transporter with:', {
      user: process.env.FROM_EMAIL,
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 5) + '...',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 5) + '...',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.substring(0, 5) + '...',
  });

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
      subject: `New Enterprise Inquiry from ${firstName} ${lastName}`,
      html: `
        <h2>New Enterprise Training Inquiry</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Country:</strong> ${country || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p><em>This inquiry came from the Training Platform's Enterprise Solutions contact form.</em></p>
      `,
  };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
  });

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Your enterprise inquiry has been sent successfully! Our team will contact you within 1-2 business days.'
  });
} catch (error) {
    console.error('Error sending contact form email:', error);
    return res.status(500).json({
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
  });
 }
}
