# Course Management Implementation Plan

This document outlines the comprehensive plan for implementing the course management system in the training platform.

## Phase 1: Admin Course Management

### 1. Course List Page (Admin)
- **File**: `/admin/courses/index.tsx`
- **Features**:
  - Table display of all courses
  - Columns: Title, Status, Level, Duration, Created Date
  - Thumbnail preview
  - Actions (edit, delete, view)
  - Sorting and filtering options
  - Pagination
  - Search functionality
- **Components**:
  - CourseTable
  - CourseTableRow
  - CourseStatusBadge
  - CourseActions

### 2. Course Creation Form
- **File**: `/admin/courses/create.tsx`
- **Features**:
  - Course metadata form (title, description, level, etc.)
  - Integration with CourseImageSelector component
  - Category selection
  - Duration setting
  - Save as draft or publish options
  - Preview functionality
- **Components**:
  - CourseForm
  - CourseMetadataSection
  - CourseCategorySelector
  - CourseStatusToggle

### 3. Course Edit Page
- **File**: `/admin/courses/[id]/edit.tsx`
- **Features**:
  - Pre-populated form with existing course data
  - Ability to modify all course properties
  - Module/lesson management interface
  - Status toggle (draft/published)
- **Components**:
  - CourseForm (reused)
  - ModuleManager
  - LessonManager

### 4. Course Categories Management
- **File**: `/admin/courses/categories.tsx`
- **Features**:
  - List existing categories
  - Add/edit/delete categories
  - Associate categories with courses
- **Components**:
  - CategoryTable
  - CategoryForm
  - CategoryActions

## Phase 2: Course Content Management

### 1. Module Management
- **Components**:
  - ModuleList
  - ModuleForm
  - ModuleDragDrop
  - ModuleStatusToggle
- **Features**:
  - Create, edit, delete modules
  - Reorder modules via drag and drop
  - Set module status (draft/published)
  - Add lessons to modules

### 2. Lesson Management
- **Components**:
  - LessonList
  - LessonForm
  - LessonTypeSelector
  - LessonDragDrop
- **Features**:
  - Create different lesson types (video, text, quiz)
  - Edit lesson content
  - Reorder lessons within modules
  - Set lesson status

### 3. Content Editor
- **Components**:
  - RichTextEditor
  - VideoLessonEditor
  - QuizLessonEditor
  - FileAttachmentManager
- **Features**:
  - Rich text editing for lesson content
  - Cloudflare Stream video integration
  - Embed external resources
  - File attachment capabilities

## Phase 3: Student-Facing Course Experience

### 0. Mobile Responsiveness
- **Components**:
  - ResponsiveLayoutManager
  - MobileNavigationMenu
  - TouchFriendlyControls
  - AdaptiveContentViewer
- **Features**:
  - Fully responsive course viewing experience
  - Touch-optimized video controls
  - Mobile-friendly navigation
  - Adaptive content sizing
  - Offline content access capabilities
  - Mobile-optimized certificate verification
  - Device-specific optimizations

### 1. Course Detail Page
- **File**: `/courses/[id].tsx`
- **Features**:
  - Display course details
  - Show module/lesson structure
  - Allow enrollment
  - Display progress for enrolled users
- **Components**:
  - CourseHeader
  - CourseModuleAccordion
  - EnrollButton
  - ProgressIndicator

### 2. Course Learning Interface
- **File**: `/courses/[id]/learn.tsx`
- **Features**:
  - Lesson navigation sidebar
  - Content display area
  - Progress tracking
  - Completion marking
- **Components**:
  - LessonNavigationSidebar
  - LessonContentViewer
  - VideoPlayer
  - LessonCompletionButton

### 3. Course Progress Tracking
- **Firestore Structure**:
  - Course enrollment records
  - Lesson completion tracking
  - Quiz results storage
  - Progress calculation
- **Components**:
  - ProgressTracker
  - CompletionIndicator
  - ProgressChart

## Phase 9: Mobile Responsiveness

