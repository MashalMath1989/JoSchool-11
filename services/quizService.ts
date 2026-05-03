import { Question, SubjectName } from '../types';
import { examsDatabase } from '../data/examsDatabase';

/**
 * Retrieves quizzes for a specific lesson title.
 * @param subject The name of the subject.
 * @param lessonTitle The title of the lesson.
 * @param chunkIndex Optional index of the question chunk (10 questions each).
 * @returns An array of questions if found, otherwise undefined.
 */
export const getQuizzesForLesson = (subject: SubjectName, lessonTitle: string, chunkIndex?: number): Question[] | undefined => {
  const chunks = examsDatabase[subject]?.[lessonTitle];
  if (!chunks) return undefined;
  
  if (chunkIndex !== undefined && chunks[chunkIndex]) {
    return chunks[chunkIndex];
  }
  
  return chunks.flat();
};

/**
 * Gets the number of question chunks for a specific lesson.
 */
export const getLessonChunksCount = (subject: SubjectName, lessonTitle: string): number => {
  const chunks = examsDatabase[subject]?.[lessonTitle];
  return chunks ? chunks.length : 0;
};

/**
 * Retrieves up to 40 random questions from all lessons in a unit.
 */
export const getQuizzesForUnit = (subject: SubjectName, unit: any): Question[] => {
  const allQuestions: Question[] = [];
  
  unit.lessons.forEach((lesson: any) => {
    const lessonQuestions = getQuizzesForLesson(subject, lesson.title);
    if (lessonQuestions) {
      allQuestions.push(...lessonQuestions);
    }
  });
  
  if (allQuestions.length === 0) return [];
  
  // Shuffle and pick 40
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 40);
};

/**
 * Checks if a subject has any exams loaded in the database.
 */
export const isSubjectLoaded = (subject: SubjectName): boolean => {
  const subjectData = examsDatabase[subject];
  return !!subjectData && Object.keys(subjectData).length > 0;
};
