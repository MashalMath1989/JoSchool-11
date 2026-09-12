import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, 
    Users, 
    Share2, 
    Copy, 
    Check, 
    X,
    Play, 
    Clock, 
    Sparkles, 
    ArrowRight, 
    ArrowLeft,
    CheckCircle2, 
    XCircle, 
    AlertCircle,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Flame,
    Award,
    Lock
} from 'lucide-react';
import { Question, Subject, SubjectName, UserProgress } from './types';
import { subjectsData, subjectIndexData } from './data';
import { getQuizzesForLesson, getLessonChunksCount, getQuizzesForUnit } from './services/quizService';
import { examsDatabase } from './data/examsDatabase';
import { 
    createChallenge, 
    getChallengeByCode, 
    joinChallengeRoom, 
    subscribeToChallenge, 
    subscribeToChallengeParticipants,
    generateShareUrl,
    generateInviteMessage,
    generateResultsShareMessage
} from './services/challengeService';
import { FriendChallenge, ChallengeParticipant } from './types';
import { MathRenderer } from './textRenderer';
import { TrigGraph } from './TrigGraph';
import { isMathSubject, checkIsChoiceCorrect } from './shareUtils';
import { fetchExamQuestions } from './data/jsonParser';

interface FriendChallengePageProps {
    onBack: () => void;
    startChallengeQuiz: (challenge: FriendChallenge, participantId: string, participantName: string) => void;
    userProgress?: UserProgress;
    initialChallengeCode?: string | null;
    initialChallenge?: FriendChallenge | null;
    userEmail?: string;
    userName?: string;
    onViewHome: () => void;
    lastUserAnswers?: (string | undefined)[];
}