### 0. Mobile Responsiveness
- **Components**:
  - ResponsiveLayoutManager
  - MobileNavigationMenu
  - TouchFriendlyControls
  - AdaptiveContentViewer
- **Features**:
  - Fully responsive course viewing experience
  - Touch-optimized video controls
  - Mobile-friendly navigation
  - Adaptive content sizing
  - Offline content access capabilities
  - Mobile-optimized certificate verification
  - Device-specific optimizations

### Sprint 16: Mobile Experience
- [ ] Implement responsive layouts for all course pages
- [ ] Create mobile-friendly navigation
- [ ] Optimize video controls for touch interfaces
- [ ] Ensure certificate verification works well on mobile

## Phase 10: User Engagement and Notifications

### 1. Automated Reminder System
- **Components**:
  - ReminderManager
  - NotificationScheduler
  - EmailTemplateEditor
  - UserNotificationCenter
- **Features**:
  - Automated reminders for incomplete courses
  - Certificate expiration notifications
  - New course availability alerts
  - Customizable notification templates
  - Email and in-app notification options
  - Notification frequency settings
  - Bulk notification capabilities

### 2. User Feedback System
- **Components**:
  - CourseReviewForm
  - FeedbackManager
  - RatingDisplay
  - FeedbackAnalytics
- **Features**:
  - Course ratings and reviews
  - Lesson-specific feedback collection
  - Suggestion submission for course improvements
  - Admin feedback review interface
  - Feedback analytics dashboard
  - Public/private feedback options

### Sprint 17: Notification System
- [ ] Build notification scheduling system
- [ ] Create email templates for various notification types
- [ ] Implement course completion reminders
- [ ] Add certificate expiration notifications

### Sprint 18: Feedback and Engagement
- [ ] Implement course rating and review system
- [ ] Create feedback collection forms
- [ ] Build feedback analytics dashboard
- [ ] Develop admin review interface for feedback

## Phase 5: Administration and Integration

### 1. Bulk Operations
- **Components**:
  - BulkEnrollmentTool
  - BatchCertificateGenerator
  - MassNotificationSender
  - BulkImportExportTool
- **Features**:
  - Bulk student enrollment
  - Batch certificate generation
  - Mass email notifications
  - Bulk import/export of course content
  - CSV template downloads for bulk operations
  - Operation history and logging

### 2. Payment Integration
- **Components**:
  - SubscriptionManager
  - PaymentProcessor
  - DiscountCodeManager
  - InvoiceGenerator
- **Features**:
  - Course and subscription pricing
  - Payment processing integration
  - Discount code creation and management
  - Invoice generation and tracking
  - Payment history and reporting
  - Subscription management

## Phase 6: Assessment and Certification

### 1. Quiz Implementation
- **Components**:
  - QuizEditor (admin)
  - QuestionForm
  - QuizTaker (student)
  - QuizResults
- **Features**:
  - Multiple question types
  - Automatic grading
  - Results display
  - Quiz analytics

### 2. Certificate Tracking and Verification
- **Components**:
  - CertificateTracker
  - StudentProgressTable
  - CertificateVerificationTool
  - CertificateSearchFilters
- **Features**:
  - Comprehensive student progress tracking
  - Filter students by status (passed, failed, incomplete)
  - Search by student name, date, UUID, company
  - Certificate verification system
  - Export student data to CSV/Excel
  - Detailed completion reports
  - Email notification system for certificate issuance

### 3. Certificate Generation
- **Components**:
  - CertificateTemplate
  - CertificateGenerator
  - CertificateViewer
  - CertificateDownloader
  - SignatureUploader
  - CertificateDesigner
  - CertificateFieldPlacer
  - FontStyleSelector
- **Features**:
  - Certificate template design
  - Dynamic data insertion
  - PDF generation
  - Download functionality
  - Signature upload and placement
  - Background image customization
  - PDF template upload option
  - Drag-and-drop field placement
  - Font style customization for student names
  - UUID placement customization
  - Date field placement customization

## Phase 7: User and Company Management

