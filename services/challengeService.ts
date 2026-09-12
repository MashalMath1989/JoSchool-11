import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    onSnapshot, 
    query, 
    Unsubscribe,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChallengeParticipant, FriendChallenge, Question } from '../types';

export enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
}

export interface FirestoreErrorInfo {
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
    };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const isPermissionError = 
        (error as any)?.code === 'permission-denied' || 
        (error instanceof Error && (
            error.message.toLowerCase().includes('permission-denied') || 
            error.message.toLowerCase().includes('insufficient permissions') ||
            error.message.toLowerCase().includes('missing or insufficient permissions')
        ));

    const errInfo: FirestoreErrorInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth?.currentUser?.uid,
            email: auth?.currentUser?.email,
            emailVerified: auth?.currentUser?.emailVerified,
            isAnonymous: auth?.currentUser?.isAnonymous,
            tenantId: auth?.currentUser?.tenantId,
            providerInfo: auth?.currentUser?.providerData?.map(provider => ({
                providerId: provider.providerId,
                email: provider.email,
            })) || []
        },
        operationType,
        path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    if (isPermissionError) {
        throw new Error(JSON.stringify(errInfo));
    }
}

/**
 * Sanitizes data for Firestore by removing any undefined keys and converting
 * undefined values inside arrays to empty strings or null.
 * Firestore strictly rejects documents or fields containing `undefined`.
 */
export const sanitizeForFirestore = <T>(val: T): T => {
    if (val === undefined) {
        return null as unknown as T;
    }
    if (val === null || typeof val !== 'object') {
        return val;
    }
    // Protect special Firestore types like serverTimestamp() or Timestamps
    if (
        typeof (val as any)?.toMillis === 'function' || 
        (val as any)?._methodName !== undefined ||
        (val as any)?.constructor?.name === 'FieldValue'
    ) {
        return val;
    }
    if (Array.isArray(val)) {
        return val.map(item => (item === undefined ? '' : sanitizeForFirestore(item))) as unknown as T;
    }
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) {
            clean[k] = sanitizeForFirestore(v);
        }
    }
    return clean as T;
};

/**
 * Generates a clean 6-digit challenge code (e.g. 582914)
 */
export const generateChallengeCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Creates a new Friend Challenge in Firestore
 */
export const createChallenge = async (
    data: {
        creatorId: string;
        creatorName: string;
        subjectId: string;
        subjectName: string;
        lessonTitle: string;
        examNumber?: number | null;
        questions: Question[];
        initialParticipant?: Partial<ChallengeParticipant>;
    }
): Promise<FriendChallenge> => {
    const code = generateChallengeCode();
    const challengeId = code;

    const newChallenge: FriendChallenge = {
        id: challengeId,
        code,
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        lessonTitle: data.lessonTitle,
        examNumber: data.examNumber ?? null,
        questions: data.questions,
        totalQuestions: data.questions.length,
        createdAt: new Date().toISOString(),
        status: 'active',
        participantsCount: 1
    };

    // Save challenge document
    const challengePath = `challenges/${challengeId}`;
    try {
        const challengeRef = doc(db, 'challenges', challengeId);
        await setDoc(challengeRef, {
            ...sanitizeForFirestore(newChallenge),
            serverCreatedAt: serverTimestamp()
        });
    } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, challengePath);
        throw err;
    }

    // Add creator as initial participant
    const participantId = data.initialParticipant?.id || data.creatorId || `p_${Date.now()}`;
    const participantPath = `challenges/${challengeId}/participants/${participantId}`;
    
    const participantData: ChallengeParticipant = {
        id: participantId,
        name: data.initialParticipant?.name || data.creatorName,
        avatar: data.initialParticipant?.avatar || '',
        score: data.initialParticipant?.score ?? 0,
        totalQuestions: data.questions.length,
        percentage: data.initialParticipant?.percentage ?? 0,
        timeSpent: data.initialParticipant?.timeSpent ?? 0,
        userAnswers: (data.initialParticipant?.userAnswers ?? []).map(a => a ?? ''),
        status: data.initialParticipant?.status ?? 'in_progress',
    };

    if (data.initialParticipant?.completedAt) {
        participantData.completedAt = data.initialParticipant.completedAt;
    } else if (data.initialParticipant?.status === 'completed') {
        participantData.completedAt = new Date().toISOString();
    }

    try {
        const participantRef = doc(db, 'challenges', challengeId, 'participants', participantId);
        await setDoc(participantRef, sanitizeForFirestore(participantData));
    } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, participantPath);
        throw err;
    }

    return newChallenge;
};

/**
 * Fetches a challenge by its 6-digit code or ID
 */
export const getChallengeByCode = async (code: string): Promise<FriendChallenge | null> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;

    const path = `challenges/${cleanCode}`;
    try {
        const challengeRef = doc(db, 'challenges', cleanCode);
        const snapshot = await getDoc(challengeRef);
        if (snapshot.exists()) {
            return snapshot.data() as FriendChallenge;
        }
        return null;
    } catch (error) {
        console.error('Error fetching challenge by code:', error);
        handleFirestoreError(error, OperationType.GET, path);
        return null;
    }
};

/**
 * Registers or updates a participant joining a challenge
 */
