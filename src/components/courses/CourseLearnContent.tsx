import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import VideoPlayer from '@/components/video-player/VideoPlayer';
import Button from '@/components/ui/Button';
import QuizQuestion, {QuestionType } from '@/components/exam-system/QuizQuestion';
import QuizProgress from '@/components/exam-system/QuizProgress';
import QuizResults from '@/components/exam-system/QuizResults';
import ClientSideCertificateGenerator from '@/components/certificates/ClientSideCertificateGenerator';
import {firestore } from '@/services/firebase';
import {collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import {Course, Module, Lesson, Enrollment } from '@/types/course.types';
import {useAuth } from '@/context/AuthContext';
import {adaptAdminQuestionToFrontend, AdminQuizQuestion } from '@/types/quiz.types';
import { calculateCourseProgress } from '../../services/courseProgressService';

interface CourseLearnContentProps {
  courseId: string;
}

const CourseLearnContent: React.FC<CourseLearnContentProps> = ({courseId }) => {
  const router = useRouter();
  const {user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [enrollmentCompletedLessons, setEnrollmentCompletedLessons] = useState<string[]>([]);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch course
        const courseRef = doc(firestore, 'courses', courseId);
        const courseSnapshot = await getDoc(courseRef);

        if (!courseSnapshot.exists()) {
          setError('Course not found');
          setLoading(false);
          return;
      }

        const courseData = {
          id: courseSnapshot.id,
          ...courseSnapshot.data()
      } as Course;

        setCourse(courseData);

        // Fetch modules
        const modulesRef = collection(firestore, `courses/${courseId}/modules`);
        const modulesQuery = query(modulesRef, orderBy('order', 'asc'));
        const modulesSnapshot = await getDocs(modulesQuery);

        const modulesData = modulesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      })) as Module[];

        setModules(modulesData);

        // Fetch lessons for each module
        const lessonsData: Record<string, Lesson[]> = {};

        for (const module of modulesData) {
          const lessonsRef = collection(firestore, `courses/${courseId}/modules/${module.id}/lessons`);
          const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
          const lessonsSnapshot = await getDocs(lessonsQuery);

          lessonsData[module.id] = lessonsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Lesson[];
      }

        // Fetch enrollment data if user is logged in
        if (user?.uid) {
          const enrollmentRef = doc(firestore, `users/${user.uid}/enrollments/${courseId}`);
          const enrollmentSnapshot = await getDoc(enrollmentRef);
          if (enrollmentSnapshot.exists()) {
            const enrollmentData = enrollmentSnapshot.data() as Enrollment;
            setEnrollmentCompletedLessons(enrollmentData.completedLessons || []);
          } else {
            setEnrollmentCompletedLessons([]); // No enrollment or no completed lessons
          }
        }

        setLessons(lessonsData);
    } catch (err: any) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourseData();
}, [courseId, user?.uid]); // Add user.uid as a dependency

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  // Handle error state
  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-50 p-4">
        <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
        <p className="text-lg text-neutral-600 mb-8 text-center">
          {error || "The course you're looking for doesn't exist or has been removed."}
        </p>
        <Button href="/courses" variant="primary">
          Browse Courses
        </Button>
      </div>
    );
}

  // Get current module and lesson
  const currentModule = modules[currentModuleIndex];
  const currentLessonList = currentModule ? lessons[currentModule.id] || [] : [];
  const currentLesson = currentLessonList[currentLessonIndex];

  // Handle answer submission
  const handleAnswerSubmit = (questionId: string, selectedOptionId: string, isCorrect: boolean) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: selectedOptionId,
  }));
};

  // Helper function to convert questions to AdminQuizQuestion format
  const convertToAdminQuizQuestion = (question: any): AdminQuizQuestion => {
    if ('options' in question && Array.isArray(question.options) &&
        typeof question.options[0] === 'object') {
      return question as unknown as AdminQuizQuestion;
  }

    return {
      id: question.id,
      question: question.question || '',
      options: (question.options || []).map((opt: any, i: number) =>
        typeof opt === 'string' ? {id: `option-${i}`, text: opt } : opt
      ),
      correctAnswer: Array.isArray(question.correctAnswer) ?
        question.correctAnswer[0] || '' :
        question.correctAnswer || '',
      explanation: question.explanation
  } as AdminQuizQuestion;
};

  // Handle quiz completion
  const handleQuizComplete = () => {
    if (!currentLesson || currentLesson.type !== 'quiz' || !currentLesson.questions) return;

    // Convert questions to frontend format
    const questions = currentLesson.questions.map(q =>
      adaptAdminQuestionToFrontend(convertToAdminQuizQuestion(q))
    );

    let score = 0;

    questions.forEach(question => {
      // Use either correctOptionId or correctAnswer
      const correctAnswer = question.correctOptionId || question.correctAnswer || '';
      if (userAnswers[question.id] === correctAnswer) {
        score++;
    }
  });

    setQuizScore(score);
    setQuizCompleted(true);
};

  // Handle quiz retry
  const handleQuizRetry = () => {
    setUserAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
};

  // Handle continue to next lesson
  const handleContinue = () => {
    const currentModuleLessons = currentModule ? lessons[currentModule.id] || [] : [];

    // If there are more lessons in the current module
    if (currentLessonIndex < currentModuleLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setQuizCompleted(false);
      setUserAnswers({});
  }
    // If there are more modules
    else if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
      setQuizCompleted(false);
      setUserAnswers({});
  }
    // If course is completed
    else {
      // Show certificate generation
      setCertificateGenerated(true);
  }
};

  // Handle certificate generation
  const handleCertificateGenerated = (pdfUrl: string) => {
    setCertificateUrl(pdfUrl);
};

  // Handle video completion
  const handleVideoComplete = () => {
    // Mark video as completed and continue to next lesson
    handleContinue();
};

  // Calculate progress percentage
  const calculateProgress = () => {
    let totalLessons = 0;
    modules.forEach((module) => {
      const moduleLessons = lessons[module.id] || [];
      totalLessons += moduleLessons.length;
    });

    // Use enrollmentCompletedLessons (from user's enrollment) for completed lessons
    // and totalLessons derived from the fetched course structure.
    const { overallProgress } = calculateCourseProgress(enrollmentCompletedLessons, totalLessons);
    
    return overallProgress;
  };

  // Navigate to specific lesson
  const navigateToLesson = (moduleIndex: number, lessonIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    setQuizCompleted(false);
    setUserAnswers({});
};

  return (
    <>
      <Head>
        <title>{course.title} | Learning Platform</title>
      </Head>

      <div className="min-h-screen bg-neutral-50">
        {/* Course Header */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="container-custom mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Button
                href="/my-learning"
                variant="ghost"
                className="mr-4"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
              }
              >
                Back to My Learning
              </Button>
              <h1 className="text-xl font-semibold truncate max-w-md">{course.title}</h1>
            </div>

            <div className="flex items-center">
              <div className="hidden md:block mr-4">
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium">{calculateProgress()}%</span>
                </div>
              </div>

              <Button
                href={`/courses/${courseId}`}
                variant="outline"
                size="sm"
              >
                Course Details
              </Button>
            </div>
          </div>
        </header>

        {/* Course Content */}
        <main className="container-custom mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Module Navigation */}
            <div className="w-full lg:w-1/4">
              <div className="bg-white rounded-xl shadow-soft p-4 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Course Content</h2>

                <div className="space-y-4">
                  {modules.map((module, moduleIdx) => {
                    const moduleLessons = lessons[module.id] || [];

                    return (
                      <div key={module.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                        {/* Module Header */}
                        <div className={`p-3 ${
                          moduleIdx === currentModuleIndex ? 'bg-primary-50' : 'bg-neutral-50'
                      }`}>
                          <h3 className="font-medium">{module.title}</h3>
                        </div>

                        {/* Module Lessons */}
                        <div className="divide-y divide-neutral-100">
                          {moduleLessons.map((lesson, lessonIdx) => (
                            <button
                              key={lesson.id}
                              className={`w-full text-left p-3 flex items-center ${
                                moduleIdx === currentModuleIndex && lessonIdx === currentLessonIndex
                                  ? 'bg-primary-100 text-primary-800'
                                  : lesson.completed
                                  ? 'bg-green-50 text-green-800'
                                  : 'hover:bg-neutral-50'
                            }`}
                              onClick={() => navigateToLesson(moduleIdx, lessonIdx)}
                            >
                              {lesson.type === 'video' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              )}
                              <span className="text-sm truncate">{lesson.title}</span>

                              {lesson.completed && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                })}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-3/4">
              {/* Lesson Content */}
              <div className="bg-white rounded-xl shadow-card p-6 mb-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">{currentLesson?.title}</h2>
                  <p className="text-neutral-600">
                    Module {currentModuleIndex + 1}: {currentModule?.title}
                  </p>
                </div>

                {/* Video Lesson */}
                {currentLesson?.type === 'video' && (
                  <div>
                    <div className="rounded-xl overflow-hidden mb-6">
                      <VideoPlayer
                        videoId={currentLesson.videoId || ''}
                        title={currentLesson.title}
                        onComplete={handleVideoComplete}
                      />
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button
                        onClick={() => {
                          if (currentLessonIndex > 0) {
                            setCurrentLessonIndex(currentLessonIndex - 1);
                        } else if (currentModuleIndex > 0) {
                            setCurrentModuleIndex(currentModuleIndex - 1);
                            const prevModuleLessons = lessons[modules[currentModuleIndex - 1]?.id] || [];
                            setCurrentLessonIndex(prevModuleLessons.length - 1);
                        }
                      }}
                        variant="outline"
                        disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
                      >
                        Previous Lesson
                      </Button>

                      <Button
                        onClick={handleContinue}
                        variant="primary"
                      >
                        Next Lesson
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quiz Lesson */}
                {currentLesson?.type === 'quiz' && !quizCompleted && (
                  <div>
                    {currentLesson.questions && currentLesson.questions.map((question, index) => {
                      // Convert question to AdminQuizQuestion format if needed
                      const adminQuestion = 'options' in question && Array.isArray(question.options) &&
                        typeof question.options[0] === 'object' ?
                        question as unknown as AdminQuizQuestion :
                        {
                          id: question.id,
                          question: question.question || '',
                          options: (question.options || []).map((opt, i) =>
                            typeof opt === 'string' ? {id: `option-${i}`, text: opt } : opt
                          ),
                          correctAnswer: Array.isArray(question.correctAnswer) ?
                            question.correctAnswer[0] || '' :
                            question.correctAnswer || '',
                          explanation: question.explanation
                      } as AdminQuizQuestion;

                      // Convert admin question to frontend format
                      const frontendQuestion = adaptAdminQuestionToFrontend(adminQuestion);

                      return (
                        <div key={frontendQuestion.id} className={index > 0 ? 'mt-8' : ''}>
                          <QuizQuestion
                            question={frontendQuestion}
                            onAnswer={handleAnswerSubmit}
                            questionNumber={index + 1}
                            totalQuestions={currentLesson.questions?.length || 0}
                            userAnswer={userAnswers[frontendQuestion.id]}
                            courseId={courseId}
                            lessonId={currentLesson.id}
                          />
                        </div>
                      );
                  })}

                    <div className="flex justify-between mt-8">
                      <Button
                        onClick={() => {
                          if (currentLessonIndex > 0) {
                            setCurrentLessonIndex(currentLessonIndex - 1);
                        } else if (currentModuleIndex > 0) {
                            setCurrentModuleIndex(currentModuleIndex - 1);
                            const prevModuleLessons = lessons[modules[currentModuleIndex - 1]?.id] || [];
                            setCurrentLessonIndex(prevModuleLessons.length - 1);
                        }
                      }}
                        variant="outline"
                        disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
                      >
                        Previous Lesson
                      </Button>

                      <Button
                        onClick={handleQuizComplete}
                        variant="primary"
                        disabled={Object.keys(userAnswers).length < (currentLesson.questions?.length || 0)}
                      >
                        Submit Quiz
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quiz Results */}
                {currentLesson?.type === 'quiz' && quizCompleted && (
                  <QuizResults
                    score={quizScore}
                    totalQuestions={currentLesson.questions?.length || 0}
                    passingScore={70}
                    questions={(currentLesson.questions || []).map(q => adaptAdminQuestionToFrontend(convertToAdminQuizQuestion(q)))}
                    userAnswers={userAnswers}
                    onRetake={handleQuizRetry}
                    onContinue={handleContinue}
                  />
                )}

                {/* Certificate Generation */}
                {certificateGenerated && (
                  <div className="text-center">
                    <div className="mb-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                      <p className="text-xl text-neutral-600 mb-6">
                        You have successfully completed the {course.title} course.
                      </p>
                    </div>

                    <div className="mb-8">
                      <ClientSideCertificateGenerator
                        userName={user?.displayName || user?.email || 'Student'}
                        courseName={course.title}
                        completionDate={new Date()}
                        certificateId={`CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`}
                        onGenerate={handleCertificateGenerated}
                        autoGenerate={true}
                      />
                    </div>

                    {certificateUrl && (
                      <div className="mb-8">
                        <a
                          href={certificateUrl}
                          download={`${course.title.replace(/\s+/g, '_')}_Certificate.pdf`}
                          className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-600 transition-colors duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Certificate
                        </a>
                      </div>
                    )}

                    <div className="flex justify-center gap-4">
                      <Button
                        href="/my-learning"
                        variant="outline"
                      >
                        Back to My Learning
                      </Button>
                      <Button
                        href="/courses"
                        variant="primary"
                      >
                        Explore More Courses
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quiz Progress (for quiz lessons) */}
              {currentLesson?.type === 'quiz' && !quizCompleted && !certificateGenerated && (
                <div>
                  <QuizProgress
                    currentQuestion={0}
                    totalQuestions={currentLesson.questions?.length || 0}
                    answeredQuestions={Object.keys(userAnswers).map(id => id)}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CourseLearnContent;
