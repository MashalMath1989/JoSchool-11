
import React from 'react';

export enum View {
  Landing,
  Textbooks,
  EnglishBooks,
  ComprehensiveExams,
  SubjectIndex,
  Quiz,
  SessionSubjects,
  PdfViewer,
  Progress,
  Favorites,
}

export enum Grade {
  Eleventh = 2009,
}

export enum Semester {
  First = "الفصل الأول",
  Second = "الفصل الثاني",
}

export enum SubjectName {
  JordanHistory = "تاريخ الأردن",
  IslamicEducation = "التربية الإسلامية",
  English = "اللغة الإنجليزية",
  Arabic = "اللغة العربية",
}

export interface Subject {
  id: SubjectName;
  coverImage: string;
  fontClass: 'font-naskh' | 'font-sans';
  semester: Semester;
  textbookUrl?: string;
  multiBooks?: { label: string; url: string }[];
}

export interface Lesson {
  title: string;
  page: number;
}

export interface Unit {
  title: string;
  lessons: Lesson[];
  imageUrl?: string;
}

export interface SubjectIndexData {
  [key: string]: Unit[];
}

export interface Question {
  number: number;
  question: string;
  choices: string[];
  correct_answer: string;
  page: string;
  source_text: string;
}

export interface QuizResult {
  subjectId: string;
  lessonTitle: string;
  examNumber?: number | null;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface FavoriteQuestion extends Question {
  subjectId: string;
  lessonTitle: string;
  semester?: string;
}

export interface ExamProgress {
  subjectId: string;
  lessonTitle: string;
  examNumber: number;
  currentQuestionIndex: number;
  userAnswers: (string | null)[];
  totalQuestions: number;
  lastUpdated: string;
}

export interface UserProgress {
  completedLessons: string[]; // Array of lesson titles or IDs
  quizResults: QuizResult[];
  favoriteQuestions: FavoriteQuestion[]; // Array of question objects
  examProgresses: Record<string, ExamProgress>;
  totalTimeSpent: number; // in seconds
  lastActive: string;
}