### 1. User Management System
- **Components**:
  - UserList
  - UserForm
  - UserRoleManager
  - UserProfileViewer
- **Features**:
  - User creation and editing
  - Role assignment (admin, instructor, student, manager)
  - User profile management
  - Account status control
  - Progress tracking across courses
  - Bulk user operations

### 2. Company Management System
- **Components**:
  - CompanyList
  - CompanyForm
  - CompanyDashboard
  - EmployeeManager
- **Features**:
  - Company profile management
  - Employee onboarding and management
  - Department structure
  - Subscription and billing management
  - Company-wide progress tracking
  - Custom learning paths for companies

### 3. Team and Department Structure
- **Components**:
  - TeamManager
  - DepartmentEditor
  - TeamProgressTracker
  - TeamEnrollmentTool
- **Features**:
  - Team creation and management
  - Department hierarchy
  - Team-based enrollment
  - Team progress analytics
  - Manager notification system
  - Team-specific reporting

## Phase 8: Contract Management

### 1. Digital Contract System
- **Components**:
  - ContractTemplateManager
  - ContractEditor
  - SignatureCapture
  - ContractViewer
  - ContractStatusTracker
- **Features**:
  - Contract template creation and management
  - Dynamic field insertion for personalization
  - Electronic signature capture (similar to DocuSign)
  - Contract status tracking (sent, viewed, signed, expired)
  - Automated reminders for unsigned contracts
  - Contract archiving and retrieval
  - Audit trail for compliance

### 2. Enrollment Agreement System
- **Components**:
  - EnrollmentAgreementGenerator
  - TermsAndConditionsManager
  - BulkAgreementSender
  - AgreementAnalytics
- **Features**:
  - Course-specific enrollment agreements
  - Terms and conditions management
  - Bulk sending of agreements to teams/companies
  - Agreement completion analytics
  - Integration with payment processing
  - Legal compliance tracking

### Sprint 14: Contract Management
- [ ] Build contract template system
- [ ] Implement electronic signature functionality
- [ ] Create contract status tracking
- [ ] Develop contract analytics dashboard

### Sprint 15: Enrollment Agreements
- [ ] Create enrollment agreement generator
- [ ] Implement terms and conditions management
- [ ] Build bulk agreement distribution system
- [ ] Develop agreement analytics and reporting

## Data Model

```
/courses/{courseId}
  - id: string
  - title: string
  - description: string
  - thumbnail: string
  - duration: string
  - level: 'Beginner' | 'Intermediate' | 'Advanced'
  - status: 'draft' | 'published'
  - createdAt: timestamp
  - updatedAt: timestamp
  - categoryIds: string[]

/courses/{courseId}/modules/{moduleId}
  - id: string
  - title: string
  - description: string
  - order: number
  - status: 'draft' | 'published'

/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}
  - id: string
  - title: string
  - type: 'video' | 'text' | 'quiz'
  - content: string
  - videoId?: string (Cloudflare Stream ID)
  - duration: number
  - order: number
  - status: 'draft' | 'published'

/categories/{categoryId}
  - id: string
  - name: string
  - description: string
  - courseCount: number

/users/{userId}/enrollments/{courseId}
  - courseId: string
  - enrolledAt: timestamp
  - progress: number
  - completedLessons: string[]
  - lastAccessedAt: timestamp

/certificateTemplates/{templateId}
  - name: string
  - description: string
  - backgroundImageUrl: string
  - isPdfTemplate: boolean
  - pdfTemplateUrl: string
  - signatureImageUrl: string
  - fields: [
      {
        type: 'studentName' | 'date' | 'courseTitle' | 'uuid' | 'signature',
        x: number, // position percentage from left
        y: number, // position percentage from top
        width: number, // width percentage
        height: number, // height percentage
        fontFamily: string,
        fontSize: number,
        fontWeight: string,
        fontColor: string,
        alignment: 'left' | 'center' | 'right'
    }
    ]
  - createdAt: timestamp
  - updatedAt: timestamp
  - isDefault: boolean

/certificates/{certificateId}
  - uuid: string // unique verification code
  - userId: string
  - userName: string
  - userEmail: string
  - companyId: string
  - companyName: string
  - courseId: string
  - courseTitle: string
  - templateId: string
  - issueDate: timestamp
  - expiryDate: timestamp
  - status: 'issued' | 'revoked' | 'expired'
  - pdfUrl: string
  - verificationUrl: string
  - metadata: {
      quizScore: number,
      completionTime: number, // in minutes
      passingGrade: number,
      additionalInfo: string
  }
```