export const FriendChallengePage: React.FC<FriendChallengePageProps> = ({
    onBack,
    startChallengeQuiz,
    userProgress,
    initialChallengeCode,
    initialChallenge,
    userEmail,
    userName,
    onViewHome,
    lastUserAnswers
}) => {
    // Current user identification
    const defaultName = userName || userProgress?.studentProfile?.name || (userEmail ? userEmail.split('@')[0] : 'طالب مبدع');
    const defaultUserId = userEmail || `student_${Date.now()}`;

    // Active Challenge Room state (initialized immediately from prop if provided)
    const [currentChallenge, setCurrentChallenge] = useState<FriendChallenge | null>(initialChallenge || null);

    // Tabs: 'active' | 'create' | 'join'
    const [activeTab, setActiveTab] = useState<'active' | 'create' | 'join'>(
        (initialChallenge || initialChallengeCode) ? 'active' : 'create'
    );

    // Create challenge state
    const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectName>(SubjectName.Math);
    const [selectedUnitIdx, setSelectedUnitIdx] = useState<number>(0);
    const [selectedLessonIdx, setSelectedLessonIdx] = useState<number>(0);
    const [selectedChunkIdx, setSelectedChunkIdx] = useState<number>(0);
    const [questionCountLimit, setQuestionCountLimit] = useState<number>(10);
    const [creatorDisplayName, setCreatorDisplayName] = useState<string>(defaultName);
    const [isCreating, setIsCreating] = useState<boolean>(false);

    // Join challenge state
    const [inputCode, setInputCode] = useState<string>(initialChallenge?.code || initialChallengeCode || '');
    const [joinerName, setJoinerName] = useState<string>(defaultName);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    // Active Challenge Room state
    const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
    const [copiedLink, setCopiedLink] = useState<boolean>(false);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);
    const [showQuestionsReview, setShowQuestionsReview] = useState<boolean>(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

    // If initialChallenge or initialChallengeCode provided on mount, ensure challenge is ready
    useEffect(() => {
        if (initialChallenge) {
            setCurrentChallenge(initialChallenge);
            if (initialChallenge.code) setInputCode(initialChallenge.code);
            setActiveTab('active');
        } else if (initialChallengeCode) {
            setInputCode(initialChallengeCode);
            handleFetchChallenge(initialChallengeCode);
        }
    }, [initialChallenge, initialChallengeCode]);

    // Subscribe to active challenge room
    useEffect(() => {
        if (!currentChallenge?.id) return;

        const unsubChallenge = subscribeToChallenge(currentChallenge.id, (updated) => {
            if (updated) setCurrentChallenge(updated);
        });

        const unsubParticipants = subscribeToChallengeParticipants(currentChallenge.id, (list) => {
            setParticipants(list);
        });

        return () => {
            unsubChallenge();
            unsubParticipants();
        };
    }, [currentChallenge?.id]);

    const handleFetchChallenge = async (code: string): Promise<FriendChallenge | null> => {
        setIsJoining(true);
        setJoinError(null);
        try {
            const found = await getChallengeByCode(code);
            if (found) {
                setCurrentChallenge(found);
                setActiveTab('active');
                return found;
            } else {
                setJoinError('لم يتم العثور على تحدٍ بهذا الرمز. تأكد من صحة الرمز.');
                return null;
            }
        } catch (e) {
            setJoinError('حدث خطأ أثناء تحميل التحدي. يرجى المحاولة مرة أخرى.');
            return null;
        } finally {
            setIsJoining(false);
        }
    };

    // Derived subject & unit data for Creation tab
    const subjectUnits = subjectIndexData[selectedSubjectId] || [];
    const currentUnit = subjectUnits[selectedUnitIdx] || subjectUnits[0];
    const currentLessons = currentUnit?.lessons || [];
    const currentLesson = currentLessons[selectedLessonIdx] || currentLessons[0];
    const chunksCount = currentLesson ? getLessonChunksCount(selectedSubjectId, currentLesson.title) : 0;

    const handleCreateChallengeSubmit = async () => {
        if (!currentLesson) return;
        setIsCreating(true);

        try {
            let questions: Question[] = [];
            
            if (chunksCount > 0) {
                let chunkQs = getQuizzesForLesson(selectedSubjectId, currentLesson.title, selectedChunkIdx);
                if (!chunkQs || chunkQs.length === 0) {
                    chunkQs = await fetchExamQuestions(
                        selectedSubjectId,
                        currentLesson.title,
                        selectedChunkIdx,
                        currentUnit?.title,
                        selectedUnitIdx,
                        selectedLessonIdx,
                        currentLesson.url
                    );
                }
                if (chunkQs && chunkQs.length > 0) {
                    questions = chunkQs;
                }
            }

            if (questions.length === 0) {
                let allLessonQs = getQuizzesForLesson(selectedSubjectId, currentLesson.title);
                if (!allLessonQs || allLessonQs.length === 0) {
                    allLessonQs = await fetchExamQuestions(
                        selectedSubjectId,
                        currentLesson.title,
                        0,
                        currentUnit?.title,
                        selectedUnitIdx,
                        selectedLessonIdx,
                        currentLesson.url
                    );
                }
                if (allLessonQs && allLessonQs.length > 0) {
                    questions = allLessonQs;
                }
            }

            // Fallback to unit questions
            if (questions.length === 0 && currentUnit) {
                questions = getQuizzesForUnit(selectedSubjectId, currentUnit);
            }

            // Fallback to any loaded questions from this subject
            if (questions.length === 0 && examsDatabase[selectedSubjectId]) {
                const subjectLessons = examsDatabase[selectedSubjectId];
                if (subjectLessons) {
                    for (const lKey of Object.keys(subjectLessons)) {
                        const chunkArr = subjectLessons[lKey];
                        if (Array.isArray(chunkArr)) {
                            for (const chunk of chunkArr) {
                                if (Array.isArray(chunk) && chunk.length > 0) {
                                    questions.push(...chunk);
                                    if (questions.length >= 20) break;
                                }
                            }
                        }
                        if (questions.length >= 20) break;
                    }
                }
            }

            // Limit questions count if chosen
            if (questionCountLimit > 0 && questions.length > questionCountLimit) {
                // Shuffle and pick
                questions = [...questions].sort(() => 0.5 - Math.random()).slice(0, questionCountLimit);
            }

            if (questions.length === 0) {
                alert('عذراً، لم تتوفر أسئلة لهذا الدرس حالياً. يرجى اختيار درس آخر.');
                setIsCreating(false);
                return;
            }

            const examLabel = chunksCount > 0 ? `امتحان (${selectedChunkIdx + 1})` : 'امتحان عام';
            const fullLessonTitle = `${currentLesson.title} - ${examLabel}`;

            const newChal = await createChallenge({
                creatorId: defaultUserId,
                creatorName: creatorDisplayName.trim() || defaultName,
                subjectId: selectedSubjectId,
                subjectName: selectedSubjectId,
                lessonTitle: fullLessonTitle,
                examNumber: selectedChunkIdx + 1,
                questions: questions,
                initialParticipant: {
                    id: defaultUserId,
                    name: creatorDisplayName.trim() || defaultName,
                    status: 'in_progress'
                }
            });

            setCurrentChallenge(newChal);
            setActiveTab('active');
        } catch (error) {
            console.error('Error creating challenge:', error);
            alert('حدث خطأ أثناء إنشاء التحدي. يرجى المحاولة ثانية.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputCode.trim()) {
            setJoinError('يرجى إدخال رمز التحدي');
            return;
        }

        setIsJoining(true);
        setJoinError(null);
        try {
            const found = await getChallengeByCode(inputCode.trim());
            if (!found) {
                setJoinError('رمز التحدي غير صحيح أو تم انتهاء صلاحيته.');
                setIsJoining(false);
                return;
            }

            const participantId = defaultUserId;
            await joinChallengeRoom(found.id, {
                id: participantId,
                name: joinerName.trim() || defaultName
            });

            setCurrentChallenge(found);
            setActiveTab('active');
        } catch (err) {
            console.error('Error joining challenge:', err);
            setJoinError('تعذر الانضمام للتحدي حالياً.');
        } finally {
            setIsJoining(false);
        }
    };

    // WhatsApp invitation
    const handleShareWhatsAppInvite = () => {
        if (!currentChallenge) return;
        const url = generateShareUrl(currentChallenge.code);
        const text = generateInviteMessage(currentChallenge, url);
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    // WhatsApp results
    const handleShareWhatsAppResults = () => {
        if (!currentChallenge) return;
        const url = generateShareUrl(currentChallenge.code);
        const text = generateResultsShareMessage(currentChallenge, participants, url);
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Copy direct link
    const handleCopyLink = async () => {
        if (!currentChallenge) return;
        const url = generateShareUrl(currentChallenge.code);
        try {
            await navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        } catch (err) {
            // Fallback
            prompt('انسخ رابط التحدي التالي:', url);
        }
    };

    // Copy code
    const handleCopyCode = async () => {
        if (!currentChallenge) return;
        try {
            await navigator.clipboard.writeText(currentChallenge.code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2500);
        } catch (err) {
            prompt('انسخ رمز التحدي التالي:', currentChallenge.code);
        }
    };

    // Check if current user has completed this challenge
    const currentParticipant = participants.find(p => p.id === defaultUserId || p.name === defaultName);
    const hasCompleted = currentParticipant?.status === 'completed';

    // List of participants with recorded answers (only active once user has completed)
    const participantsWithAnswers = hasCompleted 
        ? participants.filter(p => 
            (p.userAnswers && p.userAnswers.length > 0) || 
            ((p.id === defaultUserId || p.name === defaultName) && lastUserAnswers && lastUserAnswers.length > 0)
        )
        : [];

    // Active participant for answer review
    const activeReviewParticipant = hasCompleted
        ? ((selectedParticipantId ? participants.find(p => p.id === selectedParticipantId) : null) ||
           (currentParticipant?.userAnswers && currentParticipant.userAnswers.length > 0 ? currentParticipant : null) ||
           (lastUserAnswers && lastUserAnswers.length > 0 && currentParticipant ? currentParticipant : null) ||
           participantsWithAnswers[0] ||
           currentParticipant ||
           participants[0])
        : null;

    // Array of answers for the active review participant
    const activeReviewAnswers: (string | undefined)[] = hasCompleted
        ? (((activeReviewParticipant?.id === defaultUserId || activeReviewParticipant?.name === defaultName) && 
            (!activeReviewParticipant?.userAnswers || activeReviewParticipant.userAnswers.length === 0) && 
            lastUserAnswers && lastUserAnswers.length > 0)
                ? lastUserAnswers
                : (activeReviewParticipant?.userAnswers || []))
        : [];

    // Instant, single-click quiz start handler
    const handleStartChallengeQuiz = useCallback((e?: React.SyntheticEvent) => {
        if (e) {
            e.stopPropagation();
        }

        const target = currentChallenge || initialChallenge;
        if (!target) {
            console.warn('handleStartChallengeQuiz: no target challenge available');
            return;
        }

        const questions = Array.isArray(target.questions) ? target.questions : [];
        if (questions.length === 0) {
            console.warn('handleStartChallengeQuiz: questions empty or loading, fetching afresh...');
            if (target.code) {
                handleFetchChallenge(target.code).then((fresh) => {
                    if (fresh && Array.isArray(fresh.questions) && fresh.questions.length > 0) {
                        startChallengeQuiz(fresh, defaultUserId, defaultName);
                    }
                });
            }
            return;
        }

        // Register participant asynchronously in background without delaying quiz start
        try {
            joinChallengeRoom(target.id, {
                id: defaultUserId,
                name: defaultName
            }).catch(err => console.warn('Background joinChallengeRoom error:', err));
        } catch {
            // Ignore background registration errors
        }

        // Immediately launch quiz on the very first click
        startChallengeQuiz(target, defaultUserId, defaultName);
    }, [currentChallenge, initialChallenge, defaultUserId, defaultName, startChallengeQuiz]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans select-none" dir="rtl">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-40 bg-white border-b-2 border-slate-900 shadow-sm">
                <div className="container mx-auto px-4 py-3 max-w-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-900 active:scale-95 transition-all text-slate-800"
                            title="العودة"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-amber-400 border border-slate-900 flex items-center justify-center text-slate-950 shadow-2xs">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-base sm:text-lg font-black leading-tight text-slate-900">تحدي الأصدقاء</h1>
                                <p className="text-[10px] font-bold text-slate-500">نافس زملاءك في نفس الاختبار فورياً</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onViewHome}
                        className="text-xs font-black text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-900 transition-all active:scale-95"
                    >
                        الرئيسية
                    </button>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="flex border-t border-slate-200 gap-2 pt-2 pb-2">
                        {currentChallenge && (
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`flex-1 py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    activeTab === 'active' 
                                        ? 'bg-amber-400 text-slate-950 border border-slate-900 shadow-2xs' 
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                                }`}
                            >
                                <Flame className="w-4 h-4 text-amber-700" />
                                <span>غرفة التحدي الحالية</span>
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeTab === 'create' 
                                    ? 'bg-slate-900 text-white border border-slate-900 shadow-2xs' 
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                            }`}
                        >
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>إنشاء تحدٍ جديد</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('join')}
                            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeTab === 'join' 
                                    ? 'bg-slate-900 text-white border border-slate-900 shadow-2xs' 
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                            }`}
                        >
                            <Users className="w-4 h-4 text-sky-400" />
                            <span>الانضمام برمز</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-2xl mt-4">
                <AnimatePresence mode="wait">
                    {/* TAB 1: ACTIVE CHALLENGE ROOM & LIVE COMPARISON */}
                    {activeTab === 'active' && currentChallenge && (
                        <motion.div
                            key="active-tab"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-4"
                        >
                            {/* Room Header Card */}
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-900 shadow-md relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                                {currentChallenge.subjectName}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                                {currentChallenge.totalQuestions} أسئلة
                                            </span>
                                        </div>
                                        <h2 className="text-base sm:text-lg font-black text-slate-900">
                                            {currentChallenge.lessonTitle}
                                        </h2>
                                        <p className="text-xs text-slate-500 font-bold mt-0.5">
                                            أنشأ التحدي: <span className="text-slate-800">{currentChallenge.creatorName}</span>
                                        </p>
                                    </div>

                                    {/* 6-Digit Code Badge */}
                                    <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl border border-slate-800 text-center shadow-xs self-stretch sm:self-auto flex sm:flex-col items-center justify-between sm:justify-center gap-2">
                                        <span className="text-[10px] text-amber-400 font-black tracking-wider uppercase">رمز التحدي</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-mono font-black tracking-widest text-amber-300">{currentChallenge.code}</span>
                                            <button 
                                                onClick={handleCopyCode} 
                                                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                                                title="نسخ الرمز"
                                            >
                                                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Share & Invite Action Bar */}
                                <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-xs font-black text-emerald-700">مباشر: النتائج تتحدث لحظياً</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={handleCopyLink}
                                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-900 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                        >
                                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ الرابط'}</span>
                                        </button>

                                        <button
                                            onClick={handleShareWhatsAppInvite}
                                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs border border-slate-900 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                        >
                                            <Share2 className="w-3.5 h-3.5" />
                                            <span>دعوة عبر واتساب</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Start Quiz Call to Action if user hasn't finished yet - Responds immediately from first tap */}
                            {!hasCompleted && (
                                <div 
                                    onClick={handleStartChallengeQuiz}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="بدء امتحان التحدي"
                                    className="bg-gradient-to-r from-amber-400 to-amber-500 p-4 rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-between gap-3 text-slate-950 cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all touch-manipulation"
                                >
                                    <div className="flex-1 pointer-events-none">
                                        <h3 className="font-black text-sm sm:text-base">جاهز لخوض التحدي؟</h3>
                                        <p className="text-xs font-bold text-slate-800">ابدأ الاختبار الآن وقارن نتيجتك فوراً مع زملائك في القائمة أدناه!</p>
                                    </div>
                                    <button
                                        id="start-challenge-button"
                                        type="button"
                                        onClick={handleStartChallengeQuiz}
                                        className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 active:bg-slate-800 active:scale-95 text-amber-300 rounded-xl font-black text-xs sm:text-sm border border-slate-800 shadow-sm flex items-center gap-2 shrink-0 cursor-pointer transition-all duration-75 touch-manipulation select-none"
                                    >
                                        <Play className="w-4 h-4 fill-amber-300" />
                                        <span>بدء الاختبار</span>
                                    </button>
                                </div>
                            )}

                            {/* If user completed, show their personal badge & retry button */}
                            {hasCompleted && (
                                <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-emerald-900">لقد أتممت هذا التحدي بنجاح!</p>
                                            <p className="text-[11px] font-bold text-emerald-700">
                                                علامتك: {currentParticipant?.score} من {currentChallenge.totalQuestions} ({Math.round(currentParticipant?.percentage || 0)}%)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleShareWhatsAppResults}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg border border-slate-900 shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer touch-manipulation"
                                        >
                                            <Share2 className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">مشاركة الترتيب</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleStartChallengeQuiz}
                                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-900 shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer touch-manipulation"
                                            title="إعادة المحاولة"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>إعادة</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* LIVE RESULTS & COMPARISON LEADERBOARD */}
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-900 shadow-md">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-amber-500" />
                                        <h3 className="font-black text-base text-slate-900">لوحة مقارنة النتائج والترتيب</h3>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                        {participants.length} مشارك{participants.length === 1 ? '' : 'ين'}
                                    </span>
                                </div>

                                {participants.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 font-bold text-sm">
                                        في انتظار انضمام أو إنهاء المشاركين للاختبار...
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {participants.map((p, idx) => {
                                            const isYou = p.id === defaultUserId || p.name === defaultName;
                                            const isDone = p.status === 'completed';
                                            const medalColors = [
                                                'bg-amber-400 text-slate-950 border-amber-600', // 1st Gold
                                                'bg-slate-300 text-slate-900 border-slate-400', // 2nd Silver
                                                'bg-amber-700 text-white border-amber-900'     // 3rd Bronze
                                            ];
                                            const medalEmojis = ['🥇', '🥈', '🥉'];

                                            const hasParticipantAnswers = (p.userAnswers && p.userAnswers.length > 0) || (isYou && activeReviewAnswers.length > 0);
                                            const canReviewThisParticipant = hasCompleted && hasParticipantAnswers;
                                            const isSelectedForReview = hasCompleted && p.id === activeReviewParticipant?.id;

                                            return (
                                                <div 
                                                    key={p.id || idx}
                                                    onClick={() => {
                                                        if (canReviewThisParticipant) {
                                                            setSelectedParticipantId(p.id);
                                                            setShowQuestionsReview(true);
                                                        }
                                                    }}
                                                    className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                                        canReviewThisParticipant ? 'cursor-pointer' : ''
                                                    } ${
                                                        isSelectedForReview
                                                            ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-2 ring-amber-400/40'
                                                            : isYou 
                                                                ? 'bg-amber-50/50 border-amber-300' 
                                                                : 'bg-white border-slate-300 hover:border-slate-400'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {/* Rank or Medal */}
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border ${
                                                            isDone && idx < 3 ? medalColors[idx] : 'bg-slate-100 text-slate-700 border-slate-300'
                                                        }`}>
                                                            {isDone && idx < 3 ? medalEmojis[idx] : `${idx + 1}`}
                                                        </div>

                                                        {/* Name & Status */}
                                                        <div className="truncate">
                                                            <div className="flex items-center gap-1.5 truncate">
                                                                <span className="font-black text-sm text-slate-900 truncate">{p.name}</span>
                                                                {isYou && (
                                                                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
                                                                        أنت
                                                                    </span>
                                                                )}
                                                                {isSelectedForReview && (
                                                                    <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white font-bold text-[10px]">
                                                                        المعروض
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                                                                {isDone ? (
                                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        <span>أنهى الاختبار</span>
                                                                        {canReviewThisParticipant && (
                                                                            <span className="text-amber-700 mr-1 underline font-bold">
                                                                                (مراجعة إجاباته)
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-amber-600 animate-pulse">
                                                                        <Clock className="w-3 h-3" />
                                                                        <span>يحل الاختبار الآن...</span>
                                                                    </span>
                                                                )}
                                                                {isDone && p.timeSpent > 0 && (
                                                                    <span className="text-slate-400">
                                                                        ⏱️ {Math.floor(p.timeSpent / 60)}د {p.timeSpent % 60}ث
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score & Percentage */}
                                                    <div className="text-left shrink-0">
                                                        {isDone ? (
                                                            <div>
                                                                <div className="font-black text-base text-slate-900 font-mono">
                                                                    {p.score} <span className="text-xs text-slate-400">/ {currentChallenge.totalQuestions}</span>
                                                                </div>
                                                                <div className="text-[11px] font-black text-emerald-600">
                                                                    {Math.round(p.percentage)}%
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                                                                قيد الحل
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Question-by-Question Review Accordion */}
                            {!hasCompleted ? (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center shadow-xs">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-sm sm:text-base font-black text-slate-800 mb-1.5">
                                        مراجعة الأسئلة والإجابات النموذجية مقفلة
                                    </h4>
                                    <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
                                        لا تظهر الإجابة النموذجية إلا بعد أن ينهي الطالب امتحان التحدي ويعود إلى غرفة التحدي.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleStartChallengeQuiz}
                                        className="px-6 py-3 bg-slate-950 hover:bg-slate-900 active:scale-95 text-amber-300 rounded-xl font-black text-xs sm:text-sm border border-slate-800 shadow-md inline-flex items-center gap-2 cursor-pointer transition-transform touch-manipulation"
                                    >
                                        <Play className="w-4 h-4 fill-amber-300" />
                                        <span>ابدأ امتحان التحدي الآن</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-900 shadow-xs overflow-hidden">
                                    <button
                                        onClick={() => setShowQuestionsReview(!showQuestionsReview)}
                                        className="w-full p-3.5 bg-slate-100 hover:bg-slate-200 flex items-center justify-between text-right font-black text-xs sm:text-sm text-slate-800 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>🔍 مراجعة أسئلة التحدي والإجابات النموذجية ({currentChallenge.questions?.length || 0})</span>
                                        </div>
                                        {showQuestionsReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {showQuestionsReview && (
                                        <div className="p-4 space-y-4 bg-slate-50/50">
                                        {/* Participant Selector for Review if participants with answers exist */}
                                        {participantsWithAnswers.length > 0 && (
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-800">مراجعة إجابات:</span>
                                                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                        {activeReviewParticipant?.name || defaultName} {activeReviewParticipant?.id === defaultUserId || activeReviewParticipant?.name === defaultName ? '(أنت)' : ''}
                                                    </span>
                                                </div>
                                                {participantsWithAnswers.length > 1 && (
                                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                                                        {participantsWithAnswers.map(p => {
                                                            const isSelected = p.id === activeReviewParticipant?.id;
                                                            const isYou = p.id === defaultUserId || p.name === defaultName;
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => setSelectedParticipantId(p.id)}
                                                                    className={`px-2.5 py-1 rounded-lg font-black border text-xs shrink-0 transition-all cursor-pointer ${
                                                                        isSelected 
                                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                                                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                                    }`}
                                                                >
                                                                    {p.name} {isYou ? '(أنت)' : ''}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {currentChallenge.questions?.map((q, qIdx) => {
                                            const isMath = currentChallenge.subjectId === SubjectName.Math || 
                                                           isMathSubject(currentChallenge.subjectId, q) || 
                                                           isMathSubject(currentChallenge.subjectName, q) || 
                                                           isMathSubject(currentChallenge.lessonTitle, q);
                                            const isLtr = isMath;
                                            const optionLabels = isMath ? ['A', 'B', 'C', 'D'] : ['أ', 'ب', 'ج', 'د'];
                                            const currentChoices = (q.choices && q.choices.length > 0)
                                                ? q.choices
                                                : ((q as any).options ? (q as any).options.map((opt: any) => opt.label) : []);
                                            const hasOptionGraphs = (q as any).options && (q as any).options.some((opt: any) => opt.graph);
                                            const questionGraph = (q as any).questionGraph || (q as any).graph;

                                            const userAnswer = activeReviewAnswers && activeReviewAnswers[qIdx];
                                            const isUserAnswerProvided = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';
                                            const isQuestionCorrect = isUserAnswerProvided && checkIsChoiceCorrect(q, userAnswer);

                                            return (
                                                <div key={qIdx} className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-900 shadow-xs text-right">
                                                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black shrink-0">
                                                                {qIdx + 1}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-500">
                                                                سؤال {qIdx + 1} من {currentChallenge.questions?.length}
                                                            </span>
                                                            {isUserAnswerProvided && (
                                                                isQuestionCorrect ? (
                                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[11px] flex items-center gap-1">
                                                                        <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 font-black" />
                                                                        <span>إجابة صحيحة</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-black text-[11px] flex items-center gap-1">
                                                                        <X className="w-3.5 h-3.5 text-rose-700 shrink-0 font-black" />
                                                                        <span>إجابة خاطئة</span>
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                                            الإجابة النموذجية: <span className="text-emerald-700 font-black font-sans">{q.correct_answer}</span>
                                                        </div>
                                                    </div>

                                                    {/* Question Text */}
                                                    <div className="text-sm sm:text-base font-black text-slate-900 mb-4 leading-relaxed">
                                                        <MathRenderer text={q.question} />
                                                    </div>

                                                    {/* Question Graph */}
                                                    {questionGraph && (
                                                        <div className="mb-6 relative z-10 w-full max-w-[340px] h-[220px] mx-auto bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-center items-center shadow-sm">
                                                            <TrigGraph graphData={questionGraph} />
                                                        </div>
                                                    )}

                                                    {/* Choices Grid */}
                                                    <div className={`grid gap-3 relative z-10 ${hasOptionGraphs ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 space-y-1'}`}>
                                                        {currentChoices.map((choice, cIdx) => {
                                                            const isCorrectChoice = checkIsChoiceCorrect(q, choice, cIdx);
                                                            const isUserChoice = isUserAnswerProvided && (
                                                                String(userAnswer).trim() === String(choice).trim() ||
                                                                String(userAnswer).trim() === ['A', 'B', 'C', 'D'][cIdx] ||
                                                                String(userAnswer).trim() === ['أ', 'ب', 'ج', 'د'][cIdx] ||
                                                                String(userAnswer).trim() === String(cIdx)
                                                            );
                                                            const option = (q as any).options && (q as any).options[cIdx];
                                                            const optionGraph = option && option.graph;

                                                            let cardClass = 'bg-slate-50 border border-slate-200 text-slate-700';
                                                            let badgeClass = 'bg-white text-slate-700 border-slate-300';

                                                            if (isCorrectChoice) {
                                                                cardClass = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-900 shadow-xs';
                                                                badgeClass = 'bg-emerald-600 text-white border-emerald-600';
                                                            } else if (isUserChoice) {
                                                                // User's wrong answer highlighted in red
                                                                cardClass = 'bg-rose-50 border-2 border-rose-500 text-rose-900 shadow-xs';
                                                                badgeClass = 'bg-rose-600 text-white border-rose-600';
                                                            }

                                                            return (
                                                                <div 
                                                                    key={cIdx}
                                                                    dir={isLtr ? 'ltr' : 'rtl'}
                                                                    className={`w-full p-3 sm:p-4 rounded-xl font-bold text-sm sm:text-base border flex items-center gap-3 sm:gap-4 transition-all ${
                                                                        isLtr ? 'text-left font-sans' : 'text-right font-naskh'
                                                                    } ${cardClass}`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs border-2 transition-colors ${badgeClass}`}>
                                                                        {optionLabels[cIdx] || ['A', 'B', 'C', 'D'][cIdx]}
                                                                    </div>
                                                                    {optionGraph ? (
                                                                        <div className="flex-1 flex justify-center items-center h-[105px] max-w-[160px] mx-auto py-1">
                                                                            <TrigGraph graphData={optionGraph} isOption={true} />
                                                                        </div>
                                                                    ) : (
                                                                        <div className={`flex-1 min-w-0 w-full ${isLtr ? 'text-left font-sans' : 'text-right font-naskh'}`}>
                                                                            <MathRenderer text={choice} />
                                                                        </div>
                                                                    )}
                                                                    <div className={`shrink-0 flex items-center gap-1.5 ${isLtr ? 'ml-auto' : 'mr-auto'}`}>
                                                                        {isCorrectChoice && (
                                                                            <span className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                                                                                {isUserChoice && (
                                                                                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-black">
                                                                                        إجابتك
                                                                                    </span>
                                                                                )}
                                                                                <Check className="w-5 h-5 font-black" />
                                                                            </span>
                                                                        )}
                                                                        {isUserChoice && !isCorrectChoice && (
                                                                            <span className="flex items-center gap-1 text-rose-600 font-black text-xs">
                                                                                <span className="text-[10px] bg-rose-200/80 text-rose-900 px-1.5 py-0.5 rounded font-black">
                                                                                    إجابتك الخاطئة
                                                                                </span>
                                                                                <X className="w-5 h-5 font-black" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Explanation if exists */}
                                                    {q.explanation && (
                                                        <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-start gap-2">
                                                            <span className="font-black shrink-0">💡 التوضيح:</span>
                                                            <div className="flex-1 min-w-0 leading-relaxed"><MathRenderer text={q.explanation} /></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            )}
                        </motion.div>
                    )}

                    {/* TAB 2: CREATE CHALLENGE */}
                    {activeTab === 'create' && (
                        <motion.div
                            key="create-tab"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-white rounded-2xl p-5 border-2 border-slate-900 shadow-md space-y-4"
                        >
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                                <div className="w-10 h-10 rounded-xl bg-amber-400 border border-slate-900 flex items-center justify-center text-slate-950 shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900">إنشاء تحدٍ جديد</h2>
                                    <p className="text-xs font-bold text-slate-500">اختر المادة والدرس وسيتم توليد رمز ورابط فوري لدعوة زملائك</p>
                                </div>
                            </div>

                            {/* Creator Name */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1">اسمك الذي سيظهر للمتسابقين:</label>
                                <input
                                    type="text"
                                    value={creatorDisplayName}
                                    onChange={(e) => setCreatorDisplayName(e.target.value)}
                                    placeholder="أدخل اسمك الكريم"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                                />
                            </div>

                            {/* Subject Picker */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5">اختر المادة الدراسية:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: SubjectName.Math, label: 'الرياضيات', icon: '📐' },
                                        { id: SubjectName.Arabic, label: 'اللغة العربية', icon: '📖' },
                                        { id: SubjectName.IslamicEducation, label: 'التربية الإسلامية', icon: '🕌' },
                                        { id: SubjectName.JordanHistory, label: 'تاريخ الأردن', icon: '🇯🇴' }
                                    ].map((sub) => (
                                        <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSubjectId(sub.id);
                                                setSelectedUnitIdx(0);
                                                setSelectedLessonIdx(0);
                                                setSelectedChunkIdx(0);
                                            }}
                                            className={`p-2.5 rounded-xl border text-right font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                                                selectedSubjectId === sub.id 
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="text-base">{sub.icon}</span>
                                            <span className="truncate">{sub.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Unit Picker */}
                            {subjectUnits.length > 0 && (
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1">الوحدة الدراسية:</label>
                                    <select
                                        value={selectedUnitIdx}
                                        onChange={(e) => {
                                            setSelectedUnitIdx(Number(e.target.value));
                                            setSelectedLessonIdx(0);
                                            setSelectedChunkIdx(0);
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                                    >
                                        {subjectUnits.map((u, idx) => (
                                            <option key={idx} value={idx}>
                                                {u.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Lesson Picker */}
                            {currentLessons.length > 0 && (
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1">الدرس أو الاختبار:</label>
                                    <select
                                        value={selectedLessonIdx}
                                        onChange={(e) => {
                                            setSelectedLessonIdx(Number(e.target.value));
                                            setSelectedChunkIdx(0);
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                                    >
                                        {currentLessons.map((les, idx) => (
                                            <option key={idx} value={idx}>
                                                {les.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Exam Chunk Picker (if multiple chunks) */}
                            {chunksCount > 1 && (
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1">رقم الامتحان الجزئي:</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from({ length: chunksCount }).map((_, cIdx) => (
                                            <button
                                                key={cIdx}
                                                type="button"
                                                onClick={() => setSelectedChunkIdx(cIdx)}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                                                    selectedChunkIdx === cIdx 
                                                        ? 'bg-amber-400 text-slate-950 border-slate-900 shadow-2xs' 
                                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                امتحان {cIdx + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Question Count Limit */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1">عدد أسئلة التحدي:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { count: 5, label: '5 أسئلة (سريع)' },
                                        { count: 10, label: '10 أسئلة (قياسي)' },
                                        { count: 0, label: 'كامل الامتحان' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.count}
                                            type="button"
                                            onClick={() => setQuestionCountLimit(opt.count)}
                                            className={`py-2 rounded-xl border text-center font-black text-xs transition-all cursor-pointer ${
                                                questionCountLimit === opt.count 
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleCreateChallengeSubmit}
                                disabled={isCreating}
                                className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 active:scale-98 text-slate-950 font-black text-sm rounded-xl border-2 border-slate-900 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                                <Trophy className="w-4 h-4" />
                                <span>{isCreating ? 'جاري تجهيز التحدي...' : 'إنشاء التحدي وتوليد الرابط والرمز ⚔️'}</span>
                            </button>
                        </motion.div>
                    )}

                    {/* TAB 3: JOIN CHALLENGE BY CODE */}
                    {activeTab === 'join' && (
                        <motion.div
                            key="join-tab"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-white rounded-2xl p-5 border-2 border-slate-900 shadow-md space-y-4"
                        >
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                                <div className="w-10 h-10 rounded-xl bg-sky-500 border border-slate-900 flex items-center justify-center text-white shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900">الانضمام إلى تحدٍ</h2>
                                    <p className="text-xs font-bold text-slate-500">أدخل رمز التحدي المكون من 6 أرقام والمشارك من زميلك</p>
                                </div>
                            </div>

                            <form onSubmit={handleJoinSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1">اسمك في التحدي:</label>
                                    <input
                                        type="text"
                                        value={joinerName}
                                        onChange={(e) => setJoinerName(e.target.value)}
                                        placeholder="اسم المتسابق"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1">رمز التحدي (6 أرقام):</label>
                                    <input
                                        type="text"
                                        value={inputCode}
                                        onChange={(e) => setInputCode(e.target.value.replace(/\s+/g, ''))}
                                        placeholder="مثال: 582914"
                                        maxLength={10}
                                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-center text-lg text-slate-900 tracking-widest focus:outline-none focus:border-slate-900"
                                    />
                                </div>

                                {joinError && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{joinError}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isJoining || !inputCode.trim()}
                                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-black text-sm rounded-xl border border-slate-900 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>{isJoining ? 'جاري البحث عن التحدي...' : 'دخول التحدي ومقارنة النتائج 🚀'}</span>
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FriendChallengePage;
