import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProgress } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isPermissionError = 
      (error as any)?.code === 'permission-denied' || 
      (error instanceof Error && (
          error.message.toLowerCase().includes('permission-denied') || 
          error.message.toLowerCase().includes('insufficient permissions') ||
          error.message.toLowerCase().includes('missing or insufficient')
      ));

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isPermissionError) {
    console.error('Firestore Error (Permission Denied): ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    // For non-permission errors (like network offline, deadline exceeded), keep them as informational warnings
    // to allow the application to seamlessly work with offline mode without background crashes.
    console.warn('Firestore Network/Offline Alert: ', JSON.stringify(errInfo));
  }
}

export const saveUserProgress = async (userId: string, progress: UserProgress) => {
  const path = `users/${userId}`;
  try {
    const userDoc = doc(db, 'users', userId);
    await setDoc(userDoc, {
      ...progress,
      userId,
      email: auth.currentUser?.email,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
  const path = `users/${userId}`;
  try {
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const subscribeToUserProgress = (userId: string, callback: (progress: UserProgress | null) => void) => {
  const path = `users/${userId}`;
  const userDoc = doc(db, 'users', userId);
  return onSnapshot(userDoc, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserProgress);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export interface QuestionReportData {
  subject?: string;
  unitTitle?: string;
  examTitle?: string;
  questionNumber?: number;
  questionText: string;
  choices?: string[];
  correctAnswer?: string;
  explanation?: string;
  studentReport: string;
  studentEmail?: string;
  studentUid?: string;
}

export const submitQuestionReport = async (report: QuestionReportData): Promise<boolean> => {
  const path = 'questionReports';
  try {
    const cleanData: Record<string, any> = {
      questionText: report.questionText || '',
      studentReport: report.studentReport.trim(),
      status: 'new',
      createdAt: serverTimestamp()
    };

    if (report.subject) cleanData.subject = report.subject;
    if (report.unitTitle) cleanData.unitTitle = report.unitTitle;
    if (report.examTitle) cleanData.examTitle = report.examTitle;
    if (typeof report.questionNumber === 'number') cleanData.questionNumber = report.questionNumber;
    if (Array.isArray(report.choices) && report.choices.length > 0) cleanData.choices = report.choices;
    if (report.correctAnswer) cleanData.correctAnswer = report.correctAnswer;
    if (report.explanation) cleanData.explanation = report.explanation;

    const currentUser = auth.currentUser;
    if (currentUser?.email) {
      cleanData.studentEmail = currentUser.email;
    } else if (report.studentEmail) {
      cleanData.studentEmail = report.studentEmail;
    }

    if (currentUser?.uid) {
      cleanData.studentUid = currentUser.uid;
    } else if (report.studentUid) {
      cleanData.studentUid = report.studentUid;
    }

    const reportsCol = collection(db, path);
    await addDoc(reportsCol, cleanData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

/**
 * Delete all Firestore data belonging to the user
 * Required before deleting Firebase Auth user so security rules permit deletion
 */
export const deleteUserFirestoreData = async (userId: string): Promise<void> => {
  const path = `users/${userId}`;
  try {
    const userDoc = doc(db, 'users', userId);
    await deleteDoc(userDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};


