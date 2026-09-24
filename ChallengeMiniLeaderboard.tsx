import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Clock, Crown, Users, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { ChallengeParticipant } from './types';

interface ChallengeMiniLeaderboardProps {
    participants: ChallengeParticipant[];
    totalQuestions: number;
    currentUserId?: string;
    currentUserName?: string;
    onSelectParticipant?: (participantId: string) => void;
    hasCompleted?: boolean;
    onStartChallenge?: () => void;
}

export const ChallengeMiniLeaderboard: React.FC<ChallengeMiniLeaderboardProps> = ({
    participants,
    totalQuestions,
    currentUserId,
    currentUserName,
    onSelectParticipant,
    hasCompleted,
    onStartChallenge
}) => {
    // Only completed participants are eligible for the leaderboard
    const completedList = participants.filter(p => p.status === 'completed');

    // Sort: highest score first, then lowest time spent
    const ranked = [...completedList].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.timeSpent || 99999) - (b.timeSpent || 99999);
    });

    const topThree = ranked.slice(0, 3);
    const topParticipant = ranked[0];

    // Find fastest finisher among high scorers
    const fastestParticipant = ranked.length > 0 
        ? [...ranked].sort((a, b) => (a.timeSpent || 99999) - (b.timeSpent || 99999))[0]
        : null;

    // Formatting time helper
    const formatTime = (seconds: number) => {
        if (!seconds || seconds <= 0) return '0ث';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}د ${secs}ث` : `${secs}ث`;
    };

    return (
        <div 
            id="challenge-mini-leaderboard"
            className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-900 shadow-md text-right relative overflow-hidden" 
            dir="rtl"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-2xs">
                        <Trophy className="w-5 h-5 fill-amber-400 stroke-amber-700" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm sm:text-base text-slate-900">لوحة الصدارة المصغرة</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>أفضل الدرجات</span>
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                            المراكز الأولى بين الأصدقاء في هذا التحدي
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-[11px] font-black text-slate-700">
                        {completedList.length} أنهوا التحدي
                    </span>
                </div>
            </div>

            {/* When no one completed yet */}
            {completedList.length === 0 ? (
                <div className="py-6 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                        <Crown className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 mb-1">لوحة الصدارة بانتظار البطل الأول!</h4>
                    <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto mb-4 leading-relaxed">
                        كن أول من يخوض هذا الاختبار لتعلق اسمك في المركز الأول وتتحدى أصدقاءك لتجاوز نتيجتك!
                    </p>
                    {!hasCompleted && onStartChallenge && (
                        <button
                            type="button"
                            onClick={onStartChallenge}
                            className="soft-pulse px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-300 rounded-xl font-black text-xs border border-slate-800 shadow-sm inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span>ابدأ التحدي وتصدر القائمة 🚀</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="pt-4">
                    {/* Olympic Podium View (Top 3) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end mb-4 pt-2">
                        {/* 2nd Place (Silver) - Right */}
                        <div className="flex flex-col items-center">
                            {topThree[1] ? (
                                <>
                                    <div className="text-center mb-1 w-full px-1">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-400 text-slate-700 mx-auto flex items-center justify-center font-black text-xs shadow-2xs mb-1">
                                            🥈
                                        </div>
                                        <p className="text-xs font-black text-slate-900 truncate" title={topThree[1].name}>
                                            {topThree[1].name}
                                        </p>
                                        {(topThree[1].id === currentUserId || topThree[1].name === currentUserName) && (
                                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] mt-0.5">
                                                أنت
                                            </span>
                                        )}
                                    </div>
                                    <div 
                                        onClick={() => onSelectParticipant && onSelectParticipant(topThree[1].id)}
                                        className={`w-full bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-slate-400 rounded-t-xl p-2.5 text-center flex flex-col justify-between h-24 sm:h-28 transition-all ${
                                            onSelectParticipant ? 'cursor-pointer hover:brightness-105 active:scale-95' : ''
                                        }`}
                                    >
                                        <span className="text-[10px] font-black text-slate-600 block">المركز الثاني</span>
                                        <div>
                                            <div className="text-sm sm:text-base font-black text-slate-900">
                                                {topThree[1].score}<span className="text-[10px] font-bold text-slate-600">/{totalQuestions}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-600 mt-0.5">
                                                {Math.round(topThree[1].percentage)}%
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-500">
                                            ⏱️ {formatTime(topThree[1].timeSpent)}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-t-xl p-2 text-center h-20 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-400">المركز الثاني</span>
                                    <span className="text-[10px] font-black text-amber-600">شاغر</span>
                                </div>
                            )}
                        </div>

                        {/* 1st Place (Gold) - Center (Elevated) */}
                        <div className="flex flex-col items-center">
                            {topThree[0] ? (
                                <>
                                    <div className="text-center mb-1 w-full px-1">
                                        <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-amber-600 text-slate-950 mx-auto flex items-center justify-center font-black text-base shadow-md mb-1 relative">
                                            <Crown className="w-4 h-4 text-amber-900 absolute -top-3" />
                                            🥇
                                        </div>
                                        <p className="text-xs sm:text-sm font-black text-slate-900 truncate" title={topThree[0].name}>
                                            {topThree[0].name}
                                        </p>
                                        {(topThree[0].id === currentUserId || topThree[0].name === currentUserName) && (
                                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] mt-0.5">
                                                أنت
                                            </span>
                                        )}
                                    </div>
                                    <div 
                                        onClick={() => onSelectParticipant && onSelectParticipant(topThree[0].id)}
                                        className={`w-full bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 border-2 border-amber-600 rounded-t-xl p-2.5 text-center flex flex-col justify-between h-32 sm:h-36 shadow-xs transition-all ${
                                            onSelectParticipant ? 'cursor-pointer hover:brightness-105 active:scale-95' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <Sparkles className="w-3 h-3 text-amber-800" />
                                            <span className="text-[10px] font-black text-amber-950 block">المتصدر</span>
                                        </div>
                                        <div>
                                            <div className="text-base sm:text-lg font-black text-slate-950">
                                                {topThree[0].score}<span className="text-xs font-bold text-slate-800">/{totalQuestions}</span>
                                            </div>
                                            <div className="text-[11px] font-black text-amber-950 mt-0.5">
                                                {Math.round(topThree[0].percentage)}%
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-800 bg-amber-100/60 rounded px-1 py-0.5">
                                            ⏱️ {formatTime(topThree[0].timeSpent)}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* 3rd Place (Bronze) - Left */}
                        <div className="flex flex-col items-center">
                            {topThree[2] ? (
                                <>
                                    <div className="text-center mb-1 w-full px-1">
                                        <div className="w-8 h-8 rounded-full bg-amber-800 border-2 border-amber-900 text-amber-100 mx-auto flex items-center justify-center font-black text-xs shadow-2xs mb-1">
                                            🥉
                                        </div>
                                        <p className="text-xs font-black text-slate-900 truncate" title={topThree[2].name}>
                                            {topThree[2].name}
                                        </p>
                                        {(topThree[2].id === currentUserId || topThree[2].name === currentUserName) && (
                                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] mt-0.5">
                                                أنت
                                            </span>
                                        )}
                                    </div>
                                    <div 
                                        onClick={() => onSelectParticipant && onSelectParticipant(topThree[2].id)}
                                        className={`w-full bg-gradient-to-b from-amber-100 to-amber-200/90 border-2 border-amber-700 rounded-t-xl p-2.5 text-center flex flex-col justify-between h-20 sm:h-24 transition-all ${
                                            onSelectParticipant ? 'cursor-pointer hover:brightness-105 active:scale-95' : ''
                                        }`}
                                    >
                                        <span className="text-[10px] font-black text-amber-900 block">المركز الثالث</span>
                                        <div>
                                            <div className="text-sm sm:text-base font-black text-slate-900">
                                                {topThree[2].score}<span className="text-[10px] font-bold text-slate-600">/{totalQuestions}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-amber-900 mt-0.5">
                                                {Math.round(topThree[2].percentage)}%
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-600">
                                            ⏱️ {formatTime(topThree[2].timeSpent)}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-t-xl p-2 text-center h-16 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-400">المركز الثالث</span>
                                    <span className="text-[10px] font-black text-amber-600">شاغر</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick highlights bar */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2 text-center">
                            <span className="text-[10px] font-bold text-amber-800 block">أعلى نتيجة في الغرفة</span>
                            <span className="text-xs font-black text-amber-950">
                                {topParticipant ? `${topParticipant.score} من ${totalQuestions} (${Math.round(topParticipant.percentage)}%)` : '-'}
                            </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                            <span className="text-[10px] font-bold text-slate-500 block">أسرع وقت إنهاء</span>
                            <span className="text-xs font-black text-slate-800">
                                {fastestParticipant && fastestParticipant.timeSpent > 0 ? formatTime(fastestParticipant.timeSpent) : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengeMiniLeaderboard;
