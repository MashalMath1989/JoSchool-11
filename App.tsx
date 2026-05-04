import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, AlertCircle, LogOut } from 'lucide-react';
import { View, Subject, SubjectName, Question, Semester, UserProgress, QuizResult } from './types';
import { subjectsData, subjectIndexData } from './data';
import { getQuizzesForLesson, getLessonChunksCount, getQuizzesForUnit } from './services/quizService';
import { updateDatabase, examsDatabase, loadFromCache, saveToCache } from './data/examsDatabase';
import { ArrowLeftIcon, ChevronDownIcon, StarIcon, XIcon, CheckIcon, BookOpenIcon, BookmarkIcon, BookmarkOutlineIcon, RefreshIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, TrophyIcon, CheckCircleIcon, UserIcon } from './data/Icons';
import { auth } from './firebase';
import { SESSION_2008_EXAMS, SESSION_2008_SUP_EXAMS } from './data/exams';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { saveUserProgress, subscribeToUserProgress } from './services/firestoreService';

import LandingPage from './LandingPage';
import SubjectIndexPage from './SubjectIndexPage';
import QuizPage from './QuizPage';
import ResultsPage from './ResultsPage';
import PdfViewerScreen from './PdfViewerScreen';
import ProgressDashboard from './ProgressDashboard';
import FavoriteQuestionsPage from './FavoriteQuestionsPage';
import SessionSubjectsPage from './SessionSubjectsPage';
import AuthPage from './AuthPage';

