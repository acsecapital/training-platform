# Closer College Training Platform

A comprehensive training platform built with Next.js, TypeScript, and Tailwind CSS to deliver sales training courses, interactive quizzes, and certificates.

## Features

- **Video-based Learning**: Integrated with Cloudflare Stream for high-quality video delivery
- **Interactive Quizzes**: Test knowledge with interactive assessments
- **Certificate Generation**: Generate and download PDF certificates upon course completion
- **Progress Tracking**: Track learning progress across courses
- **Responsive Design**: Optimized for all devices from mobile to desktop
- **Manager Notifications**: Alert managers when team members complete training

## Project Structure

```
/training-platform
  /src
    /components        (reusable UI components)
      /video-player    (Cloudflare Stream integration)
      /course-catalog  (course listing and navigation)
      /exam-system     (quiz and assessment tools)
      /certificates    (certificate generation and management)
      /notifications   (notification system components)
      /ui              (basic UI components)
      /layout          (layout components)
    /pages             (main page templates)
    /hooks             (custom React hooks)
    /services          (API and external service integrations)
    /utils             (helper functions)
    /context           (React context providers)
    /types             (TypeScript type definitions)
    /styles            (global styles and themes)
  /public
    /assets            (static assets)
    /certificate-templates (PDF templates)
  /config              (configuration files)
```

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/training-platform.git
cd training-platform
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_CLOUDFLARE_STREAM_ACCOUNT_ID=your_cloudflare_account_id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3002](http://localhost:3002) in your browser to see the application

## Development Roadmap

### Phase 1: Foundation
- [x] Set up project structure and build system
- [x] Implement basic routing and navigation
- [x] Create core UI components
- [ ] Integrate Cloudflare Stream API
- [ ] Develop basic course catalog structure

### Phase 2: Core Functionality
- [ ] Build video player with progress tracking
- [ ] Implement course navigation system
- [ ] Create exam/quiz functionality
- [ ] Develop certificate generation system
- [ ] Set up basic user state management

### Phase 3: Advanced Features
- [ ] Implement notification system
- [ ] Build manager dashboards
- [ ] Create administrative interfaces
- [ ] Develop reporting and analytics
- [ ] Integrate with Stripe for payments

### Phase 4: Integration & Polish
- [ ] Refine user experience and interface
- [ ] Implement responsive design optimizations
- [ ] Add accessibility features
- [ ] Create documentation
- [ ] Perform testing and bug fixes

### Phase 5: Launch Preparation
- [ ] Conduct user acceptance testing
- [ ] Migrate existing content
- [ ] Set up production environment
- [ ] Create backup and recovery procedures
- [ ] Prepare launch communications

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Video Delivery**: Cloudflare Stream
- **Payments**: Stripe
- **PDF Generation**: jsPDF
- **Deployment**: Vercel (planned)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Closer College for the design inspiration and color scheme
- The LIPS Sales System methodology
