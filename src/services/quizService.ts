import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';

// Define types
export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  moduleId?: string;
  moduleName?: string;
  timeLimit?: number;
  passingScore: number;
  questions: Question[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  attempts: number;
  averageScore?: number;
  questionsCount: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  options: {
    id: string;
    text: string;
}[];
  correctOptionId: string;
  points: number;
}

export interface Course {
  id: string;
  title: string;
}

export interface Module {
  id: string;
  title: string;
}

/**
 * Fetch all published courses for quiz creation
 */
export const fetchCoursesForQuizzes = async (): Promise<Course[]> => {
  try {
    const coursesRef = collection(firestore, 'courses');
    const q = query(
      coursesRef,
      where('status', '==', 'published'),
      orderBy('title', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const courses: Course[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      courses.push({
        id: doc.id,
        title: (data.title as string) || 'Untitled Course'
    });
  });

    return courses;
} catch (error) {
    console.error('Error fetching courses for quizzes:', error);
    throw error;
}
};

/**
 * Fetch modules for a specific course
 */
export const fetchModulesForCourse = async (courseId: string): Promise<Module[]> => {
  try {
    const modulesRef = collection(firestore, `courses/${courseId}/modules`);
    const q = query(modulesRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const modules: Module[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      modules.push({
        id: doc.id,
        title: (data.title as string) || 'Untitled Module'
    });
  });

    return modules;
} catch (error) {
    console.error('Error fetching modules for course:', error);
    throw error;
}
};

/**
 * Create a new quiz
 */
export const createQuiz = async (quizData: Quiz): Promise<string> => {
  try {
    // Get course and module names if IDs are provided
    let courseName = '';
    let moduleName = '';

    if (quizData.courseId) {
      const courseDoc = await getDoc(doc(firestore, 'courses', quizData.courseId));
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        courseName = (courseData.title as string) || '';
    }

      if (quizData.moduleId) {
        const moduleDoc = await getDoc(doc(firestore, `courses/${quizData.courseId}/modules/${quizData.moduleId}`));
        if (moduleDoc.exists()) {
          const moduleData = moduleDoc.data();
          moduleName = (moduleData.title as string) || '';
      }
    }
  }

    const now = new Date().toISOString();

    // Prepare quiz data for Firestore
    const newQuiz = {
      ...quizData,
      courseName,
      moduleName,
      createdAt: now,
      updatedAt: now,
      attempts: 0,
      questionsCount: quizData.questions.length
  };

    // Remove the temporary ID from the quiz data
    const {id, ...quizWithoutId } = newQuiz;

    // Add quiz to Firestore
    const quizRef = collection(firestore, 'quizzes');

    // Log the quiz data being saved
    console.log('Saving quiz with temporary ID:', id);

    const docRef = await addDoc(quizRef, {
      ...quizWithoutId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
  });

    console.log('Quiz saved with Firestore ID:', docRef.id);
    return docRef.id;
} catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
}
};

/**
 * Fetch all quizzes
 */
export const fetchQuizzes = async (): Promise<Quiz[]> => {
  try {
    const quizRef = collection(firestore, 'quizzes');
    const quizSnapshot = await getDocs(quizRef);

    return quizSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: (data.title as string) || '',
        description: (data.description as string) || '',
        courseId: data.courseId as string | undefined,
        courseName: data.courseName as string | undefined,
        moduleId: data.moduleId as string | undefined,
        moduleName: data.moduleName as string | undefined,
        timeLimit: data.timeLimit as number | undefined,
        passingScore: (data.passingScore as number) || 70,
        questions: (data.questions as Question[]) || [],
        status: (data.status as 'draft' | 'published' | 'archived') || 'draft',
        createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt && typeof data.createdAt.toDate === 'function'
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt as string) || new Date().toISOString(),
        updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt && typeof data.updatedAt.toDate === 'function'
          ? data.updatedAt.toDate().toISOString()
          : (data.updatedAt as string) || new Date().toISOString(),
        attempts: (data.attempts as number) || 0, // Always provide a default value
        averageScore: data.averageScore as number | undefined,
        questionsCount: (data.questionsCount as number) || ((data.questions as Question[] | undefined)?.length || 0)
    };
  });
} catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
}
};

/**
 * Delete a quiz
 */
export const deleteQuiz = async (quizId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, 'quizzes', quizId));
} catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
}
};

/**
 * Update quiz status
 */
export const updateQuizStatus = async (quizId: string, status: 'draft' | 'published' | 'archived'): Promise<void> => {
  try {
    const quizRef = doc(firestore, 'quizzes', quizId);
    await updateDoc(quizRef, {
      status,
      updatedAt: serverTimestamp()
  });
} catch (error) {
    console.error('Error updating quiz status:', error);
    throw error;
}
};

/**
 * Fetch a single quiz by ID
 */
export const getQuiz = async (quizId: string): Promise<Quiz> => {
  try {
    const quizRef = doc(firestore, 'quizzes', quizId);
    const quizDoc = await getDoc(quizRef);

    if (!quizDoc.exists()) {
      throw new Error('Quiz not found');
  }

    const data = quizDoc.data();
    return {
      id: quizDoc.id,
      title: (data.title as string) || '',
      description: (data.description as string) || '',
      courseId: data.courseId as string | undefined,
      courseName: data.courseName as string | undefined,
      moduleId: data.moduleId as string | undefined,
      moduleName: data.moduleName as string | undefined,
      timeLimit: data.timeLimit as number | undefined,
      passingScore: (data.passingScore as number) || 70,
      questions: (data.questions as Question[]) || [],
      status: (data.status as 'draft' | 'published' | 'archived') || 'draft',
      createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string) || new Date().toISOString(),
      updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt && typeof data.updatedAt.toDate === 'function'
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string) || new Date().toISOString(),
      attempts: (data.attempts as number) || 0, // Always provide a default value
      averageScore: data.averageScore as number | undefined,
      questionsCount: (data.questionsCount as number) || ((data.questions as Question[] | undefined)?.length || 0)
  };
} catch (error) {
    console.error('Error fetching quiz:', error);
    throw error;
}
};

/**
 * Alias for getQuiz - Fetch a single quiz by ID
 * @deprecated Use getQuiz instead
 */
export const fetchQuizById = getQuiz;

/**
 * Update a quiz
 */
export const updateQuiz = async (quizId: string, quizData: Partial<Quiz>): Promise<void> => {
  try {
    const quizRef = doc(firestore, 'quizzes', quizId);

    // Ensure passingScore is included in the update
    await updateDoc(quizRef, {
      ...quizData,
      // Only update passingScore if it's provided, otherwise keep existing value
      ...(quizData.passingScore !== undefined ? {passingScore: quizData.passingScore } : {}),
      updatedAt: serverTimestamp()
  });
} catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
}
};