// روابط امتحانات مادة تاريخ الأردن - الفصل الأول
const HISTORY_U1_EXAMS = [
    { title: "الدرس الأول: الأردن في العصور الحجرية – صفحة 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit1_exam1.json" },
    { title: "الدرس الثاني: الأردن في العصر الحديدي – صفحة 16", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit1_exam2.json" },
    { title: "الدرس الثالث: مملكة الأنباط – صفحة 22", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit1_exam3.json" },
    { title: "الدرس الرابع: مظاهر الحضارتين اليونانية والرومانية–البيزنطية في الأردن – صفحة 31", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit1_exam4.json" }
];

const HISTORY_U2_EXAMS = [
    { title: "الدرس الأول: الأردن في صدر الإسلام – صفحة 46", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit2_exam1.json" },
    { title: "الدرس الثاني: الأردن في العصرين الأموي والعباسي – صفحة 56", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit2_exam2.json" },
    { title: "الدرس الثالث: الأردن خلال حملات الفرنجة – صفحة 66", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit2_exam3.json" },
    { title: "الدرس الرابع: الأردن في العصر الأيوبي – صفحة 72", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit2_exam4.json" },
    { title: "الدرس الخامس: الأردن في العصر المملوكي – صفحة 77", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit2_exam5.json" }
];

const HISTORY_U3_EXAMS = [
    { title: "الدرس الأول: الأوضاع السياسية والإدارية في الأردن في العهد العثماني – صفحة 88", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit3_exam1.json" },
    { title: "الدرس الثاني: الأوضاع الاجتماعية والاقتصادية في الأردن في العهد العثماني – صفحة 94", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit3_exam2.json" },
    { title: "الدرس الثالث: الثورة العربية الكبرى (النهضة العربية) – صفحة 105", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit3_exam3.json" },
    { title: "الدرس الرابع: الأردن في عهد المملكة العربية السورية والحكومات المحلية – صفحة 118", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/history_s1_unit3_exam4.json" }
];

const HISTORY_S2_U4_EXAMS = [
    { title: "الدرس الأول: تأسيس الإمارة الأردنية — صفحة 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit4_exam1.json" },
    { title: "الدرس الثاني: تطور الحياة السياسية في الأردن بين عامي (1947–1999م) — صفحة 18", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit4_exam2.json" },
    { title: "الدرس الثالث: الحياة السياسية في الأردن منذ عام 1999م — صفحة 30", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit4_exam3.json" },
    { title: "الدرس الرابع: الأردن والعلاقات العربية والدولية — صفحة 37", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit4_exam4.json" },
    { title: "الدرس الخامس: القوات المسلحة الأردنية – الجيش العربي والأجهزة الأمنية — صفحة 47", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit4_exam5.json" }
];

const HISTORY_S2_U5_EXAMS = [
    { title: "الدرس الأول: الحياة الاقتصادية في الأردن بين عامي (1921–1950م) — صفحة 60", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit5_exam1.json" },
    { title: "الدرس الثاني: الحياة الاقتصادية في الأردن بين عامي (1951–1999م) — صفحة 65", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit5_exam2.json" },
    { title: "الدرس الثالث: الحياة الاقتصادية في الأردن منذ عام 1999م — صفحة 74", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit5_exam3.json" }
];

const HISTORY_S2_U6_EXAMS = [
    { title: "الدرس الأول: الحياة الاجتماعية في الأردن بين عامي (1921–1950م) — صفحة 82", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit6_exam1.json" },
    { title: "الدرس الثاني: الحياة الاجتماعية في الأردن بين عامي (1951–1999م) — صفحة 89", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit6_exam2.json" },
    { title: "الدرس الثالث: الحياة الاجتماعية في الأردن منذ عام 1999م — صفحة 94", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit6_exam3.json" }
];

const HISTORY_S2_U7_EXAMS = [
    { title: "الدرس الأول: التعليم العام في الأردن بين عامي (1921–1950م) — صفحة 104", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit7_exam1.json" },
    { title: "الدرس الثاني: التعليم العام في الأردن منذ عام 1951م — صفحة 108", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit7_exam2.json" },
    { title: "الدرس الثالث: التعليم العالي والبحث العلمي في الأردن — صفحة 114", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit7_exam3.json" },
    { title: "الدرس الرابع: الحياة الثقافية في الأردن منذ عام 1921م — صفحة 118", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit7_exam4.json" }
];

const HISTORY_S2_U8_EXAMS = [
    { title: "الدرس الأول: موقف الأردن من القضية الفلسطينية بين عامي (1916–1950م) — صفحة 130", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit8_exam1.json" },
    { title: "الدرس الثاني: موقف الأردن من القضية الفلسطينية منذ عام 1950م — صفحة 136", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit8_exam2.json" },
    { title: "الدرس الثالث: الوصاية والإعمار الهاشمي للمقدسات الدينية في القدس — صفحة 142", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/History_s2_unit8_exam3.json" }
];

// روابط امتحانات التربية الإسلامية
const ISLAMIC_U1_EXAMS = [
    { title: "الدرس الأول: سورة آل عمران الآيات الكريمة (١٠٢–١٠٥) – صفحة 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit1_exam1.json" },
    { title: "الدرس الثاني: الحديث الشريف: اتقاء الشبهات – صفحة 12", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit1_exam2.json" },
    { title: "الدرس الثالث: من صور الضلال – صفحة 20", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit1_exam3.json" },
    { title: "الدرس الرابع: كرامة الإنسان في الشريعة الإسلامية – صفحة 26", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit1_exam4.json" },
    { title: "الدرس الخامس: الزواج: مشروعيته ومقدماته – صفحة 31", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit1_exam5.json" },
    { title: "الدرس السادس: الجهاد في الإسلام – صفحة 37", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit1_exam6.json" }
];
const ISLAMIC_U2_EXAMS = [
    { title: "الدرس الأول: جهود علماء المسلمين في خدمة القرآن الكريم – صفحة 44", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit2_exam1.json" },
    { title: "الدرس الثاني: العزيمة والرخصة – صفحة 50", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit2_exam2.json" },
    { title: "الدرس الثالث: معركة مؤتة (8 هـ) – صفحة 56", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit2_exam3.json" },
    { title: "الدرس الرابع: المحرّمات من النساء – صفحة 61", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit2_exam4.json" },
    { title: "الدرس الخامس: التعايش الإنساني – صفحة 67", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit2_exam5.json" },
    { title: "الدرس السادس: الحقوق الاجتماعية للمرأة في الإسلام – صفحة 73", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit2_exam6.json" }
];
const ISLAMIC_U3_EXAMS = [
    { title: "الدرس الأول: سورة آل عمران الآيات الكريمة (169–174) – صفحة 81", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit3_exam1.json" },
    { title: "الدرس الثاني: الحديث الشريف: رضا الله تعالى – صفحة 87", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit3_exam2.json" },
    { title: "الدرس الثالث: فتح مكة (8 هـ) – صفحة 93", page: 93, url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit3_exam3.json" },
    { title: "الدرس الرابع: من خصائص الشريعة الإسلامية: الإيجابية – صفحة 99", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit3_exam4.json" },
    { title: "الدرس الخامس: شروط صحة عقد الزواج – صفحة 105", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit3_exam5.json" },
    { title: "الدرس السادس: الحقوق المالية للمرأة في الإسلام – صفحة 110", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit3_exam6.json" }
];
const ISLAMIC_U4_EXAMS = [
    { title: "الدرس الأول: سورة الروم الآيات الكريمة (21–24) – صفحة 115", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit4_exam1.json" },
    { title: "الدرس الثاني: مكانة السنة النبوية الشريفة في التشريع الإسلامي – صفحة 120", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit4_exam2.json" },
    { title: "الدرس الثالث: مراعاة الأعراف في الشريعة الإسلامية – صفحة 128", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit4_exam3.json" },
    { title: "الدرس الرابع: حقوق الزوجين في الإسلام – صفحة 134", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit4_exam4.json" },
    { title: "الدرس الخامس: تنظيم النسل وتحديده – صفحة 141", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit4_exam5.json" },
    { title: "الدرس السادس: الأمن الغذائي في الإسلام – صفحة 146", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit4_exam6.json" },
    { title: "الدرس السابع: الإسلام والوحدة الوطنية – صفحة 152", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s1_unit4_exam7.json" }
];

const ISLAMIC_S2_U1_EXAMS = [
    { title: "الدرس الأول: سورة البقرة، الآيات الكريمة (٢٨٤–٢٨٦) — صفحة 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit1_exam1.json" },
    { title: "الدرس الثاني: دلائل وجود الله تعالى — صفحة 14", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit1_exam2.json" },
    { title: "الدرس الثالث: إعجاز القرآن الكريم — صفحة 21", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit1_exam3.json" },
    { title: "الدرس الرابع: الأمر بالمعروف والنهي عن المنكر — صفحة 28", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit1_exam4.json" },
    { title: "الدرس الخامس: اليوم الآخر: أحداثه، وآثار الإيمان به — صفحة 34", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit1_exam5.json" },
    { title: "الدرس السادس: الاجتهاد في الإسلام — صفحة 41", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit1_exam6.json" }
];

const ISLAMIC_S2_U2_EXAMS = [
    { title: "الدرس الأول: سورة الأعراف، الآيات الكريمة (٣١–٣٤) — صفحة 48", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit2_exam1.json" },
    { title: "الدرس الثاني: مراعاة المصالح في الشريعة الإسلامية — صفحة 55", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit2_exam2.json" },
    { title: "الدرس الثالث: جهود علماء المسلمين في الحفاظ على السنة النبوية الشريفة — صفحة 61", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit2_exam3.json" },
    { title: "الدرس الرابع: الحديث الشريف: منهج الإسلام في الحياة — صفحة 67", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit2_exam4.json" },
    { title: "الدرس الخامس: رسائل النبي ﷺ إلى الملوك والزعماء في عصره — صفحة 73", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit2_exam5.json" },
    { title: "الدرس السادس: يوم تبوك (٩هـ) — صفحة 79", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit2_exam6.json" },
    { title: "الدرس السابع: الحقوق السياسية للمرأة في الإسلام — صفحة 85", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit2_exam7.json" }
];

const ISLAMIC_S2_U3_EXAMS = [
    { title: "الدرس الأول: سورة الفرقان، الآيات الكريمة (٦٣–٧٧) — صفحة 92", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit3_exam1.json" },
    { title: "الدرس الثاني: الطلاق — صفحة 100", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit3_exam2.json" },
    { title: "الدرس الثالث: العِدّة — صفحة 107", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit3_exam3.json" },
    { title: "الدرس الرابع: الوصية في الشريعة الإسلامية — صفحة 114", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit3_exam4.json" },
    { title: "الدرس الخامس: الميراث في الشريعة الإسلامية — صفحة 119", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit3_exam5.json" },
    { title: "الدرس السادس: من خصائص الشريعة الإسلامية: الوسطية — صفحة 125", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit3_exam6.json" },
    { title: "الدرس السابع: مجالات الوقف ودورها في التنمية — صفحة 133", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit3_exam7.json" }
];

const ISLAMIC_S2_U4_EXAMS = [
    { title: "الدرس الأول: الحديث الشريف: مفهوم الإفلاس بين الدنيا والآخرة — صفحة 140", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit4_exam1.json" },
    { title: "الدرس الثاني: مقاصد الشريعة الإسلامية — صفحة 145", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit4_exam2.json" },
    { title: "الدرس الثالث: منهج الإسلام في مكافحة الجريمة — صفحة 152", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit4_exam3.json" },
    { title: "الدرس الرابع: من وصايا النبي ﷺ في حجة الوداع — صفحة 159", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit4_exam4.json" },
    { title: "الدرس الخامس: المسؤولية المجتمعية في الإسلام — صفحة 166", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit4_exam5.json" },
    { title: "الدرس السادس: حقوق الإنسان بين الإسلام والإعلان العالمي لحقوق الإنسان — صفحة 171", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Islamic_s2_unit4_exam6.json" }
];

// توليد روابط امتحانات اللغة العربية بتنسيق العناوين الجديد
const generateArabicExams = () => {
    const config = [
        { unit: 1, count: 12, unitLabel: "الوحدة الأولى" },
        { unit: 2, count: 12, unitLabel: "الوحدة الثانية" },
        { unit: 3, count: 13, unitLabel: "الوحدة الثالثة" },
        { unit: 4, count: 13, unitLabel: "الوحدة الرابعة" },
        { unit: 5, count: 14, unitLabel: "الوحدة الخامسة" },
    ];
    
    const allExams: { title: string, url: string }[] = [];
    config.forEach(c => {
        for(let i = 1; i <= c.count; i++) {
            let branch = "Arabic-S1";
            if (c.unit === 1 && i === 1) {
                branch = "main";
            }
            allExams.push({
                title: `${c.unitLabel} - امتحان ${i}`,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/${branch}/arabic_s1_unit${c.unit}_exam${i}.json`
            });
        }
    });
    return allExams;
};

const ARABIC_EXAMS = generateArabicExams();
const ARABIC_UNIT_LABELS = ["الوحدة الأولى", "الوحدة الثانية", "الوحدة الثالثة", "الوحدة الرابعة", "الوحدة الخامسة"];
const ARABIC_UNIT_COUNTS = [12, 12, 13, 13, 14];

// روابط امتحانات اللغة الإنجليزية - الفصل الأول
const ENGLISH_U1_EXAMS = [
    { title: "Unit 01 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam1.json" },
    { title: "Unit 01 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam2.json" },
    { title: "Unit 01 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam3.json" },
    { title: "Unit 01 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam4.json" },
    { title: "Unit 01 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam5.json" },
    { title: "Unit 01 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam6.json" },
    { title: "Unit 01 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam7.json" },
    { title: "Unit 01 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam8.json" },
    { title: "Unit 01 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam9.json" },
    { title: "Unit 01 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit1_exam10.json" }
];
const ENGLISH_U2_EXAMS = [
    { title: "Unit 02 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam1.json" },
    { title: "Unit 02 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam2.json" },
    { title: "Unit 02 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam3.json" },
    { title: "Unit 02 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam4.json" },
    { title: "Unit 02 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam5.json" },
    { title: "Unit 02 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam6.json" },
    { title: "Unit 02 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam7.json" },
    { title: "Unit 02 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam8.json" },
    { title: "Unit 02 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam9.json" },
    { title: "Unit 02 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit2_exam10.json" }
];
const ENGLISH_U3_EXAMS = [
    { title: "Unit 03 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam1.json" },
    { title: "Unit 03 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam2.json" },
    { title: "Unit 03 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam3.json" },
    { title: "Unit 03 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam4.json" },
    { title: "Unit 03 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam5.json" },
    { title: "Unit 03 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam6.json" },
    { title: "Unit 03 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam7.json" },
    { title: "Unit 03 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam8.json" },
    { title: "Unit 03 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam9.json" },
    { title: "Unit 03 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit3_exam10.json" }
];
const ENGLISH_U4_EXAMS = [
    { title: "Unit 04 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam1.json" },
    { title: "Unit 04 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam2.json" },
    { title: "Unit 04 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam3.json" },
    { title: "Unit 04 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam4.json" },
    { title: "Unit 04 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam5.json" },
    { title: "Unit 04 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam6.json" },
    { title: "Unit 04 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam7.json" },
    { title: "Unit 04 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam8.json" },
    { title: "Unit 04 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam9.json" },
    { title: "Unit 04 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit4_exam10.json" }
];
const ENGLISH_U5_EXAMS = [
    { title: "Unit 05 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam1.json" },
    { title: "Unit 05 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam2.json" },
    { title: "Unit 05 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam3.json" },
    { title: "Unit 05 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam4.json" },
    { title: "Unit 05 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam5.json" },
    { title: "Unit 05 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam6.json" },
    { title: "Unit 05 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam7.json" },
    { title: "Unit 05 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam8.json" },
    { title: "Unit 05 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam9.json" },
    { title: "Unit 05 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s1_unit5_exam10.json" }
];
const ENGLISH_U6_EXAMS = [
    { title: "Unit 06 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam1.json" },
    { title: "Unit 06 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam2.json" },
    { title: "Unit 06 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam3.json" },
    { title: "Unit 06 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam4.json" },
    { title: "Unit 06 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam5.json" },
    { title: "Unit 06 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam6.json" },
    { title: "Unit 06 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam7.json" },
    { title: "Unit 06 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam8.json" },
    { title: "Unit 06 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam9.json" },
    { title: "Unit 06 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit6_exam10.json" }
];
const ENGLISH_U7_EXAMS = [
    { title: "Unit 07 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam1.json" },
    { title: "Unit 07 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam2.json" },
    { title: "Unit 07 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam3.json" },
    { title: "Unit 07 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam4.json" },
    { title: "Unit 07 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam5.json" },
    { title: "Unit 07 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam6.json" },
    { title: "Unit 07 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam7.json" },
    { title: "Unit 07 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam8.json" },
    { title: "Unit 07 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam9.json" },
    { title: "Unit 07 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit7_exam10.json" }
];
const ENGLISH_U8_EXAMS = [
    { title: "Unit 08 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam1.json" },
    { title: "Unit 08 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam2.json" },
    { title: "Unit 08 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam3.json" },
    { title: "Unit 08 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam4.json" },
    { title: "Unit 08 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam5.json" },
    { title: "Unit 08 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam6.json" },
    { title: "Unit 08 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam7.json" },
    { title: "Unit 08 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam8.json" },
    { title: "Unit 08 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam9.json" },
    { title: "Unit 08 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit8_exam10.json" }
];
const ENGLISH_U9_EXAMS = [
    { title: "Unit 09 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam1.json" },
    { title: "Unit 09 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam2.json" },
    { title: "Unit 09 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam3.json" },
    { title: "Unit 09 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam4.json" },
    { title: "Unit 09 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam5.json" },
    { title: "Unit 09 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam6.json" },
    { title: "Unit 09 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam7.json" },
    { title: "Unit 09 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam8.json" },
    { title: "Unit 09 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam9.json" },
    { title: "Unit 09 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit9_exam10.json" }
];
const ENGLISH_U10_EXAMS = [
    { title: "Unit 10 - Exam 1", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam1.json" },
    { title: "Unit 10 - Exam 2", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam2.json" },
    { title: "Unit 10 - Exam 3", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam3.json" },
    { title: "Unit 10 - Exam 4", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam4.json" },
    { title: "Unit 10 - Exam 5", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam5.json" },
    { title: "Unit 10 - Exam 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam6.json" },
    { title: "Unit 10 - Exam 7", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam7.json" },
    { title: "Unit 10 - Exam 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam8.json" },
    { title: "Unit 10 - Exam 9", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam9.json" },
    { title: "Unit 10 - Exam 10", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/English_s2_unit10_exam10.json" }
];

// Helper function to clean and parse JSON that might contain BOM or non-breaking spaces
const cleanAndParseJson = (text: string) => {
    let cleanedText = text.replace(/^\uFEFF/, '').trim();
    const firstBrace = cleanedText.indexOf('{');
    const firstBracket = cleanedText.indexOf('[');
    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = cleanedText.lastIndexOf('}');
    } else if (firstBracket !== -1) {
        start = firstBracket;
        end = cleanedText.lastIndexOf(']');
    }

    if (start !== -1 && end !== -1 && end > start) {
        cleanedText = cleanedText.substring(start, end + 1);
    }
    cleanedText = cleanedText.replace(/\u00A0/g, ' ');

    try {
        const data = JSON.parse(cleanedText);
        return Array.isArray(data) ? data : data.questions;
    } catch (e) {
        if (!cleanedText.includes('404')) {
            throw e;
        }
        return null;
    }
};

const App: React.FC = () => {
    // -------------------------------------------------------------------------
    // 1. Basic State & Refs
    // -------------------------------------------------------------------------
    const isNavigatingBackRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSyncedProgressRef = useRef<UserProgress | null>(null);

    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);

    const getStorageKey = useCallback((suffix: string, userId?: string) => `joschool_${userId || 'guest'}_${suffix}`, []);

    // Initial state cleanup for legacy shared progress
    useEffect(() => {
        const legacyKeys = ['userProgress', 'joschool_app_state'];
        legacyKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`Legacy shared data cleared: ${key}`);
            }
        });
    }, []);

    // Replay state from isolated storage based on user
    const loadStateForUser = useCallback((userId?: string) => {
        try {
            const key = getStorageKey('app_state', userId);
            const saved = localStorage.getItem(key);
            if (!saved) return null;
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }, [getStorageKey]);

    const [viewHistory, setViewHistory] = useState<View[]>([View.Landing]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [sessionTitle, setSessionTitle] = useState<string>('');
    
    // View state
    const currentView = viewHistory[viewHistory.length - 1] || View.Landing;

    // -------------------------------------------------------------------------
    // 2. Navigation Functions (Moved Up to Prevent Reference Errors)
    // -------------------------------------------------------------------------
    const goToHome = useCallback(() => {
        isNavigatingBackRef.current = true;
        setSelectedSubject(null);
        setSessionTitle('');
        setViewHistory([View.Landing]);
        window.history.pushState({ viewHistory: [View.Landing] }, '', '');
    }, [setViewHistory, setSelectedSubject, setSessionTitle]);

    const navigateTo = useCallback((newView: View, title?: string) => {
        if (title) setSessionTitle(title);
        const nextIndex = viewHistory.length;
        window.history.pushState({ view: newView, historyIndex: nextIndex }, '');
        setViewHistory(prev => [...prev, newView]);
    }, [viewHistory.length, setViewHistory, setSessionTitle]);

    // -------------------------------------------------------------------------
    // 3. Main State
    // -------------------------------------------------------------------------

    // Guard against corrupted state
    useEffect(() => {
        if (!Array.isArray(viewHistory) || viewHistory.length === 0) {
            setViewHistory([View.Landing]);
        }
        // Ensure root history state exists
        if (!window.history.state) {
            window.history.replaceState({ view: View.Landing, historyIndex: 0 }, '');
        }
    }, [viewHistory]);

    const isJordanHistory = selectedSubject?.id === SubjectName.JordanHistory;
    const isIslamicEducation = selectedSubject?.id === SubjectName.IslamicEducation;
    const isArabic = selectedSubject?.id === SubjectName.Arabic;
    const isEnglish = selectedSubject?.id === SubjectName.English;

    const getDefaultProgress = useCallback((): UserProgress => ({
        completedLessons: [],
        quizResults: [],
        favoriteQuestions: [],
        examProgresses: {},
        totalTimeSpent: 0,
        lastActive: new Date().toISOString()
    }), []);

    const [userProgress, setUserProgress] = useState<UserProgress>(getDefaultProgress());

    const [pendingExamData, setPendingExamData] = useState<{
        lesson: any;
        chunkIndex?: number;
        unitTitle?: string;
        isUnitExam: boolean;
        isSessionExam?: boolean;
        progress?: ExamProgress;
    } | null>(null);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

    // Effect to handle user identity and isolated state loading
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            const prevUid = user?.uid;
            const newUid = currentUser?.uid;

            // Only act if user identity changed or it's first load
            if (prevUid !== newUid || isAuthenticating) {
                setUser(currentUser);
                setIsAuthenticating(false);

                // 1. Reset/Load progress
                const progressKey = getStorageKey('user_progress', newUid);
                const savedProgress = localStorage.getItem(progressKey);
                if (savedProgress) {
                    try {
                        const parsed = JSON.parse(savedProgress);
                        const sanitizedFavorites = parsed?.favoriteQuestions 
                            ? parsed.favoriteQuestions.filter((q: any) => typeof q === 'object' && q !== null)
                            : [];
                        setUserProgress({
                            ...getDefaultProgress(),
                            ...parsed,
                            favoriteQuestions: sanitizedFavorites
                        });
                    } catch (e) {
                        setUserProgress(getDefaultProgress());
                    }
                } else {
                    setUserProgress(getDefaultProgress());
                }

                // 2. Reset/Load session state
                const state = loadStateForUser(newUid);
                if (state) {
                    if (state.viewHistory) setViewHistory(state.viewHistory);
                    if (state.selectedSubject) setSelectedSubject(state.selectedSubject);
                    if (state.sessionTitle) setSessionTitle(state.sessionTitle);
                    if (state.currentQuiz) setCurrentQuiz(state.currentQuiz);
                    if (state.currentQuestionIndex !== undefined) setCurrentQuestionIndex(state.currentQuestionIndex);
                    if (state.userAnswers) setUserAnswers(state.userAnswers);
                    if (state.showResults !== undefined) setShowResults(state.showResults);
                    if (state.timer !== undefined) setTimer(state.timer);
                    if (state.currentPdfUrl) setCurrentPdfUrl(state.currentPdfUrl);
                    if (state.pdfTitle) setPdfTitle(state.pdfTitle);
                    if (state.currentLessonTitle) setCurrentLessonTitle(state.currentLessonTitle);
                    if (state.currentUnitTitle) setCurrentUnitTitle(state.currentUnitTitle);
                    if (state.examNumber !== undefined) setExamNumber(state.examNumber);
                    if (state.expandedUnitIndices) setExpandedUnitIndices(state.expandedUnitIndices);
                    if (state.expandedLessonKeys) setExpandedLessonKeys(state.expandedLessonKeys);
                } else {
                    // Start fresh for new account or guest
                    setViewHistory([View.Landing]);
                    setSelectedSubject(null);
                    setSessionTitle('');
                    setCurrentQuiz([]);
                    setCurrentQuestionIndex(0);
                    setUserAnswers([]);
                    setShowResults(false);
                    setTimer(0);
                    setCurrentPdfUrl('');
                    setPdfTitle('');
                    setCurrentLessonTitle('');
                    setCurrentUnitTitle('');
                    setExamNumber(null);
                    setExpandedUnitIndices([]);
                    setExpandedLessonKeys([]);
                }
            }
        });
        return () => unsubscribe();
    }, [user, isAuthenticating, getStorageKey, loadStateForUser, getDefaultProgress]);

    useEffect(() => {
        const key = getStorageKey('user_progress', user?.uid);
        localStorage.setItem(key, JSON.stringify(userProgress));
        
        if (user) {
            // Only push to cloud if meaningful data changed (excluding just time/lastActive unless significantly different)
            const lastSynced = lastSyncedProgressRef.current;
            const hasMeaningfulChange = !lastSynced || 
                JSON.stringify(lastSynced.completedLessons) !== JSON.stringify(userProgress.completedLessons) ||
                JSON.stringify(lastSynced.quizResults) !== JSON.stringify(userProgress.quizResults) ||
                JSON.stringify(lastSynced.favoriteQuestions) !== JSON.stringify(userProgress.favoriteQuestions);

            // If it's just time, only sync every 15 minutes to save quota
            const timeSinceLastSync = lastSynced 
                ? (new Date(userProgress.lastActive).getTime() - new Date(lastSynced.lastActive).getTime()) / 1000 
                : 9999;
            
            const shouldSyncTime = timeSinceLastSync > 900; // 15 minutes

            if (hasMeaningfulChange || shouldSyncTime) {
                const timer = setTimeout(() => {
                    saveUserProgress(user.uid, userProgress);
                    lastSyncedProgressRef.current = userProgress;
                }, 10000); // Debounce cloud saves by 10 seconds
                return () => clearTimeout(timer);
            }
        }
    }, [userProgress, user, getStorageKey]);

    // Auth logic - DELETED: Integrated into identity effect above

    // Sync logic from cloud to local
    useEffect(() => {
        if (user) {
            // Subscribe to cloud progress when logged in
            const unsubSync = subscribeToUserProgress(user.uid, (cloudProgress) => {
                if (cloudProgress) {
                    setUserProgress(prev => {
                        const cloudTime = new Date(cloudProgress.lastActive).getTime();
                        const localTime = new Date(prev.lastActive).getTime();
                        
                        // ONLY update local if cloud is strictly NEWER
                        if (cloudTime > localTime) {
                            lastSyncedProgressRef.current = cloudProgress;
                            return cloudProgress;
                        }
                        return prev;
                    });
                }
            });
            return () => unsubSync();
        }
    }, [user]);

    // Track time spent
    useEffect(() => {
        const interval = setInterval(() => {
            setUserProgress(prev => ({
                ...prev,
                totalTimeSpent: prev.totalTimeSpent + 1,
                lastActive: new Date().toISOString()
            }));
        }, 60000); // Update every minute instead of every second
        return () => clearInterval(interval);
    }, []);

    const [isDbLoaded, setIsDbLoaded] = useState(true);
    const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
    const [isLoadingExam, setIsLoadingExam] = useState(false);
    const [showBackConfirmation, setShowBackConfirmation] = useState(false);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [showMultiBooksModal, setShowMultiBooksModal] = useState(false);
    const [currentPdfUrl, setCurrentPdfUrl] = useState('');
    const [pdfTitle, setPdfTitle] = useState('');
    const [currentLessonTitle, setCurrentLessonTitle] = useState('');
    const [currentUnitTitle, setCurrentUnitTitle] = useState('');
    const [examNumber, setExamNumber] = useState<number | null>(null);
    const [timer, setTimer] = useState(0);

    const [currentQuiz, setCurrentQuiz] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [expandedUnitIndices, setExpandedUnitIndices] = useState<number[]>([]);
    const [expandedLessonKeys, setExpandedLessonKeys] = useState<string[]>([]);

    // Save state to localStorage on any change (now isolated per user)
    useEffect(() => {
        if (!user && isAuthenticating) return; // Wait for initial auth attempt
        
        const appState = {
            viewHistory,
            selectedSubject,
            sessionTitle,
            currentQuiz,
            currentQuestionIndex,
            userAnswers,
            showResults,
            currentLessonTitle,
            currentUnitTitle,
            examNumber,
            timer,
            expandedUnitIndices,
            expandedLessonKeys,
            currentPdfUrl,
            pdfTitle
        };
        const key = getStorageKey('app_state', user?.uid);
        localStorage.setItem(key, JSON.stringify(appState));
    }, [user, isAuthenticating, getStorageKey, viewHistory, selectedSubject, sessionTitle, currentQuiz, currentQuestionIndex, userAnswers, showResults, currentLessonTitle, currentUnitTitle, examNumber, timer, expandedUnitIndices, expandedLessonKeys, currentPdfUrl, pdfTitle]);

    // Long press recovery mechanism: Press and hold anywhere for 5 seconds to go home
    useEffect(() => {
        let longPressTimer: NodeJS.Timeout | null = null;
        const duration = 5000; // 5 seconds

        const handleStart = () => {
            longPressTimer = setTimeout(() => {
                console.log("Recovery: Long press detected. Returning home...");
                goToHome();
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate([100, 50, 100]);
                }
            }, duration);
        };

        const handleEnd = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };

        window.addEventListener('touchstart', handleStart, { passive: true });
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('mousedown', handleStart);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('mouseleave', handleEnd);

        return () => {
            if (longPressTimer) clearTimeout(longPressTimer);
            window.removeEventListener('touchstart', handleStart);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mousedown', handleStart);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('mouseleave', handleEnd);
        };
    }, [goToHome]);

    // Reset quiz states when leaving the Quiz view completely
    useEffect(() => {
        // Essential safety check - if history is missing or corrupted, reset to landing
        if (!Array.isArray(viewHistory) || viewHistory.length === 0) {
            console.log("Resetting corrupted view history");
            setViewHistory([View.Landing]);
            return;
        }

        const currentView = viewHistory[viewHistory.length - 1];

        if (currentView !== View.Quiz) {
            setShowResults(false);
            setCurrentQuiz([]);
            setCurrentQuestionIndex(0);
            setUserAnswers([]);
            setTimer(0);
        }
        
        // Data integrity checks
        if (currentView === View.SubjectIndex && !selectedSubject) {
            console.warn("SubjectIndex view active but no subject selected. Redirecting home.");
            goToHome();
        }
    }, [currentView, viewHistory, selectedSubject, goToHome]);

    const fetchExams = useCallback(() => {
        setIsBackgroundFetching(true);
        const examSets = [
            { subject: "SESSION_2008", exams: SESSION_2008_EXAMS },
            { subject: "SESSION_2008_SUP", exams: SESSION_2008_SUP_EXAMS },
            { subject: SubjectName.JordanHistory, exams: [...HISTORY_U1_EXAMS, ...HISTORY_U2_EXAMS, ...HISTORY_U3_EXAMS, ...HISTORY_S2_U4_EXAMS, ...HISTORY_S2_U5_EXAMS, ...HISTORY_S2_U6_EXAMS, ...HISTORY_S2_U7_EXAMS, ...HISTORY_S2_U8_EXAMS] },
            { subject: SubjectName.IslamicEducation, exams: [...ISLAMIC_U1_EXAMS, ...ISLAMIC_U2_EXAMS, ...ISLAMIC_U3_EXAMS, ...ISLAMIC_U4_EXAMS, ...ISLAMIC_S2_U1_EXAMS, ...ISLAMIC_S2_U2_EXAMS, ...ISLAMIC_S2_U3_EXAMS, ...ISLAMIC_S2_U4_EXAMS] },
            { subject: SubjectName.Arabic, exams: ARABIC_EXAMS },
            { subject: SubjectName.English, exams: [...ENGLISH_U1_EXAMS, ...ENGLISH_U2_EXAMS, ...ENGLISH_U3_EXAMS, ...ENGLISH_U4_EXAMS, ...ENGLISH_U5_EXAMS, ...ENGLISH_U6_EXAMS, ...ENGLISH_U7_EXAMS, ...ENGLISH_U8_EXAMS, ...ENGLISH_U9_EXAMS, ...ENGLISH_U10_EXAMS] }
        ];

        const allPromises: Promise<void>[] = [];

        examSets.forEach(set => {
            set.exams.forEach(item => {
                if (!item.url) return;
                
                // Skip if already in database
                const subjectKey = (set.subject === "SESSION_2008" || set.subject === "SESSION_2008_SUP") 
                    ? (item as any).subject 
                    : set.subject;
                
                if (examsDatabase[subjectKey]?.[item.title]) return;

                const p = fetch(item.url)
                    .then(res => {
                        if (!res.ok) return null;
                        return res.text();
                    })
                    .then(text => {
                        if (!text) return;
                        return new Promise<void>(resolve => {
                            setTimeout(() => {
                                try {
                                    const questions = cleanAndParseJson(text);
                                    if (questions && questions.length > 0) {
                                        updateDatabase(subjectKey, item.title, questions);
                                    }
                                } catch (parseError) {
                                    console.error(`Failed to parse JSON for ${item.url}:`, parseError);
                                }
                                resolve();
                            }, 0);
                        });
                    })
                    .catch(e => {});
                allPromises.push(p);
            });
        });

        Promise.all(allPromises).finally(() => {
            setIsBackgroundFetching(false);
            saveToCache();
        });
    }, []);

    useEffect(() => {
        // Load data from cache once on mount
        loadFromCache();
        
        // Initial setup for browser history to handle back button on Landing page
        if (!window.history.state || !window.history.state.view) {
            window.history.replaceState({ view: View.Landing, historyIndex: 0 }, '');
        }

        // Start background data fetch
        fetchExams();
    }, [fetchExams]);

    const getExamsForSubject = (subject: SubjectName) => {
        switch (subject) {
            case SubjectName.JordanHistory: return [...HISTORY_U1_EXAMS, ...HISTORY_U2_EXAMS, ...HISTORY_U3_EXAMS, ...HISTORY_S2_U4_EXAMS, ...HISTORY_S2_U5_EXAMS, ...HISTORY_S2_U6_EXAMS, ...HISTORY_S2_U7_EXAMS, ...HISTORY_S2_U8_EXAMS];
            case SubjectName.IslamicEducation: return [...ISLAMIC_U1_EXAMS, ...ISLAMIC_U2_EXAMS, ...ISLAMIC_U3_EXAMS, ...ISLAMIC_U4_EXAMS, ...ISLAMIC_S2_U1_EXAMS, ...ISLAMIC_S2_U2_EXAMS, ...ISLAMIC_S2_U3_EXAMS, ...ISLAMIC_S2_U4_EXAMS];
            case SubjectName.Arabic: return ARABIC_EXAMS;
            case SubjectName.English: return [...ENGLISH_U1_EXAMS, ...ENGLISH_U2_EXAMS, ...ENGLISH_U3_EXAMS, ...ENGLISH_U4_EXAMS, ...ENGLISH_U5_EXAMS, ...ENGLISH_U6_EXAMS, ...ENGLISH_U7_EXAMS, ...ENGLISH_U8_EXAMS, ...ENGLISH_U9_EXAMS, ...ENGLISH_U10_EXAMS];
            default: return [];
        }
    };

    // مراقبة تغيير المادة المختارة لتسريع تحميل اختباراتها إذا لم تكن محملة
    useEffect(() => {
        if (selectedSubject) {
            const subjectExams = getExamsForSubject(selectedSubject.id as SubjectName);
            subjectExams.forEach(item => {
                if (item.url && !examsDatabase[selectedSubject.id as SubjectName]?.[item.title]) {
                    fetch(item.url)
                        .then(res => {
                            if (!res.ok) return null;
                            return res.text();
                        })
                        .then(text => {
                            if (!text) return;
                            try {
                                const questions = cleanAndParseJson(text);
                                if (questions) {
                                    updateDatabase(selectedSubject.id as SubjectName, item.title, questions);
                                }
                            } catch (e) {
                                console.error(`Failed to prioritize ${item.title}`, e);
                            }
                        })
                        .catch(err => console.error(`Failed to prioritize ${item.title}`, err));
                }
            });
        }
    }, [selectedSubject]);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const state = event.state;
            
            // Close resume modal if it's open
            if (showResumeModal) {
                setShowResumeModal(false);
                setPendingExamData(null);
                window.history.pushState({ view: currentView, historyIndex: viewHistory.length - 1 }, '');
                return;
            }

            // Stricter check for quiz navigation protection
            const isQuizActive = currentView === View.Quiz && !showResults;

            if (isQuizActive && !isNavigatingBackRef.current) {
                // IMPORTANT: Intercept immediately by pushing state back
                window.history.pushState({ view: currentView, historyIndex: viewHistory.length - 1 }, '');
                setShowBackConfirmation(true);
                return;
            }

            // Exit confirmation for Landing page
            if (currentView === View.Landing && !isNavigatingBackRef.current) {
                window.history.pushState({ view: View.Landing, historyIndex: 0 }, '');
                setShowExitConfirmation(true);
                return;
            }

            // Normal navigation or confirmed back
            if (isNavigatingBackRef.current) {
                isNavigatingBackRef.current = false;
            }
            
            if (state && typeof state.historyIndex === 'number') {
                setViewHistory(prev => prev.slice(0, state.historyIndex + 1));
            } else {
                setViewHistory(prev => prev.length > 1 ? prev.slice(0, -1) : [View.Landing]);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [currentView, showResults, viewHistory.length, showResumeModal, setShowBackConfirmation]);

    // Scroll to top on view change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentView]);

    const goBack = useCallback(() => {
        if (currentView === View.Quiz && !showResults) {
            setShowBackConfirmation(true);
        } else if (currentView === View.Landing) {
            setShowExitConfirmation(true);
        } else {
            // Use window.history.back() to trigger popstate handler correctly
            window.history.back();
        }
    }, [currentView, showResults, setShowBackConfirmation, setShowExitConfirmation]);

    const confirmLeaveQuiz = () => {
        // Save progress before leaving
        if (currentQuiz.length > 0 && !showResults) {
            const key = `${selectedSubject?.id}_${currentLessonTitle}`;
            const progress: ExamProgress = {
                subjectId: selectedSubject?.id || '',
                lessonTitle: currentLessonTitle,
                examNumber: examNumber || 1,
                currentQuestionIndex,
                userAnswers,
                totalQuestions: currentQuiz.length,
                lastUpdated: new Date().toISOString()
            };
            
            setUserProgress(prev => ({
                ...prev,
                lastActive: new Date().toISOString(),
                examProgresses: {
                    ...(prev.examProgresses || {}),
                    [key]: progress
                }
            }));
        }

        setShowBackConfirmation(false);
        isNavigatingBackRef.current = true;
        
        // Use browser back to trigger the clean history movement
        // This will be caught by popstate which will perform the view transition
        window.history.back();
    };

    const confirmExitApp = () => {
        setShowExitConfirmation(false);
        isNavigatingBackRef.current = true;
        // Go back twice to leave the application (one for landing, one for re-pushed state)
        window.history.go(-2);
    };

    const toggleFavoriteQuestion = (question: Question, subjectId: string, lessonTitle: string) => {
        if (sessionTitle) return; // Disable for session exams

        setUserProgress(prev => {
            const isFavorite = prev.favoriteQuestions.some(q => 
                String(q.question).trim() === String(question.question).trim() && 
                q.subjectId === subjectId && 
                (q.semester || '') === (selectedSubject?.semester || '')
            );
            return {
                ...prev,
                lastActive: new Date().toISOString(),
                favoriteQuestions: isFavorite 
                    ? prev.favoriteQuestions.filter(q => 
                        !(String(q.question).trim() === String(question.question).trim() && q.subjectId === subjectId && (q.semester || '') === (selectedSubject?.semester || ''))
                    )
                    : [...prev.favoriteQuestions, { 
                        ...question, 
                        subjectId, 
                        lessonTitle, 
                        semester: selectedSubject?.semester 
                      }]
            };
        });
    };

    const isQuestionFavorite = (questionText: string) => {
        return userProgress.favoriteQuestions.some(q => 
            q.question === questionText && 
            q.subjectId === selectedSubject?.id && 
            q.semester === selectedSubject?.semester
        );
    };

    const toggleUnit = (idx: number) => {
        setExpandedUnitIndices(prev => 
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const toggleLesson = (key: string) => {
        setExpandedLessonKeys(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const openExternalBook = () => {
        if (!selectedSubject) return;
        if (selectedSubject.multiBooks) {
            setShowMultiBooksModal(true);
        } else if (selectedSubject.textbookUrl) {
            window.open(selectedSubject.textbookUrl, '_blank');
        }
    };

    const startQuiz = async (lesson: any, chunkIndex?: number, unitTitle?: string, resumeProgress?: ExamProgress) => {
        let questions = getQuizzesForLesson(selectedSubject?.id as SubjectName, lesson.title, chunkIndex);
        
        // If questions are not loaded yet, try to fetch them immediately
        if (!questions || questions.length === 0) {
            setIsLoadingExam(true);
            try {
                // Find the exam config for this lesson
                const subjectExams = getExamsForSubject(selectedSubject?.id as SubjectName);
                const examConfig = subjectExams.find(e => e.title === lesson.title);
                
                if (examConfig && examConfig.url) {
                    const res = await fetch(examConfig.url);
                    if (res.ok) {
                        const text = await res.text();
                        const fetchedQuestions = cleanAndParseJson(text);
                        if (fetchedQuestions) {
                            updateDatabase(selectedSubject?.id as SubjectName, lesson.title, fetchedQuestions);
                            questions = getQuizzesForLesson(selectedSubject?.id as SubjectName, lesson.title, chunkIndex);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load exam on demand", e);
            } finally {
                setIsLoadingExam(false);
            }
        }

        if (!questions || questions.length === 0) return;
        
        const isEnglish = selectedSubject?.id === SubjectName.English;
        const examNum = (chunkIndex || 0) + 1;
        const examLabel = isEnglish ? `Exam (${examNum})` : `امتحان (${examNum})`;
        const fullLessonTitle = `${lesson.title} - ${examLabel}`;

        setCurrentLessonTitle(fullLessonTitle);
        setCurrentUnitTitle(unitTitle || '');
        setExamNumber(examNum);
        setCurrentQuiz([...questions]);
        
        if (resumeProgress && resumeProgress.lessonTitle === fullLessonTitle) {
            setCurrentQuestionIndex(resumeProgress.currentQuestionIndex);
            setUserAnswers(resumeProgress.userAnswers);
            // setTimer based on remaining questions roughly or use saved timer if we had it
            setTimer((resumeProgress.totalQuestions - resumeProgress.currentQuestionIndex) * 60); 
        } else {
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(questions.length).fill(null));
            setTimer(questions.length * 60); // 1 minute per question
        }
        
        setShowResults(false);
        navigateTo(View.Quiz);
    };

    const handleStartQuiz = (lesson: any, chunkIndex?: number, unitTitle?: string) => {
        const isEnglish = selectedSubject?.id === SubjectName.English;
        const examNum = (chunkIndex || 0) + 1;
        const examLabel = isEnglish ? `Exam (${examNum})` : `امتحان (${examNum})`;
        const fullLessonTitle = `${lesson.title} - ${examLabel}`;
        const key = `${selectedSubject?.id}_${fullLessonTitle}`;
        const existingProgress = userProgress.examProgresses?.[key];

        if (existingProgress && existingProgress.currentQuestionIndex > 0) {
            setPendingExamData({ lesson, chunkIndex, unitTitle, isUnitExam: false, progress: existingProgress });
            setShowResumeModal(true);
        } else {
            startQuiz(lesson, chunkIndex, unitTitle);
        }
    };

    const startUnitExam = async (unit: any, resumeProgress?: ExamProgress) => {
        if (!selectedSubject) return;
        
        let questions = getQuizzesForUnit(selectedSubject.id as SubjectName, unit);
        
        // If not enough questions or not loaded, try to load all lessons in unit
        if (questions.length === 0) {
            setIsLoadingExam(true);
            try {
                const subjectExams = getExamsForSubject(selectedSubject.id as SubjectName);
                const promises = unit.lessons.map(async (lesson: any) => {
                    if (!examsDatabase[selectedSubject.id as SubjectName]?.[lesson.title]) {
                        const examConfig = subjectExams.find(e => e.title === lesson.title);
                        if (examConfig && examConfig.url) {
                            const res = await fetch(examConfig.url);
                            if (res.ok) {
                                const text = await res.text();
                                const fetchedQuestions = cleanAndParseJson(text);
                                if (fetchedQuestions) {
                                    updateDatabase(selectedSubject.id as SubjectName, lesson.title, fetchedQuestions);
                                }
                            }
                        }
                    }
                });
                await Promise.all(promises);
                questions = getQuizzesForUnit(selectedSubject.id as SubjectName, unit);
            } catch (e) {
                console.error("Failed to load unit exam on demand", e);
            } finally {
                setIsLoadingExam(false);
            }
        }

        if (questions.length === 0) return;

        const unitOrdinal = unit.title.split(':')[0];
        const isEnglish = selectedSubject?.id === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const fullLessonTitle = `${unitOrdinal} - ${examLabel}`;

        setCurrentLessonTitle(fullLessonTitle);
        setCurrentUnitTitle(unit.title);
        setExamNumber(1);
        setCurrentQuiz(questions);
        
        if (resumeProgress && resumeProgress.lessonTitle === fullLessonTitle) {
            setCurrentQuestionIndex(resumeProgress.currentQuestionIndex);
            setUserAnswers(resumeProgress.userAnswers);
            setTimer((resumeProgress.totalQuestions - resumeProgress.currentQuestionIndex) * 60);
        } else {
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(questions.length).fill(null));
            setTimer(questions.length * 60); // 1 minute per question
        }

        setShowResults(false);
        navigateTo(View.Quiz);
    };

    const handleStartUnitExam = (unit: any, uIdx: number) => {
        const unitOrdinal = unit.title.split(':')[0];
        const isEnglish = selectedSubject?.id === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const fullLessonTitle = `${unitOrdinal} - ${examLabel}`;
        const key = `${selectedSubject?.id}_${fullLessonTitle}`;
        const existingProgress = userProgress.examProgresses?.[key];

        if (existingProgress && existingProgress.currentQuestionIndex > 0) {
            setPendingExamData({ lesson: unit, isUnitExam: true, progress: existingProgress });
            setShowResumeModal(true);
        } else {
            startUnitExam(unit);
        }
    };

    const confirmResume = () => {
        if (!pendingExamData) return;
        if (pendingExamData.isUnitExam) {
            startUnitExam(pendingExamData.lesson, pendingExamData.progress);
        } else if (pendingExamData.isSessionExam) {
            const isEnglish = selectedSubject?.id === SubjectName.English;
            const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
            startSessionExam(`${pendingExamData.lesson.title} - ${examLabel}`, pendingExamData.lesson.questions, pendingExamData.progress);
        } else {
            startQuiz(pendingExamData.lesson, pendingExamData.chunkIndex, pendingExamData.unitTitle, pendingExamData.progress);
        }
        setShowResumeModal(false);
        setPendingExamData(null);
    };

    const confirmRestart = () => {
        if (!pendingExamData) return;
        if (pendingExamData.isUnitExam) {
            startUnitExam(pendingExamData.lesson);
        } else if (pendingExamData.isSessionExam) {
            const isEnglish = selectedSubject?.id === SubjectName.English;
            const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
            startSessionExam(`${pendingExamData.lesson.title} - ${examLabel}`, pendingExamData.lesson.questions);
        } else {
            startQuiz(pendingExamData.lesson, pendingExamData.chunkIndex, pendingExamData.unitTitle);
        }
        setShowResumeModal(false);
        setPendingExamData(null);
    };

    const handleStartComprehensiveExam = async () => {
        if (!selectedSubject) return;
        let subjectData = examsDatabase[selectedSubject.id as SubjectName];
        
        // If subject data is not loaded, try to load all exams for this subject
        if (!subjectData || Object.keys(subjectData).length === 0) {
            setIsLoadingExam(true);
            try {
                const subjectExams = getExamsForSubject(selectedSubject.id as SubjectName);
                const promises = subjectExams.map(async (item) => {
                    if (!item.url) return;
                    if (!examsDatabase[selectedSubject.id as SubjectName]?.[item.title]) {
                        const res = await fetch(item.url);
                        if (res.ok) {
                            const text = await res.text();
                            const questions = cleanAndParseJson(text);
                            if (questions) {
                                updateDatabase(selectedSubject.id as SubjectName, item.title, questions);
                            }
                        }
                    }
                });
                await Promise.all(promises);
                subjectData = examsDatabase[selectedSubject.id as SubjectName];
            } catch (e) {
                console.error("Failed to load comprehensive exam on demand", e);
            } finally {
                setIsLoadingExam(false);
            }
        }

        if (!subjectData) return;

        const allQuestions: Question[] = [];
        Object.values(subjectData).forEach(lessonChunks => {
            lessonChunks.forEach(chunk => {
                allQuestions.push(...chunk);
            });
        });

        if (allQuestions.length === 0) return;

        // Shuffle and pick 40 questions
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 40);

        const isEnglish = selectedSubject?.id === SubjectName.English;
        const title = isEnglish ? 'Comprehensive Exam - Exam (1)' : 'امتحان شامل - امتحان (1)';
        setCurrentLessonTitle(title);
        setCurrentQuiz(selected);
        setCurrentQuestionIndex(0);
        setUserAnswers(new Array(selected.length).fill(null));
        setShowResults(false);
        setTimer(40 * 60); // 40 minutes
        navigateTo(View.Quiz);
    };

    const handleFinish = useCallback(() => {
        setShowResults(true);
        if (timerRef.current) clearInterval(timerRef.current);
        
        setUserProgress(prev => {
            // Clear active progress for this exam since it's finished
            const newProgresses = { ...(prev.examProgresses || {}) };
            const key = `${selectedSubject?.id}_${currentLessonTitle}`;
            delete newProgresses[key];
            
            // Mark lesson as completed if it's a normal lesson quiz
            const isUnitExam = currentLessonTitle.includes('الوحدة') || currentLessonTitle.includes('الوِحْدَةُ');
            const isComprehensive = currentLessonTitle.includes('امتحان شامل');
            
            let newCompleted = prev.completedLessons;
            if (!isUnitExam && !isComprehensive) {
                newCompleted = prev.completedLessons.includes(currentLessonTitle) 
                    ? prev.completedLessons 
                    : [...prev.completedLessons, currentLessonTitle];
            }

            return {
                ...prev,
                lastActive: new Date().toISOString(),
                examProgresses: newProgresses,
                completedLessons: newCompleted
            };
        });
    }, [currentLessonTitle, setUserProgress, selectedSubject]);

    useEffect(() => {
        if (currentView === View.Quiz && !showResults && timer > 0) {
            timerRef.current = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        handleFinish();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentView, showResults, timer, handleFinish]);

    const handleAnswer = (choice: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = choice;
        setUserAnswers(newAnswers);

        // Auto-save progress for session exams or any exam
        if (!showResults && currentQuiz.length > 0 && selectedSubject) {
            const key = `${selectedSubject.id}_${currentLessonTitle}`;
            setUserProgress(prev => {
                const newProgresses = { ...(prev.examProgresses || {}) };
                newProgresses[key] = {
                    subjectId: selectedSubject.id,
                    lessonTitle: currentLessonTitle,
                    examNumber: examNumber || 1,
                    currentQuestionIndex,
                    userAnswers: newAnswers,
                    totalQuestions: currentQuiz.length,
                    lastUpdated: new Date().toISOString()
                };
                return {
                    ...prev,
                    lastActive: new Date().toISOString(),
                    examProgresses: newProgresses
                };
            });
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < currentQuiz.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const startSessionExam = (title: string, questions: Question[], progress?: ExamProgress) => {
        setCurrentLessonTitle(title);
        setCurrentQuiz(questions);
        if (progress && progress.currentQuestionIndex > 0) {
            setCurrentQuestionIndex(progress.currentQuestionIndex);
            setUserAnswers(progress.userAnswers);
            setTimer((progress.totalQuestions - progress.currentQuestionIndex) * 60);
        } else {
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(questions.length).fill(null));
            setTimer(questions.length * 60);
        }
        setShowResults(false);
        navigateTo(View.Quiz);
    };

    const handleStartMockExam = async (subjectId: SubjectName) => {
        setIsLoadingExam(true);
        try {
            // Find the subject object to set it as selected
            const subject = subjectsData.find(s => s.id === subjectId);
            if (subject) setSelectedSubject(subject);

            const allExams = getExamsForSubject(subjectId);
            if (allExams.length === 0) {
                alert('عذراً، هذا الامتحان غير متوفر حالياً.');
                return;
            }

            // Fetch all missing exams using Promise.all to load everything for the mock exam
            const fetchPromises = allExams.map(async (exam) => {
                let questions = getQuizzesForLesson(subjectId, exam.title);
                if ((!questions || questions.length === 0) && exam.url) {
                    try {
                        const res = await fetch(exam.url);
                        const text = await res.text();
                        const qs = cleanAndParseJson(text);
                        if (qs && qs.length > 0) {
                            updateDatabase(subjectId, exam.title, qs);
                            questions = qs;
                        }
                    } catch (e) {
                        console.error(`Failed to fetch ${exam.title}`, e);
                    }
                }
                return { title: exam.title, questions: questions || [] };
            });

            const results = await Promise.all(fetchPromises);
            
            // Sampling logic: ensure 40 questions with at least one from each lesson
            const guaranteedQuestions: Question[] = [];
            const allRemainingQuestions: Question[] = [];
            
            // Filter out empty results
            const validResults = results.filter(r => r.questions.length > 0);

            if (validResults.length === 0) {
                alert('عذراً، لم تتوفر أسئلة لهذا الامتحان حالياً.');
                return;
            }

            validResults.forEach(res => {
                // Pick one random guaranteed question from each lesson
                const randomIndex = Math.floor(Math.random() * res.questions.length);
                guaranteedQuestions.push(res.questions[randomIndex]);
                
                // Add others to pool for extra filling
                const others = res.questions.filter((_, idx) => idx !== randomIndex);
                allRemainingQuestions.push(...others);
            });

            let finalQuestions: Question[] = [];
            if (guaranteedQuestions.length >= 40) {
                // If more than 40 lessons, pick 40 unique lessons randomly
                finalQuestions = guaranteedQuestions
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 40);
            } else {
                // If fewer than 40 lessons, take all guaranteed then fill up to 40
                finalQuestions = [...guaranteedQuestions];
                const pool = allRemainingQuestions.sort(() => Math.random() - 0.5);
                const needed = 40 - finalQuestions.length;
                finalQuestions.push(...pool.slice(0, needed));
            }

            // Final shuffle for the whole set
            finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);

            const isEnglish = subjectId === SubjectName.English;
            const examTitle = isEnglish ? 'Mock Exam' : 'امتحان تجريبي';
            startSessionExam(examTitle, finalQuestions);

        } catch (error) {
            console.error("Error starting mock exam:", error);
            alert('فشل تحميل الامتحان. يرجى المحاولة لاحقاً.');
        } finally {
            setIsLoadingExam(false);
        }
    };

    const handleStartSessionExam = (subjectId: SubjectName, sessionName: string) => {
        if (sessionName === 'الدورة التجريبية') {
            handleStartMockExam(subjectId);
            return;
        }

        // Find the subject object to set it as selected
        const subject = subjectsData.find(s => s.id === subjectId);
        if (subject) setSelectedSubject(subject);
        
        const sessionExams = sessionName === 'دورة 2008' ? SESSION_2008_EXAMS : SESSION_2008_SUP_EXAMS;
        const examInfo = sessionExams.find(e => e.subject === subjectId);
        
        if (!examInfo || !examInfo.url) {
            alert('عذراً، هذا الامتحان غير متوفر حالياً.');
            return;
        }

        const isEnglish = subjectId === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const fullLessonTitle = `${examInfo.title} - ${examLabel}`;
        const key = `${subjectId}_${fullLessonTitle}`;
        const existingProgress = userProgress.examProgresses?.[key];

        const questions = getQuizzesForLesson(subjectId, examInfo.title);
        if (!questions || questions.length === 0) {
            setIsLoadingExam(true);
            fetch(examInfo.url)
                .then(res => res.text())
                .then(text => {
                    const qs = cleanAndParseJson(text);
                    if (qs && qs.length > 0) {
                        updateDatabase(subjectId, examInfo.title, qs);
                        if (existingProgress && existingProgress.currentQuestionIndex > 0) {
                            setPendingExamData({ 
                                lesson: { title: examInfo.title, questions: qs }, 
                                isUnitExam: false, 
                                progress: existingProgress,
                                isSessionExam: true 
                            });
                            setShowResumeModal(true);
                        } else {
                            startSessionExam(fullLessonTitle, qs);
                        }
                    } else {
                        alert('عذراً، لم تتوفر أسئلة لهذا الامتحان حالياً.');
                    }
                })
                .catch(() => alert('فشل تحميل الامتحان. يرجى المحاولة لاحقاً.'))
                .finally(() => setIsLoadingExam(false));
            return;
        }

        if (existingProgress && existingProgress.currentQuestionIndex > 0) {
            setPendingExamData({ 
                lesson: { title: examInfo.title, questions: questions }, 
                isUnitExam: false, 
                progress: existingProgress,
                isSessionExam: true 
            });
            setShowResumeModal(true);
        } else {
            startSessionExam(fullLessonTitle, questions);
        }
    };

    const startQuizWithQuestions = (title: string, questions: Question[]) => {
        setCurrentLessonTitle(title);
        setCurrentQuiz(questions);
        setCurrentQuestionIndex(0);
        setUserAnswers(new Array(questions.length).fill(null));
        setShowResults(false);
        setTimer(questions.length * 60);
        navigateTo(View.Quiz);
    };

    const handleLogout = () => {
        setShowLogoutConfirmation(true);
    };

    const confirmLogout = async () => {
        try {
            setShowLogoutConfirmation(false);
            await signOut(auth);
            goToHome();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const clearFavoriteQuestions = (questionsToRemove: FavoriteQuestion[]) => {
        setUserProgress(prev => ({
            ...prev,
            lastActive: new Date().toISOString(),
            favoriteQuestions: prev.favoriteQuestions.filter(fav => 
                !questionsToRemove.some(q => 
                    String(q.question).trim() === String(fav.question).trim() && 
                    q.subjectId === fav.subjectId && 
                    (q.semester || '') === (fav.semester || '')
                )
            )
        }));
    };

    const currentViewComponent = () => {
        try {
            // Log current view state for debugging
            if (isAuthenticating) {
                console.log("App: Authenticating...");
                return (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 translate-y-[-10%]">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin absolute top-0 left-0" />
                        </div>
                        <p className="font-black text-slate-800 text-lg animate-pulse">جاري التحقق من الهوية...</p>
                        <p className="text-slate-400 text-[10px] mt-2 font-bold">يرجى الانتظار قليلاً</p>
                    </div>
                );
            }

            if (!user) {
                console.log("App: No user, showing AuthPage");
                return <AuthPage />;
            }

            const safeView = (viewHistory && Array.isArray(viewHistory) && viewHistory.length > 0) 
                ? viewHistory[viewHistory.length - 1] 
                : View.Landing;
                
            console.log("App: Rendering view:", safeView);

            switch (safeView) {
                case View.Landing: 
                    return (
                        <LandingPage 
                            subjectsData={subjectsData} 
                            navigateTo={(view, subject, title) => {
                                if (subject) setSelectedSubject(subject);
                                navigateTo(view, title);
                            }} 
                            View={View} 
                            user={user}
                            handleLogout={handleLogout}
                        />
                    );
                case View.SubjectIndex: 
                    if (!selectedSubject) {
                        console.warn("SubjectIndex active without selectedSubject. Resetting...");
                        setTimeout(() => {
                            setViewHistory([View.Landing]);
                        }, 0);
                        return <div className="p-10 text-center">جاري العودة للرئيسية...</div>;
                    }
                    return (
                        <SubjectIndexPage 
                            selectedSubject={selectedSubject} 
                            subjectIndexData={subjectIndexData} 
                            expandedUnitIndices={expandedUnitIndices} 
                            toggleUnit={toggleUnit} 
                            expandedLessonKeys={expandedLessonKeys} 
                            toggleLesson={toggleLesson} 
                            userProgress={userProgress} 
                            handleStartQuiz={handleStartQuiz} 
                            handleStartUnitExam={handleStartUnitExam}
                            handleStartComprehensiveExam={handleStartComprehensiveExam} 
                            openExternalBook={openExternalBook} 
                            navigateTo={navigateTo} 
                            onBack={goBack}
                        />
                    );
                case View.Quiz: 
                    // Safety check for currentQuiz
                    if (!currentQuiz || currentQuiz.length === 0) {
                        console.warn("Quiz view active but currentQuiz is empty. Redirecting...");
                        setTimeout(() => {
                            if (viewHistory.length > 1) {
                                goBack();
                            } else {
                                goToHome();
                            }
                        }, 0);
                        return (
                            <div className="flex flex-col items-center justify-center p-20 text-center">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="font-black text-slate-800">جاري استعادة البيانات...</p>
                            </div>
                        );
                    }

                    return showResults ? (
                        <ResultsPage 
                            userAnswers={userAnswers as (string | undefined)[]} 
                            currentQuiz={currentQuiz} 
                            selectedSubject={selectedSubject} 
                            currentLessonTitle={currentLessonTitle} 
                            currentUnitTitle={currentUnitTitle}
                            examNumber={examNumber}
                            setUserProgress={setUserProgress} 
                            setViewHistory={setViewHistory} 
                            goBack={goBack}
                            goToHome={goToHome} 
                            onBackToIndex={() => {
                                isNavigatingBackRef.current = true;
                                // Reset quiz specific states
                                setShowResults(false);
                                setCurrentQuiz([]);
                                setCurrentQuestionIndex(0);
                                setUserAnswers([]);

                                if (viewHistory.includes(View.SessionSubjects)) {
                                    const index = viewHistory.lastIndexOf(View.SessionSubjects);
                                    setViewHistory(prev => prev.slice(0, index + 1));
                                } else if (viewHistory.includes(View.SubjectIndex)) {
                                    const index = viewHistory.lastIndexOf(View.SubjectIndex);
                                    setViewHistory(prev => prev.slice(0, index + 1));
                                } else {
                                    goToHome();
                                }
                            }}
                            onBackToIndexLabel={viewHistory.includes(View.SessionSubjects) ? (isEnglish ? 'Back to Session' : 'العودة للدورة') : undefined}
                            isQuestionFavorite={isQuestionFavorite}
                            toggleFavoriteQuestion={toggleFavoriteQuestion}
                            isFavoriteDisabled={!!sessionTitle}
                        />
                    ) : (
                        <QuizPage 
                            currentQuiz={currentQuiz} 
                            currentQuestionIndex={currentQuestionIndex} 
                            userAnswers={userAnswers as (string | undefined)[]} 
                            handleAnswer={handleAnswer} 
                            handleNext={handleNext} 
                            handlePrevious={handlePrevious} 
                            handleFinish={handleFinish} 
                            timer={timer} 
                            formatTimer={formatTimer} 
                            isEnglish={isEnglish}
                            onBack={goBack}
                            selectedSubject={selectedSubject}
                            currentLessonTitle={currentLessonTitle}
                            isQuestionFavorite={isQuestionFavorite}
                            toggleFavoriteQuestion={toggleFavoriteQuestion}
                            isFavoriteDisabled={!!sessionTitle}
                        />
                    );
                case View.PdfViewer: 
                    return (
                        <PdfViewerScreen 
                            selectedSubject={selectedSubject} 
                            openExternalBook={openExternalBook} 
                        />
                    );
                case View.Progress: 
                    return (
                        <ProgressDashboard 
                            userProgress={userProgress} 
                            goBack={goBack}
                        />
                    );
                case View.Favorites:
                    return (
                        <FavoriteQuestionsPage 
                            favoriteQuestions={userProgress.favoriteQuestions}
                            selectedSubject={selectedSubject}
                            toggleFavoriteQuestion={toggleFavoriteQuestion}
                            clearFavoriteQuestions={clearFavoriteQuestions}
                            goBack={goBack}
                        />
                    );
                case View.SessionSubjects: 
                    return (
                        <SessionSubjectsPage 
                            subjectsData={subjectsData} 
                            navigateTo={(view, subject) => {
                                if (subject) setSelectedSubject(subject);
                                navigateTo(view);
                            }} 
                            onBack={goToHome}
                            sessionTitle={sessionTitle}
                            handleStartSessionExam={handleStartSessionExam}
                            userProgress={userProgress}
                        />
                    );
                default: 
                    console.log("App: View not matched, showing LandingPage");
                    return (
                        <LandingPage 
                            subjectsData={subjectsData} 
                            navigateTo={(view, subject, title) => {
                                if (subject) setSelectedSubject(subject);
                                navigateTo(view, title);
                            }} 
                            View={View} 
                            user={user}
                            handleLogout={handleLogout}
                        />
                    );
            }
        } catch (error) {
            console.error("Critical error in currentViewComponent:", error);
            return (
                <div className="p-10 text-center" dir="rtl">
                    <h2 className="text-xl font-black text-red-600 mb-4">حدث خطأ غير متوقع في العرض</h2>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('joschool_app_state');
                            window.location.reload();
                        }}
                        className="p-4 bg-primary text-white rounded-lg font-black"
                    >
                        تصفير الحالة والمحاولة مرة أخرى
                    </button>
                </div>
            );
        }
    };

    return (
        <div className={`min-h-screen bg-app-bg ${isJordanHistory ? 'theme-jordan' : ''} ${isIslamicEducation ? 'theme-islamic' : ''} ${isArabic ? 'theme-arabic' : ''} ${isEnglish ? 'theme-english' : ''}`}>
            
            {/* Background Fetching Indicator Removed */}

            {/* Exam Loading Overlay */}
            <AnimatePresence>
                {isLoadingExam && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10001] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
                            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                        <h3 className="text-xl font-black text-text-main mt-8 mb-2">جاري تحضير الامتحان...</h3>
                        <p className="text-text-sub font-bold text-sm">لحظات قليلة ونبدأ!</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {user && ![View.Landing, View.Quiz, View.SubjectIndex, View.Results, View.SessionSubjects, View.Favorites].includes(currentView) && (
                <button 
                    onClick={goBack}
                    className={`fixed top-4 z-[9999] p-3 bg-white border border-slate-900 rounded-full shadow-lg text-slate-600 hover:text-primary transition-all active:scale-95 
                        ${(isEnglish || currentView === View.SessionSubjects || currentView === View.Favorites || currentView === View.Progress || currentView === View.PdfViewer) ? 'left-4' : 'right-4'}`}
                    title={isEnglish ? "Back" : "رجوع"}
                >
                    {(isEnglish || currentView === View.SessionSubjects || currentView === View.Favorites || currentView === View.Progress || currentView === View.PdfViewer) ? <ChevronLeftIcon className="w-6 h-6" strokeWidth={3} /> : <ChevronRightIcon className="w-6 h-6" strokeWidth={3} />}
                </button>
            )}

            <main className="pb-10">
                {currentViewComponent()}
            </main>
            <AnimatePresence>
                {showBackConfirmation && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" 
                        dir="rtl"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border-2 border-slate-900 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            
                            <button 
                                onClick={() => setShowBackConfirmation(false)}
                                className="absolute top-4 left-4 p-2 bg-slate-50 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors z-10"
                            >
                                <XIcon className="w-4 h-4 text-slate-400" />
                            </button>
                            
                            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 rotate-3 shadow-inner">
                                <AlertCircle className="w-10 h-10" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 text-center mb-4 leading-tight">
                                {currentView === View.Quiz ? 'حفظ التقدم والخروج؟' : 'العودة للقائمة؟'}
                            </h3>
                            
                            <p className="text-slate-600 text-center mb-8 font-bold leading-relaxed px-2">
                                {currentView === View.Quiz 
                                    ? 'يمكنك حفظ تقدمك والعودة لاحقاً، أو إكمال الامتحان الآن.' 
                                    : 'هل تريد العودة للقائمة السابقة؟ سيتم إلغاء تقدمك الحالي.'}
                            </p>

                            <div className="flex flex-col gap-3 relative z-10">
                                <button 
                                    onClick={confirmLeaveQuiz} 
                                    className="w-full py-4 bg-red-500 text-white rounded-xl font-black shadow-lg shadow-red-200 border-b-4 border-red-700 active:scale-95 transition-transform"
                                >
                                    {currentView === View.Quiz ? 'حفظ التقدم والخروج' : 'نعم، الخروج الآن'}
                                </button>
                                <button 
                                    onClick={() => setShowBackConfirmation(false)} 
                                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 active:scale-95 transition-transform"
                                >
                                    {currentView === View.Quiz ? 'إكمال الاختبار' : 'البقاء هنا'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {showExitConfirmation && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-secondary/60 backdrop-blur-sm" 
                        dir="rtl"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xs rounded-xl p-8 shadow-2xl border-t-4 border-primary text-center border border-slate-900"
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-black text-text-main mb-2">تأكيد الخروج</h3>
                            <p className="text-text-sub font-bold text-sm mb-8">هل أنت متأكد أنك تريد الخروج من التطبيق؟</p>
                            <div className="space-y-3">
                                <button 
                                    onClick={confirmExitApp} 
                                    className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-black shadow-lg border border-slate-900"
                                >
                                    نعم، خروج
                                </button>
                                <button 
                                    onClick={() => setShowExitConfirmation(false)} 
                                    className="w-full py-4 bg-app-bg text-text-sub rounded-lg font-black border border-slate-900"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showLogoutConfirmation && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-secondary/60 backdrop-blur-sm" 
                        dir="rtl"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xs rounded-xl p-8 shadow-2xl border-t-4 border-red-500 border border-slate-900 text-center"
                        >
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <LogOut className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-text-main mb-2">تسجيل الخروج</h3>
                            <p className="text-text-sub font-bold text-sm mb-8">هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟</p>
                            <div className="space-y-3">
                                <button 
                                    onClick={confirmLogout} 
                                    className="w-full py-4 bg-red-500 text-white rounded-lg font-black shadow-lg border border-slate-900"
                                >
                                    نعم، تسجيل الخروج
                                </button>
                                <button 
                                    onClick={() => setShowLogoutConfirmation(false)} 
                                    className="w-full py-4 bg-app-bg text-text-sub rounded-lg font-black border border-slate-900"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showMultiBooksModal && <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-secondary/60 backdrop-blur-sm" dir="rtl"><div className="bg-white w-full max-w-xs rounded-xl p-8 shadow-2xl relative border-t-4 border-primary border border-slate-900"><button onClick={() => setShowMultiBooksModal(false)} className="absolute top-6 left-6 p-2 bg-app-bg rounded-full border border-slate-900"><XIcon className="w-5 h-5"/></button><h3 className="text-xl font-black text-text-main text-center mb-8 pt-2">اختر الكتاب</h3><div className="space-y-4">{selectedSubject?.multiBooks?.map((book, idx) => (<button key={idx} onClick={() => { window.open(book.url, '_blank'); setShowMultiBooksModal(false); }} className="w-full p-6 bg-app-bg border-2 border-slate-900 rounded-lg flex items-center gap-3 transition-all hover:bg-primary/5 group"><div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-900"><BookOpenIcon className="w-5 h-5 text-primary" /></div><span className="text-base font-black text-text-main">{book.label}</span></button>))}</div></div></div>}

            <AnimatePresence>
                {showResumeModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-secondary/60 backdrop-blur-sm" 
                        dir="rtl"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xs rounded-xl p-8 shadow-2xl border-t-4 border-yellow-500 border border-slate-900 text-center relative"
                        >
                            <button 
                                onClick={() => { setShowResumeModal(false); setPendingExamData(null); }}
                                className="absolute top-4 left-4 p-2 bg-app-bg rounded-full border border-slate-900 hover:bg-slate-100 transition-colors"
                            >
                                <XIcon className="w-4 h-4 text-text-sub" />
                            </button>
                            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <RefreshIcon className="w-10 h-10 text-yellow-500" />
                            </div>
                            <h3 className="text-xl font-black text-text-main mb-2">متابعة الامتحان؟</h3>
                            <p className="text-text-sub font-bold text-sm mb-8">لقد أجبت على ({pendingExamData?.progress?.currentQuestionIndex}) من ({pendingExamData?.progress?.totalQuestions}) سؤالاً. هل تريد المتابعة من حيث توقفت؟</p>
                            <div className="space-y-3">
                                <button 
                                    onClick={confirmResume} 
                                    className="w-full py-4 bg-yellow-500 text-white rounded-lg font-black shadow-lg border border-slate-900"
                                >
                                    استكمال الامتحان
                                </button>
                                <button 
                                    onClick={confirmRestart} 
                                    className="w-full py-4 bg-app-bg text-text-sub rounded-lg font-black border border-slate-900"
                                >
                                    بدء من جديد
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;