import {EmailTemplate, NotificationTemplateType } from '@/types/notification-templates.types';

/**
 * Default email templates for various notification types
 */
export const defaultEmailTemplates: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Course Progress Template
  {
    type: 'course_progress',
    name: 'Course Progress Update',
    subject: 'You\'re making great progress in {{courseName}}!',
    version: 1,
    category: 'Course Updates',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Progress Update</title>
        <style>
          body {font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header {background-color: #0e0e4f; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content {background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer {margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          .button {display: inline-block; background-color: #0e0e4f; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
          .progress-bar {background-color: #e0e0e0; height: 20px; border-radius: 10px; margin: 15px 0; overflow: hidden; }
          .progress-fill {background-color: #0e0e4f; height: 100%; width: {{progress}}%; }
          .highlight {color: #8a0200; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Course Progress Update</h1>
        </div>
        <div class="content">
          <p>Hello {{firstName}},</p>
          <p>You're making excellent progress in <span class="highlight">{{courseName}}</span>!</p>

          <p>You've completed <strong>{{progress}}%</strong> of the course material.</p>

          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>

          <p>Keep up the great work! Consistent learning leads to mastery.</p>

          <p>Here's what you'll learn in the upcoming sections:</p>
          <ul>
            <li>Advanced techniques to improve your sales approach</li>
            <li>Practical exercises to reinforce your learning</li>
            <li>Real-world case studies from successful professionals</li>
          </ul>

          <p>Ready to continue your learning journey?</p>

          <a href="{{link}}" class="button">Continue Learning</a>

          <p>If you have any questions or need assistance, our support team is here to help.</p>

          <p>Best regards,<br>The Closer College Team</p>
        </div>
        <div class="footer">
          <p>© 2023 Closer College. All rights reserved.</p>
          <p>This email was sent to {{email}}. If you prefer not to receive these updates, you can <a href="#">update your preferences</a>.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Hello {{firstName}},

      You're making excellent progress in {{courseName}}!

      You've completed {{progress}}% of the course material. Keep up the great work! Consistent learning leads to mastery.

      Here's what you'll learn in the upcoming sections:
      - Advanced techniques to improve your sales approach
      - Practical exercises to reinforce your learning
      - Real-world case studies from successful professionals

      Ready to continue your learning journey? Visit: {{link}}

      If you have any questions or need assistance, our support team is here to help.

      Best regards,
      The Closer College Team

      © 2023 Closer College. All rights reserved.
      This email was sent to {{email}}.
    `,
    isActive: true,
    variables: [
      {name: 'firstName', description: 'User\'s first name', required: true },
      {name: 'courseName', description: 'Name of the course', required: true },
      {name: 'progress', description: 'Course progress percentage', required: true },
      {name: 'link', description: 'Link to continue the course', required: true },
      {name: 'email', description: 'User\'s email address', required: true }
    ]
},

  // Course Completion Template
  {
    type: 'course_completion',
    name: 'Course Completion Congratulations',
    subject: 'Congratulations on completing {{courseName}}!',
    version: 1,
    category: 'Course Updates',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Completion</title>
        <style>
          body {font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header {background-color: #1a5d1a; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content {background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer {margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          .button {display: inline-block; background-color: #1a5d1a; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
          .certificate {border: 2px solid #1a5d1a; padding: 15px; text-align: center; margin: 20px 0; }
          .highlight {color: #8a0200; font-weight: bold; }
          .celebration {font-size: 24px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Congratulations!</h1>
        </div>
        <div class="content">
          <p>Hello {{firstName}},</p>

          <div class="celebration">🎉 You did it! 🎉</div>

          <p>We're thrilled to inform you that you've successfully completed <span class="highlight">{{courseName}}</span>!</p>

          <p>This is a significant achievement that demonstrates your commitment to professional growth and excellence in sales. The knowledge and skills you've gained will serve you well in your career.</p>

          <div class="certificate">
            <h2>Your Certificate is Ready</h2>
            <p>Your certificate of completion is now available. Download it to showcase your achievement!</p>
            <a href="{{link}}" class="button">Download Certificate</a>
          </div>

          <p>Here's what you can do next:</p>
          <ul>
            <li>Share your achievement on LinkedIn and other professional networks</li>
            <li>Apply your new skills in your daily work</li>
            <li>Explore our other courses to continue your professional development</li>
          </ul>

          <p>We'd love to hear about your experience with the course. Your feedback helps us improve and create better learning experiences.</p>

          <a href="#" class="button" style="background-color: #4d4d4d;">Share Your Feedback</a>

          <p>Thank you for choosing Closer College for your professional development journey.</p>

          <p>Best regards,<br>The Closer College Team</p>
        </div>
        <div class="footer">
          <p>© 2023 Closer College. All rights reserved.</p>
          <p>This email was sent to {{email}}. If you prefer not to receive these updates, you can <a href="#">update your preferences</a>.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Hello {{firstName}},

      CONGRATULATIONS! You did it!

      We're thrilled to inform you that you've successfully completed {{courseName}}!

      This is a significant achievement that demonstrates your commitment to professional growth and excellence in sales. The knowledge and skills you've gained will serve you well in your career.

      YOUR CERTIFICATE IS READY
      Your certificate of completion is now available. Download it to showcase your achievement!
      Download Certificate: {{link}}

      Here's what you can do next:
      - Share your achievement on LinkedIn and other professional networks
      - Apply your new skills in your daily work
      - Explore our other courses to continue your professional development

      We'd love to hear about your experience with the course. Your feedback helps us improve and create better learning experiences.

      Thank you for choosing Closer College for your professional development journey.

      Best regards,
      The Closer College Team

      © 2023 Closer College. All rights reserved.
      This email was sent to {{email}}.
    `,
    isActive: true,
    variables: [
      {name: 'firstName', description: 'User\'s first name', required: true },
      {name: 'courseName', description: 'Name of the course', required: true },
      {name: 'completionDate', description: 'Date of course completion', required: true },
      {name: 'link', description: 'Link to download certificate', required: true },
      {name: 'email', description: 'User\'s email address', required: true }
    ]
},

  // Certificate Expiration Template
  {
    type: 'certificate_expiration',
    name: 'Certificate Expiration Notice',
    subject: 'Your {{courseName}} certificate is expiring soon',
    version: 1,
    category: 'Certificates',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate Expiration Notice</title>
        <style>
          body {font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header {background-color: #8b7500; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content {background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer {margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          .button {display: inline-block; background-color: #8b7500; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
          .alert {background-color: #fff3cd; border-left: 4px solid #8b7500; padding: 15px; margin: 20px 0; }
          .highlight {color: #8a0200; font-weight: bold; }
          .expiration {font-size: 18px; color: #8a0200; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Certificate Expiration Notice</h1>
        </div>
        <div class="content">
          <p>Hello {{firstName}},</p>

          <div class="alert">
            <p>Your certificate for <span class="highlight">{{courseName}}</span> will expire in <strong>{{daysUntilExpiration}} days</strong> (on {{expirationDate}}).</p>
          </div>

          <p>Maintaining an active certification demonstrates your ongoing commitment to professional excellence and keeps your skills current in this rapidly evolving field.</p>

          <div class="expiration">Why renew your certification?</div>

          <ul>
            <li>Showcase your up-to-date expertise to clients and employers</li>
            <li>Maintain access to exclusive resources and community benefits</li>
            <li>Stay current with the latest sales techniques and strategies</li>
            <li>Demonstrate your commitment to continuous professional development</li>
          </ul>

          <p>You can renew your certification by completing a refresher course or by taking the certification exam again.</p>

          <a href="{{link}}" class="button">Renew Your Certification</a>

          <p>If you have any questions about the renewal process, please don't hesitate to contact our support team.</p>

          <p>Best regards,<br>The Closer College Team</p>
        </div>
        <div class="footer">
          <p>© 2023 Closer College. All rights reserved.</p>
          <p>This email was sent to {{email}}. If you prefer not to receive these updates, you can <a href="#">update your preferences</a>.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Hello {{firstName}},

      CERTIFICATE EXPIRATION NOTICE

      Your certificate for {{courseName}} will expire in {{daysUntilExpiration}} days (on {{expirationDate}}).

      Maintaining an active certification demonstrates your ongoing commitment to professional excellence and keeps your skills current in this rapidly evolving field.

      Why renew your certification?
      - Showcase your up-to-date expertise to clients and employers
      - Maintain access to exclusive resources and community benefits
      - Stay current with the latest sales techniques and strategies
      - Demonstrate your commitment to continuous professional development

      You can renew your certification by completing a refresher course or by taking the certification exam again.

      Renew Your Certification: {{link}}

      If you have any questions about the renewal process, please don't hesitate to contact our support team.

      Best regards,
      The Closer College Team

      © 2023 Closer College. All rights reserved.
      This email was sent to {{email}}.
    `,
    isActive: true,
    variables: [
      {name: 'firstName', description: 'User\'s first name', required: true },
      {name: 'courseName', description: 'Name of the course', required: true },
      {name: 'expirationDate', description: 'Certificate expiration date', required: true },
      {name: 'daysUntilExpiration', description: 'Days until certificate expires', required: true },
      {name: 'link', description: 'Link to renew certification', required: true },
      {name: 'email', description: 'User\'s email address', required: true }
    ]
},

  // New Course Available Template
  {
    type: 'new_course_available',
    name: 'New Course Announcement',
    subject: 'New Course Available: {{courseName}}',
    version: 1,
    category: 'Marketing',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Course Available</title>
        <style>
          body {font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header {background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content {background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer {margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          .button {display: inline-block; background-color: #e74c3c; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
          .course-card {border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .course-title {color: #2c3e50; font-size: 20px; margin-bottom: 10px; }
          .highlight {color: #e74c3c; font-weight: bold; }
          .new-badge {display: inline-block; background-color: #e74c3c; color: white; font-size: 12px; padding: 3px 8px; border-radius: 10px; margin-left: 10px; }
          .features {margin: 20px 0; }
          .feature {display: flex; align-items: center; margin-bottom: 10px; }
          .feature-icon {margin-right: 10px; color: #2c3e50; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Course Available</h1>
        </div>
        <div class="content">
          <p>Hello {{firstName}},</p>

          <p>We're excited to announce our newest addition to the Closer College curriculum!</p>

          <div class="course-card">
            <div class="course-title">{{courseName}} <span class="new-badge">NEW</span></div>
            <p>{{courseDescription}}</p>

            <div class="features">
              <div class="feature">
                <span class="feature-icon">✓</span> Comprehensive curriculum designed by industry experts
              </div>
              <div class="feature">
                <span class="feature-icon">✓</span> Practical exercises and real-world case studies
              </div>
              <div class="feature">
                <span class="feature-icon">✓</span> Interactive learning experience with quizzes and assessments
              </div>
              <div class="feature">
                <span class="feature-icon">✓</span> Certificate of completion to showcase your expertise
              </div>
            </div>

            <a href="{{link}}" class="button">Explore the Course</a>
          </div>

          <p><span class="highlight">Limited Time Offer:</span> Enroll within the next 7 days and receive a 15% discount!</p>

          <p>This course is perfect for professionals looking to enhance their sales skills and advance their careers. Don't miss this opportunity to stay ahead in your field.</p>

          <p>Best regards,<br>The Closer College Team</p>
        </div>
        <div class="footer">
          <p>© 2023 Closer College. All rights reserved.</p>
          <p>This email was sent to {{email}}. If you prefer not to receive these updates, you can <a href="#">update your preferences</a>.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Hello {{firstName}},

      We're excited to announce our newest addition to the Closer College curriculum!

      NEW COURSE: {{courseName}}

      {{courseDescription}}

      Course Features:
      ✓ Comprehensive curriculum designed by industry experts
      ✓ Practical exercises and real-world case studies
      ✓ Interactive learning experience with quizzes and assessments
      ✓ Certificate of completion to showcase your expertise

      Explore the Course: {{link}}

      LIMITED TIME OFFER: Enroll within the next 7 days and receive a 15% discount!

      This course is perfect for professionals looking to enhance their sales skills and advance their careers. Don't miss this opportunity to stay ahead in your field.

      Best regards,
      The Closer College Team

      © 2023 Closer College. All rights reserved.
      This email was sent to {{email}}.
    `,
    isActive: true,
    variables: [
      {name: 'firstName', description: 'User\'s first name', required: true },
      {name: 'courseName', description: 'Name of the new course', required: true },
      {name: 'courseDescription', description: 'Description of the new course', required: true },
      {name: 'link', description: 'Link to the course page', required: true },
      {name: 'email', description: 'User\'s email address', required: true }
    ]
},

  // Inactivity Reminder Template
  {
    type: 'inactivity_reminder',
    name: 'Course Inactivity Reminder',
    subject: 'Don\'t lose your momentum in {{courseName}}',
    version: 1,
    category: 'Reminders',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>We Miss You!</title>
        <style>
          body {font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header {background-color: #0e0e4f; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content {background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer {margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          .button {display: inline-block; background-color: #0e0e4f; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
          .reminder {background-color: #e8eaf6; border-left: 4px solid #0e0e4f; padding: 15px; margin: 20px 0; }
          .highlight {color: #8a0200; font-weight: bold; }
          .benefits {margin: 20px 0; }
          .benefit {margin-bottom: 10px; }
          .calendar {text-align: center; margin: 20px 0; font-size: 18px; }
          .days {color: #8a0200; font-weight: bold; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>We Miss You!</h1>
        </div>
        <div class="content">
          <p>Hello {{firstName}},</p>

          <div class="reminder">
            <p>We noticed it's been <span class="days">{{daysInactive}} days</span> since you last accessed your <span class="highlight">{{courseName}}</span> course.</p>
          </div>

          <p>Life gets busy, and it's easy to put learning on hold. However, consistent practice is key to mastering new skills, especially in sales.</p>

          <div class="calendar">
            Last activity: {{lastAccessDate}}
          </div>

          <p>Here's why you should continue your learning journey:</p>

          <div class="benefits">
            <div class="benefit">✓ <strong>Maintain momentum</strong> - Regular practice reinforces learning</div>
            <div class="benefit">✓ <strong>Stay competitive</strong> - Keep your skills current in a rapidly evolving field</div>
            <div class="benefit">✓ <strong>Complete your certification</strong> - Showcase your expertise to clients and employers</div>
            <div class="benefit">✓ <strong>Maximize your investment</strong> - Get the full value from your course enrollment</div>
          </div>

          <p>We've saved your progress, and you can pick up right where you left off.</p>

          <a href="{{link}}" class="button">Resume Your Course</a>

          <p>If you're facing any challenges with the course content or have questions, our support team is here to help. Just reply to this email.</p>

          <p>Best regards,<br>The Closer College Team</p>
        </div>
        <div class="footer">
          <p>© 2023 Closer College. All rights reserved.</p>
          <p>This email was sent to {{email}}. If you prefer not to receive these updates, you can <a href="#">update your preferences</a>.</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
      Hello {{firstName}},

      WE MISS YOU!

      We noticed it's been {{daysInactive}} days since you last accessed your {{courseName}} course.

      Life gets busy, and it's easy to put learning on hold. However, consistent practice is key to mastering new skills, especially in sales.

      Last activity: {{lastAccessDate}}

      Here's why you should continue your learning journey:

      ✓ Maintain momentum - Regular practice reinforces learning
      ✓ Stay competitive - Keep your skills current in a rapidly evolving field
      ✓ Complete your certification - Showcase your expertise to clients and employers
      ✓ Maximize your investment - Get the full value from your course enrollment

      We've saved your progress, and you can pick up right where you left off.

      Resume Your Course: {{link}}

      If you're facing any challenges with the course content or have questions, our support team is here to help. Just reply to this email.

      Best regards,
      The Closer College Team

      © 2023 Closer College. All rights reserved.
      This email was sent to {{email}}.
    `,
    isActive: true,
    variables: [
      {name: 'firstName', description: 'User\'s first name', required: true },
      {name: 'courseName', description: 'Name of the course', required: true },
      {name: 'daysInactive', description: 'Number of days since last activity', required: true },
      {name: 'lastAccessDate', description: 'Date of last course access', required: true },
      {name: 'link', description: 'Link to resume the course', required: true },
      {name: 'email', description: 'User\'s email address', required: true }
    ]
}
];

/**
 * Function to initialize default email templates in the database
 */
export const initializeDefaultEmailTemplates = async (createTemplateFunction: Function): Promise<string[]> => {
  const templateIds: string[] = [];

  for (const template of defaultEmailTemplates) {
    try {
      const id = await createTemplateFunction(template);
      templateIds.push(id);
  } catch (error) {
      console.error(`Error creating template ${template.name}:`, error);
  }
}

  return templateIds;
};