export const joinChallengeRoom = async (
    challengeId: string, 
    participant: {
        id: string;
        name: string;
        avatar?: string;
    }
): Promise<void> => {
    const participantPath = `challenges/${challengeId}/participants/${participant.id}`;
    try {
        const participantRef = doc(db, 'challenges', challengeId, 'participants', participant.id);
        const existing = await getDoc(participantRef);

        if (!existing.exists()) {
            const newParticipant: ChallengeParticipant = {
                id: participant.id,
                name: participant.name,
                avatar: participant.avatar || '',
                score: 0,
                totalQuestions: 0,
                percentage: 0,
                timeSpent: 0,
                userAnswers: [],
                status: 'in_progress'
            };
            await setDoc(participantRef, sanitizeForFirestore(newParticipant));
        }
    } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, participantPath);
        throw err;
    }
};

/**
 * Submits the final result for a participant in a challenge
 */
export const submitChallengeResult = async (
    challengeId: string,
    participantId: string,
    result: {
        score: number;
        totalQuestions: number;
        percentage: number;
        timeSpent: number;
        userAnswers?: (string | undefined)[];
    }
): Promise<void> => {
    const participantPath = `challenges/${challengeId}/participants/${participantId}`;
    try {
        const participantRef = doc(db, 'challenges', challengeId, 'participants', participantId);
        const updates: Record<string, any> = {
            score: result.score ?? 0,
            totalQuestions: result.totalQuestions ?? 0,
            percentage: result.percentage ?? 0,
            timeSpent: result.timeSpent ?? 0,
            userAnswers: (result.userAnswers || []).map(a => a ?? ''),
            status: 'completed',
            completedAt: new Date().toISOString()
        };
        await updateDoc(participantRef, sanitizeForFirestore(updates));
    } catch (error) {
        console.error('Error submitting challenge result:', error);
        handleFirestoreError(error, OperationType.UPDATE, participantPath);
    }
};

/**
 * Real-time listener for challenge document updates
 */
export const subscribeToChallenge = (
    challengeId: string, 
    callback: (challenge: FriendChallenge | null) => void
): Unsubscribe => {
    const path = `challenges/${challengeId}`;
    const challengeRef = doc(db, 'challenges', challengeId);
    return onSnapshot(challengeRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as FriendChallenge);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error('Challenge snapshot error:', error);
        handleFirestoreError(error, OperationType.GET, path);
    });
};

/**
 * Real-time listener for challenge participants (Leaderboard & Results comparison)
 * Sorted by score desc, then timeSpent asc
 */
export const subscribeToChallengeParticipants = (
    challengeId: string,
    callback: (participants: ChallengeParticipant[]) => void
): Unsubscribe => {
    const path = `challenges/${challengeId}/participants`;
    const participantsCol = collection(db, 'challenges', challengeId, 'participants');
    return onSnapshot(participantsCol, (snapshot) => {
        const list: ChallengeParticipant[] = [];
        snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as ChallengeParticipant);
        });

        // Sort: completed first, then highest score, then lowest time spent
        list.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return -1;
            if (b.status === 'completed' && a.status !== 'completed') return 1;
            if (b.score !== a.score) return b.score - a.score;
            return a.timeSpent - b.timeSpent;
        });

        callback(list);
    }, (error) => {
        console.error('Participants snapshot error:', error);
        handleFirestoreError(error, OperationType.GET, path);
    });
};

/**
 * Generates direct share URL for a challenge
 */
export const generateShareUrl = (code: string): string => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?challenge=${encodeURIComponent(code)}`;
};

/**
 * Formats WhatsApp invitation message in Arabic
 */
export const generateInviteMessage = (challenge: FriendChallenge, inviteUrl: string): string => {
    return `🏆 *تحدي الأصدقاء في JoSchool11!*\n\n` +
           `أتحداك في اختبار: *${challenge.subjectName}* 📚\n` +
           `الموضوع: *${challenge.lessonTitle}*\n` +
           `عدد الأسئلة: *${challenge.totalQuestions} أسئلة*\n\n` +
           `من سينهي الاختبار أولاً وبأعلى علامة؟ ⏱️🔥\n\n` +
           `🔗 *رابط الانضمام للتحدي مباشرة:*\n${inviteUrl}\n\n` +
           `🔑 أو استخدم رمز التحدي: *${challenge.code}*`;
};

/**
 * Formats WhatsApp result comparison message in Arabic
 */
export const generateResultsShareMessage = (
    challenge: FriendChallenge, 
    participants: ChallengeParticipant[],
    inviteUrl: string
): string => {
    const topThree = participants.filter(p => p.status === 'completed').slice(0, 3);
    const podiumMedals = ['🥇', '🥈', '🥉'];
    
    let ranksText = '';
    topThree.forEach((p, idx) => {
        ranksText += `${podiumMedals[idx] || '🎖️'} *${p.name}*: ${p.score}/${p.totalQuestions} (${Math.round(p.percentage)}%) - ${Math.floor(p.timeSpent / 60)}د ${p.timeSpent % 60}ث\n`;
    });

    return `⚔️ *نتائج تحدي الأصدقاء - JoSchool11* 🏆\n\n` +
           `المادة: *${challenge.subjectName}* (${challenge.lessonTitle})\n\n` +
           `📊 *لوحة الترتيب والمقارنة:*\n${ranksText || 'لا توجد نتائج بعد'}\n` +
           `🔗 *شاهد تفاصيل المقارنة وانضم للتحدي:*\n${inviteUrl}`;
};
