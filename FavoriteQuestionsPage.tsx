import React from 'react';
import { BookmarkIcon, ShareIcon, FlagIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, CheckCircleIcon, XIcon, CheckIcon } from './data/Icons';
import { FavoriteQuestion, Subject, UserProgress, SubjectName, Question } from './types';
import { renderTextWithUnderline } from './textRenderer';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoriteQuestionsPageProps {
    favoriteQuestions: FavoriteQuestion[];
    selectedSubject: Subject | null;
    toggleFavoriteQuestion: (question: any, subjectId: string, lessonTitle: string) => void;
    clearFavoriteQuestions: (questions: FavoriteQuestion[]) => void;
    goBack: () => void;
}

const FavoriteQuestionsPage: React.FC<FavoriteQuestionsPageProps> = ({
    favoriteQuestions,
    selectedSubject,
    toggleFavoriteQuestion,
    clearFavoriteQuestions,
    goBack
}) => {
    const [isBulkMode, setIsBulkMode] = React.useState(false);
    const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(new Set());

    // Filter questions for the current subject and semester
    const filteredQuestions = favoriteQuestions.filter(q => {
        if (!selectedSubject) return false;
        return q.subjectId === selectedSubject.id && q.semester === selectedSubject.semester;
    });

    const isEnglish = selectedSubject?.id === SubjectName.English;

    const toggleSelect = (idx: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(idx)) {
            newSet.delete(idx);
        } else {
            newSet.add(idx);
        }
        setSelectedIndices(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIndices.size === filteredQuestions.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(filteredQuestions.map((_, i) => i)));
        }
    };

    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleBulkDelete = () => {
        if (selectedIndices.size === 0) return;
        setShowConfirmModal(true);
    };

    const confirmDeletion = () => {
        setIsDeleting(true);
        // Add a tiny delay to show the "deleting" state if needed, but primarily to ensure state updates don't collide
        setTimeout(() => {
            const questionsToRemove = Array.from(selectedIndices).map(idx => filteredQuestions[idx]);
            clearFavoriteQuestions(questionsToRemove);
            setSelectedIndices(new Set());
            setIsBulkMode(false);
            setShowConfirmModal(false);
            setIsDeleting(false);
        }, 100);
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl pt-2 pb-24" dir="rtl">
            {/* Header Section */}
            <div className="relative flex flex-col items-center mb-8 px-2 text-center min-h-[60px] pt-2">
                {!isBulkMode && (
                    <button 
                        onClick={() => setIsBulkMode(true)}
                        className="absolute left-2 top-0 flex flex-col items-center group"
                        title="تفريغ المفضلة"
                    >
                        <div className="w-12 h-12 bg-white border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-red-500 hover:bg-red-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center">
                            <TrashIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 mt-1">تفريغ المفضلة</span>
                    </button>
                )}

                {isBulkMode && (
                    <button 
                        onClick={() => {
                            setIsBulkMode(false);
                            setSelectedIndices(new Set());
                        }}
                        className="absolute left-2 top-0 flex flex-col items-center group"
                        title="إلغاء التحديد"
                    >
                        <div className="w-12 h-12 bg-white border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-slate-800 hover:bg-slate-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center">
                            <XIcon className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 mt-1">إلغاء</span>
                    </button>
                )}

                <button 
                    onClick={goBack}
                    className="absolute right-2 top-0 w-12 h-12 bg-white border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-slate-800 hover:bg-slate-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 flex items-center justify-center group"
                    title="رجوع"
                >
                    <ChevronRightIcon className="w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={3} />
                </button>

                <div className="flex flex-col items-center gap-0.5">
                    <h2 className="text-2xl font-black text-slate-800 leading-tight">الأسئلة المفضلة</h2>
                    <h3 className="text-sm font-bold text-slate-500 mb-1">{selectedSubject?.id}</h3>
                    {selectedSubject?.semester && (
                        <div className="flex flex-col items-center gap-0.5 py-1 px-4 bg-primary/5 rounded-2xl border border-primary/20">
                            <span className="text-xs font-black text-primary">
                                {selectedSubject.semester}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {isBulkMode && filteredQuestions.length > 0 && (
                <div className="flex justify-center mb-6">
                    <button 
                        onClick={toggleSelectAll}
                        className="px-6 py-2 bg-white border-2 border-slate-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-black text-slate-800 hover:bg-slate-50 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-2"
                    >
                        {selectedIndices.size === filteredQuestions.length ? (
                            <>
                                <XIcon className="w-4 h-4" />
                                إلغاء تحديد الكل
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-4 h-4" />
                                تحديد الكل للإزالة
                            </>
                        )}
                    </button>
                </div>
            )}

            {filteredQuestions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-900">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookmarkIcon className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">لا يوجد أسئلة مفضلة</h3>
                    <p className="text-slate-400 font-bold text-sm">قم بإضافة الأسئلة التي تهمك من صفحة النتائج لتظهر هنا</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                            <span className="text-[10px] font-black tracking-wider">عدد الأسئلة:</span>
                            <span className="text-xs font-black">{filteredQuestions.length}</span>
                        </div>
                    </div>
                    {filteredQuestions.map((q, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => isBulkMode && toggleSelect(idx)}
                            className={`bg-white rounded-lg px-3 py-5 shadow-md ${isEnglish ? 'border-l-8 border-l-amber-500 text-left' : 'border-r-8 border-r-amber-500 text-right'} relative group border border-slate-900 ${isBulkMode ? 'cursor-pointer hover:border-primary/50' : ''}`}
                            dir={isEnglish ? 'ltr' : 'rtl'}
                        >
                            {isBulkMode && (
                                <div className={`absolute top-4 ${isEnglish ? 'right-4' : 'left-4'} z-10`}>
                                    <div className={`w-6 h-6 rounded-md border-2 border-slate-900 flex items-center justify-center transition-colors ${selectedIndices.has(idx) ? 'bg-primary border-primary' : 'bg-white'}`}>
                                        {selectedIndices.has(idx) && <CheckIcon className="w-4 h-4 text-white" strokeWidth={4} />}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start justify-between mb-4 flex-row">
                                <div className="flex items-start gap-2 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs shrink-0 mt-1 shadow-inner">
                                        {idx + 1}
                                    </div>
                                    <h4 className={`font-black text-text-main text-sm leading-relaxed flex-1 pt-1.5 ${isEnglish ? 'font-sans' : 'font-naskh'}`}>{renderTextWithUnderline(q.question)}</h4>
                                </div>
                                <div className={`flex items-center gap-1 shrink-0 ${isBulkMode ? 'opacity-0' : 'opacity-100'}`}>
                                    <button 
                                        onClick={() => !isBulkMode && toggleFavoriteQuestion(q, q.subjectId, q.lessonTitle)}
                                        className="p-2 rounded-lg bg-amber-500/10 text-amber-500 transition-colors border border-slate-900"
                                        title="إزالة من المفضلة"
                                        disabled={isBulkMode}
                                    >
                                        <BookmarkIcon className="w-4 h-4 fill-amber-500" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isBulkMode) return;
                                            if (navigator.share) {
                                                const choiceLabels = isEnglish ? ['a', 'b', 'c', 'd'] : ['أ', 'ب', 'ج', 'د'];
                                                navigator.share({
                                                    title: 'سؤال مهم',
                                                    text: `${q.question}\n\n${q.choices.map((c, i) => `${choiceLabels[i]}: ${c}`).join('\n')}`,
                                                }).catch(() => {});
                                            }
                                        }}
                                        className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors border border-slate-900"
                                        title="مشاركة"
                                        disabled={isBulkMode}
                                    >
                                        <ShareIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                {q.choices.map((choice, cIdx) => {
                                    const trimmedChoice = choice.trim();
                                    const trimmedCorrect = String(q.correct_answer).trim();
                                    const choiceLabels = isEnglish ? ['a', 'b', 'c', 'd'] : ['أ', 'ب', 'ج', 'د'];
                                    
                                    // Robust check for correct answer
                                    const isCorrect = 
                                        trimmedChoice === trimmedCorrect || 
                                        choiceLabels[cIdx] === trimmedCorrect.toLowerCase() ||
                                        choiceLabels[cIdx] === trimmedCorrect ||
                                        ['A', 'B', 'C', 'D'][cIdx] === trimmedCorrect.toUpperCase() ||
                                        String(cIdx) === trimmedCorrect;

                                    return (
                                        <div 
                                            key={cIdx}
                                            className={`p-3 rounded-lg text-sm font-bold border flex items-center gap-3 border-slate-900 ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'} flex-row`}
                                        >
                                            <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 font-black text-[10px] ${isCorrect ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                {choiceLabels[cIdx]}
                                            </div>
                                            <span className={`flex-1 ${isEnglish ? 'text-left font-sans' : 'text-right font-naskh'}`}>{renderTextWithUnderline(choice)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <div className={`flex flex-col text-[10px] font-bold text-slate-400 ${isEnglish ? 'text-left' : 'text-right'}`}>
                                    <span>{q.lessonTitle}</span>
                                    {q.semester && <span className="opacity-60">{q.semester}</span>}
                                    {q.source_text && <span>({q.source_text}{q.page ? ` صفحة ${q.page}` : ''})</span>}
                                </div>
                            </div>
                            {!isBulkMode && (
                                <button className={`absolute bottom-1.5 ${isEnglish ? 'right-4' : 'left-4'} text-[10px] font-bold text-slate-300 hover:text-red-400 flex items-center gap-1 transition-colors`}>
                                    <FlagIcon className="w-3 h-3" />
                                    <span>تبليغ</span>
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isBulkMode && selectedIndices.size > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
                    >
                        <button 
                            onClick={handleBulkDelete}
                            className="bg-red-500 text-white px-8 py-3 rounded-xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black text-lg hover:bg-red-600 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-3 pointer-events-auto"
                        >
                            <TrashIcon className="w-6 h-6" />
                            حذف المختار ({selectedIndices.size})
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-sm w-full text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
                                <TrashIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">تأكيد الحذف</h3>
                            <p className="text-slate-500 font-bold mb-6">
                                {selectedIndices.size === filteredQuestions.length 
                                    ? 'هل أنت متأكد من تفريغ كافة الأسئلة المفضلة؟' 
                                    : `هل أنت متأكد من حذف ${selectedIndices.size} سؤال من المفضلة؟`}
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={confirmDeletion}
                                    disabled={isDeleting}
                                    className="flex-1 bg-red-500 text-white py-3 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black hover:bg-red-600 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                                >
                                    {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
                                </button>
                                <button 
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={isDeleting}
                                    className="flex-1 bg-white text-slate-800 py-3 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black hover:bg-slate-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FavoriteQuestionsPage;