## Implementation Sprints

### Sprint 1: Admin Course Management
- [x] Create course implementation plan
- [ ] Create admin course list page
- [ ] Implement course creation form
- [ ] Set up Firestore data structure for courses
- [ ] Implement basic CRUD operations

### Sprint 2: Course Content Structure
- [ ] Implement module management
- [ ] Add lesson creation
- [ ] Create content editor
- [ ] Set up course preview functionality

### Sprint 3: Student Experience
- [ ] Enhance course detail page
- [ ] Create learning interface
- [ ] Implement progress tracking
- [ ] Connect to existing course catalog

### Sprint 4: Assessment
- [ ] Implement quiz functionality
- [ ] Create basic certificate generation
- [ ] Add reporting features

### Sprint 5: Advanced Certificate Customization
- [ ] Implement signature upload functionality
- [ ] Create background image customization
- [ ] Build PDF template upload option
- [ ] Develop drag-and-drop field placement interface
- [ ] Implement font style customization for student names
- [ ] Add certificate preview functionality
- [ ] Create certificate template management

### Sprint 6: Certificate Tracking and Verification
- [ ] Build comprehensive student progress tracking system
- [ ] Create filterable student status table (passed, failed, incomplete)
- [ ] Implement advanced search functionality (by name, date, UUID, company)
- [ ] Develop certificate verification system with unique UUIDs
- [ ] Create data export functionality (CSV/Excel)
- [ ] Build detailed completion reports
- [ ] Implement email notification system for certificate issuance

### Sprint 7: Mobile Responsiveness
- [ ] Implement responsive layouts for all course pages
- [ ] Create mobile-friendly navigation
- [ ] Optimize video controls for touch interfaces
- [ ] Ensure certificate verification works well on mobile
- [ ] Test and optimize for various device sizes

### Sprint 8: Automated Reminders
- [ ] Build notification scheduling system
- [ ] Create email templates for various notification types
- [ ] Implement course completion reminders
- [ ] Add certificate expiration notifications
- [ ] Create new course availability alerts

### Sprint 9: Payment Integration
- [ ] Set up subscription management system
- [ ] Integrate payment processing
- [ ] Implement discount code functionality
- [ ] Create invoice generation system
- [ ] Build payment history and reporting

### Sprint 10: User Feedback and Bulk Operations
- [ ] Implement course rating and review system
- [ ] Create feedback collection forms
- [ ] Build bulk enrollment functionality
- [ ] Implement batch certificate generation
- [ ] Add mass notification capabilities

### Sprint 11: User Management
- [ ] Implement user list and detail views
- [ ] Create user role management system
- [ ] Build user profile editing functionality
- [ ] Implement user progress tracking across courses

### Sprint 12: Company Management
- [ ] Create company profile management
- [ ] Implement employee onboarding system
- [ ] Build company dashboard with analytics
- [ ] Develop company-wide reporting features

### Sprint 13: Team Structure
- [ ] Implement team and department management
- [ ] Create team-based enrollment functionality
- [ ] Build team progress tracking
- [ ] Develop manager notification system

### Sprint 14: Contract Management
- [ ] Build contract template system
- [ ] Implement electronic signature functionality
- [ ] Create contract status tracking
- [ ] Create contract email notifications
- [ ] Develop contract email signing functionality
- [ ] Develop contract analytics dashboard

### Sprint 15: Enrollment Agreements
- [ ] Create enrollment agreement generator
- [ ] Implement terms and conditions management
- [ ] Build bulk agreement distribution system
- [ ] Develop agreement analytics and reporting






