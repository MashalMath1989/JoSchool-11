import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, AlertCircle, LogOut } from 'lucide-react';
import { View, Subject, SubjectName, Question, Semester, UserProgress, QuizResult } from './types';
import { subjectsData, subjectIndexData } from './data';
import { getQuizzesForLesson, getLessonChunksCount, getQuizzesForUnit, isLessonLoaded } from './services/quizService';
import { updateDatabase, examsDatabase, loadFromCache, saveToCache, hasValidCache } from './data/examsDatabase';
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
import MoEResultsPage from './MoEResultsPage';
import AnnouncementsPage from './AnnouncementsPage';
import AuthPage from './AuthPage';
import SessionsListPage from './SessionsListPage';
import { LOGO_DATA_URI } from './logoDataUri';
import LibraryPage from './LibraryPage';
import WelcomePage from './WelcomePage';

// روابط امتحانات مادة تاريخ الأردن - الفصل الأول
const HISTORY_U1_EXAMS = [
    { title: "الدرس الأول: الأردن في العصور الحجرية – صفحة 8", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit1_L1.json" },
    { title: "الدرس الثاني: الأردن في العصر الحديدي – صفحة 16", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit1_L2.json" },
    { title: "الدرس الثالث: مملكة الأنباط – صفحة 21", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit1_L3.json" },
    { title: "الدرس الرابع: مظاهر الحضارتين اليونانية والرومانية–البيزنطية في الأردن – صفحة 29", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit1_L4.json" }
];

const HISTORY_U2_EXAMS = [
    { title: "الدرس الأول: الأردن في صدر الإسلام – صفحة 44", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit2_L1.json" },
    { title: "الدرس الثاني: الأردن في العصرين الأموي والعباسي – صفحة 53", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit2_L2.json" },
    { title: "الدرس الثالث: الأردن خلال حملات الفرنجة – صفحة 62", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit2_L3.json" },
    { title: "الدرس الرابع: الأردن في العصر الأيوبي – صفحة 68", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit2_L4.json" },
    { title: "الدرس الخامس: الأردن في العصر المملوكي – صفحة 73", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit2_L5.json" }
];

const HISTORY_U3_EXAMS = [
    { title: "الدرس الأول: الأوضاع السياسية والإدارية في الأردن في العهد العثماني – صفحة 82", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit3_L1.json" },
    { title: "الدرس الثاني: الأوضاع الاجتماعية والاقتصادية في الأردن في العهد العثماني – صفحة 88", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit3_L2.json" },
    { title: "الدرس الثالث: الثورة العربية الكبرى (النهضة العربية) – صفحة 98", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit3_L3.json" },
    { title: "الدرس الرابع: الأردن في عهد المملكة العربية السورية والحكومات المحلية – صفحة 111", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/History11_s1_unit3_L4.json" }
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
    { title: "الدرس الأول: سورة آل عمران، الآيات الكريمة (١٠٢–١٠٥) – صفحة 6", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit1_L1.json" },
    { title: "الدرس الثاني: الحديث الشريف: اتقاء الشُّبُهات – صفحة 12", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit1_L2.json" },
    { title: "الدرس الثالث: من صور الضلال – صفحة 20", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit1_L3.json" },
    { title: "الدرس الرابع: كرامة الإنسان في الشريعة الإسلامية – صفحة 26", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit1_L4.json" },
    { title: "الدرس الخامس: الزواج: مشروعيته، ومُقَدِّماته – صفحة 31", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit1_L5.json" },
    { title: "الدرس السادس: الجهاد في الإسلام – صفحة 37", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit1_L6.json" }
];
const ISLAMIC_U2_EXAMS = [
    { title: "الدرس الأول: جهود علماء المسلمين في خدمة القرآن الكريم – صفحة 44", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit2_L1.json" },
    { title: "الدرس الثاني: العزيمة والرخصة – صفحة 50", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit2_L2.json" },
    { title: "الدرس الثالث: معركة مؤتة (8 هـ) – صفحة 55", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit2_L3.json" },
    { title: "الدرس الرابع: المحرّمات من النساء – صفحة 60", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit2_L4.json" },
    { title: "الدرس الخامس: التعايش الإنساني – صفحة 66", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit2_L5.json" },
    { title: "الدرس السادس: الحقوق المالية للمرأة في الإسلام – صفحة 72", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit2_L6.json" }
];
const ISLAMIC_U3_EXAMS = [
    { title: "الدرس الأول: سورة آل عمران، الآيات الكريمة (١٦٩–١٧٤) – صفحة 77", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit3_L1.json" },
    { title: "الدرس الثاني: الحديث الشريف: رضا الله تعالى – صفحة 83", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit3_L2.json" },
    { title: "الدرس الثالث: فتح مكة (8 هـ) – صفحة 89", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit3_L3.json" },
    { title: "الدرس الرابع: من خصائص الشريعة الإسلامية: الإيجابية – صفحة 95", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit3_L4.json" },
    { title: "الدرس الخامس: شروط صِحَّة عَقْدِ الزواج – صفحة 100", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit3_L5.json" },
    { title: "الدرس السادس: الحقوق الاجتماعية للمرأة في الإسلام – صفحة 105", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit3_L6.json" }
];
const ISLAMIC_U4_EXAMS = [
    { title: "الدرس الأول: سورة الروم، الآيات الكريمة (٢١–٢٤) – صفحة 112", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit4_L1.json" },
    { title: "الدرس الثاني: مكانة السنة النبوية الشريفة في التشريع الإسلامي – صفحة 117", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit4_L2.json" },
    { title: "الدرس الثالث: مراعاة الأعراف في الشريعة الإسلامية – صفحة 124", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit4_L3.json" },
    { title: "الدرس الرابع: حقوق الزوجين في الإسلام – صفحة 130", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit4_L4.json" },
    { title: "الدرس الخامس: تنظيم النسل وتحديده – صفحة 137", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit4_L5.json" },
    { title: "الدرس السادس: الأمن الغذائي في الإسلام – صفحة 141", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit4_L6.json" },
    { title: "الدرس السابع: الإسلام والوحدة الوطنية – صفحة 146", url: "https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Islamic11_s1_unit4_L7.json" }
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

// روابط امتحانات اللغة العربية (الفصل الأول - الوحدات الأولى والثانية والثالثة والرابعة والخامسة)
const generateArabicExams = () => {
    const unit1Exams: { title: string, url: string }[] = [];
    for (let i = 1; i <= 10; i++) {
        unit1Exams.push({
            title: `الوحدة الأولى - امتحان ${i}`,
            url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Arabic11_s1_unit1_exam${i}.json`
        });
    }
    const unit2Exams: { title: string, url: string }[] = [];
    for (let i = 1; i <= 10; i++) {
        unit2Exams.push({
            title: `الوحدة الثانية - امتحان ${i}`,
            url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Arabic11_s1_unit2_exam${i}.json`
        });
    }
    const unit3Exams: { title: string, url: string }[] = [];
    for (let i = 1; i <= 10; i++) {
        unit3Exams.push({
            title: `الوحدة الثالثة - امتحان ${i}`,
            url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Arabic11_s1_unit3_exam${i}.json`
        });
    }
    const unit4Exams: { title: string, url: string }[] = [];
    for (let i = 1; i <= 10; i++) {
        unit4Exams.push({
            title: `الوحدة الرابعة - امتحان ${i}`,
            url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Arabic11_s1_unit4_exam${i}.json`
        });
    }
    const unit5Exams: { title: string, url: string }[] = [];
    for (let i = 1; i <= 10; i++) {
        unit5Exams.push({
            title: `الوحدة الخامسة - امتحان ${i}`,
            url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Arabic11_s1_unit5_exam${i}.json`
        });
    }
    return [...unit1Exams, ...unit2Exams, ...unit3Exams, ...unit4Exams, ...unit5Exams];
};

const ARABIC_EXAMS = generateArabicExams();
const ARABIC_UNIT_LABELS = ["الوحدة الأولى", "الوحدة الثانية", "الوحدة الثالثة", "الوحدة الرابعة", "الوحدة الخامسة"];
const ARABIC_UNIT_COUNTS = [12, 12, 13, 13, 14];

const getMathLessonTitle = (semester: Semester, unitNum: number, lessonNum: number): string | undefined => {
    if (typeof subjectIndexData === 'undefined' || !subjectIndexData) return undefined;
    const semesterKey = `${SubjectName.Math}-${semester}`;
    const units = subjectIndexData[semesterKey] || subjectIndexData[SubjectName.Math] || [];
    const uIdx = semester === Semester.First ? (unitNum - 1) : (unitNum - 5);
    const unit = units[uIdx];
    if (unit && unit.lessons) {
        const lesson = unit.lessons[lessonNum - 1];
        if (lesson) {
            return lesson.title;
        }
    }
    return undefined;
};

// توليد روابط امتحانات مادة الرياضيات - الفصل الأول
const generateMathS1Exams = () => {
    const allExams: { title: string, url: string, chunkIndex: number }[] = [];
    
    // الدرس الأول
    const lesson1Title = getMathLessonTitle(Semester.First, 1, 1);
    if (lesson1Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: lesson1Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L1_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الدرس الثاني
    const lesson2Title = getMathLessonTitle(Semester.First, 1, 2);
    if (lesson2Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: lesson2Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L2_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الدرس الثالث
    const lesson3Title = getMathLessonTitle(Semester.First, 1, 3);
    if (lesson3Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: lesson3Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L3_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الدرس الرابع
    const lesson4Title = getMathLessonTitle(Semester.First, 1, 4);
    if (lesson4Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: lesson4Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L4_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثانية - الدرس الأول
    const u2Lesson1Title = getMathLessonTitle(Semester.First, 2, 1);
    if (u2Lesson1Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u2Lesson1Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L1_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثانية - الدرس الثاني
    const u2Lesson2Title = getMathLessonTitle(Semester.First, 2, 2);
    if (u2Lesson2Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u2Lesson2Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L2_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثانية - الدرس الثالث
    const u2Lesson3Title = getMathLessonTitle(Semester.First, 2, 3);
    if (u2Lesson3Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u2Lesson3Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L3_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثالثة - الدرس الأول
    const u3Lesson1Title = getMathLessonTitle(Semester.First, 3, 1);
    if (u3Lesson1Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u3Lesson1Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L1_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثالثة - الدرس الثاني
    const u3Lesson2Title = getMathLessonTitle(Semester.First, 3, 2);
    if (u3Lesson2Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u3Lesson2Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L2_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثالثة - الدرس الثالث
    const u3Lesson3Title = getMathLessonTitle(Semester.First, 3, 3);
    if (u3Lesson3Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u3Lesson3Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L3_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثالثة - الدرس الرابع
    const u3Lesson4Title = getMathLessonTitle(Semester.First, 3, 4);
    if (u3Lesson4Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u3Lesson4Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L4_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثالثة - الدرس الخامس
    const u3Lesson5Title = getMathLessonTitle(Semester.First, 3, 5);
    if (u3Lesson5Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u3Lesson5Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L5_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }

    // الوحدة الثالثة - الدرس السادس
    const u3Lesson6Title = getMathLessonTitle(Semester.First, 3, 6);
    if (u3Lesson6Title) {
        for (let i = 1; i <= 10; i++) {
            allExams.push({
                title: u3Lesson6Title,
                url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L6_E${i}.json`,
                chunkIndex: i - 1
            });
        }
    }
    
    return allExams;
};

// توليد روابط امتحانات مادة الرياضيات - الفصل الثاني
const generateMathS2Exams = () => {
    const config = [
        { unit: 5, lessons: [ { index: 1, exams: 7 }, { index: 2, exams: 7 }, { index: 3, exams: 7 }, { index: 4, exams: 7 }, { index: 5, exams: 7 }, { index: 6, exams: 7 } ] },
        { unit: 6, lessons: [ { index: 1, exams: 7 }, { index: 2, exams: 7 }, { index: 3, exams: 7 } ] },
        { unit: 7, lessons: [ { index: 1, exams: 7 }, { index: 2, exams: 7 } ] },
    ];
    const allExams: { title: string, url: string, chunkIndex: number }[] = [];
    config.forEach(u => {
        u.lessons.forEach(l => {
            const lessonTitle = getMathLessonTitle(Semester.Second, u.unit, l.index);
            if (lessonTitle) {
                for (let i = 1; i <= l.exams; i++) {
                    allExams.push({
                        title: lessonTitle,
                        url: `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math_s2_unit${u.unit}_L${l.index}_exam${i}.json`,
                        chunkIndex: i - 1
                    });
                }
            }
        });
    });
    return allExams;
};

const MATH_S1_EXAMS = generateMathS1Exams();
const MATH_S2_EXAMS = generateMathS2Exams();

// Helper function to safely escape invalid backslashes inside JSON strings (e.g. \implies, \sqrt, \cdot)
const fixUnescapedBackslashesInJson = (jsonString: string): string => {
    let result = '';
    let inString = false;
    let i = 0;
    while (i < jsonString.length) {
        const char = jsonString[i];
        if (!inString) {
            if (char === '"') {
                inString = true;
            }
            result += char;
            i++;
        } else {
            if (char === '"') {
                inString = false;
                result += char;
                i++;
            } else if (char === '\\') {
                const nextChar = jsonString[i + 1];
                if (nextChar === '"' || nextChar === '\\' || nextChar === '/' ||
                    nextChar === 'b' || nextChar === 'f' || nextChar === 'n' ||
                    nextChar === 'r' || nextChar === 't') {
                    // Valid 2-char escape sequence
                    result += '\\' + nextChar;
                    i += 2;
                } else if (nextChar === 'u' && /^[0-9a-fA-F]{4}$/.test(jsonString.substring(i + 2, i + 6))) {
                    // Valid \uXXXX unicode escape sequence
                    result += jsonString.substring(i, i + 6);
                    i += 6;
                } else {
                    // Invalid escape sequence like \i (\implies), \s (\sqrt), \c (\cdot), \d (\delta), \l (\left), \a (\alpha), \p (\pi), etc.
                    // Replace single \ with \\
                    result += '\\\\';
                    i++;
                }
            } else {
                result += char;
                i++;
            }
        }
    }
    return result;
};

// Helper function to clean and parse JSON that might contain BOM or non-breaking spaces
const cleanAndParseJson = (text: string) => {
    let cleanedText = text.replace(/^\uFEFF/, '').trim();
    
    // Fix illegal trailing dots outside double quotes (e.g., ". instead of .")
    cleanedText = cleanedText.replace(/"\s*\./g, '"');

    // Fix missing commas between properties in objects (e.g. source_text and correct_answer)
    cleanedText = cleanedText.replace(/("source_text"\s*:\s*"[^"]+")\s*\n\s*("correct_answer")/g, '$1,\n$2');

    // Fix malformed Arabic punctuation in choices lists (specifically in Unit 2 Lesson 6)
    cleanedText = cleanedText.replace(/"مباحاً إذا كان الزوج فقيراً"[^\n]*/g, '"مباحاً إذا كان الزوج فقيراً",');

    // Fix unescaped LaTeX backslashes inside JSON string literals
    cleanedText = fixUnescapedBackslashesInJson(cleanedText);

    // Clean bad unescaped control characters inside string literals (ASCII 0-31)
    cleanedText = cleanedText.replace(/"(\\.|[^"\\])*"/g, (match) => {
        // eslint-disable-next-line no-control-regex
        return match.replace(new RegExp("[\\x00-\\x1F]", "g"), (char) => {
            if (char === '\n') return '\\n';
            if (char === '\r') return '\\r';
            if (char === '\t') return '\\t';
            return '';
        });
    });

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
        let questions: any[] | null = null;
        if (Array.isArray(data)) {
            questions = data;
        } else if (data.questions && Array.isArray(data.questions)) {
            questions = data.questions;
        } else if (data.exam && Array.isArray(data.exam)) {
            questions = data.exam;
        } else {
            const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
            if (arrayKey) {
                questions = data[arrayKey];
            }
        }
        
        if (questions && Array.isArray(questions)) {
            questions.forEach((q: any) => {
                if (q && q.options && !q.choices) {
                    q.choices = q.options.map((opt: any) => opt.label);
                }
            });
            return questions;
        }
        return null;
    } catch (e) {
        if (!cleanedText.includes('404')) {
            throw e;
        }
        return null;
    }
};

// Helper to safely write to localStorage with self-healing on QuotaExceededError
const safeLocalStorageSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        console.warn(`[JoSchool] LocalStorage setItem failed for key "${key}":`, e);
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.warn("[JoSchool] Storage quota exceeded! Initiating self-healing cache cleanup...");
            try {
                // Remove non-critical cached exam questions to free up valuable space
                localStorage.removeItem('joschool_exams_cache');
                localStorage.removeItem('joschool_exams_urls_cache');
                console.log("[JoSchool] Cleared large exam caches from localStorage.");
                
                // Retry saving the critical user data
                localStorage.setItem(key, value);
                console.log("[JoSchool] Successfully saved critical state after self-healing.");
            } catch (retryError) {
                console.error("[JoSchool] Failed to save critical state even after clearing cache:", retryError);
            }
        }
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

    const [viewHistory, setViewHistory] = useState<View[]>(() => {
        try {
            const hasSeen = localStorage.getItem('joschool_has_seen_welcome') === 'true';
            return hasSeen ? [View.Landing] : [View.Welcome];
        } catch {
            return [View.Welcome];
        }
    });
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [sessionTitle, setSessionTitle] = useState<string>('');
    const [noticeModal, setNoticeModal] = useState<{
        show: boolean;
        title?: string;
        message: string;
        imageUrl?: string;
    } | null>(null);

    const showNotice = useCallback((message: string, title: string = 'تنبيه', imageUrl?: string) => {
        setNoticeModal({
            show: true,
            title,
            message,
            imageUrl: imageUrl || 'https://i.postimg.cc/XvYQrc5C/FB-IMG-1780984890803.jpg'
        });
    }, []);
    
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
        lastActive: new Date().toISOString(),
        lastActiveDate: new Date().toLocaleDateString('en-CA'),
        studentProfile: {
            name: '',
            seatNumber: '',
            email: '',
            age: '',
            gender: '',
            phoneNumber: ''
        }
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
            setUser(prevUser => {
                const prevUid = prevUser?.uid;
                const newUid = currentUser?.uid;

                // Only act if user identity changed or it's first load
                if (prevUid !== newUid || isAuthenticating) {
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
                        const loadedQuiz = state.currentQuiz || [];
                        if (state.currentQuiz) setCurrentQuiz(loadedQuiz);
                        if (state.currentQuestionIndex !== undefined) {
                            const validIdx = (loadedQuiz.length > 0 && typeof state.currentQuestionIndex === 'number' && state.currentQuestionIndex >= 0 && state.currentQuestionIndex < loadedQuiz.length)
                                ? state.currentQuestionIndex
                                : 0;
                            setCurrentQuestionIndex(validIdx);
                        }
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
                        const hasSeen = localStorage.getItem(getStorageKey('has_seen_welcome', newUid)) === 'true';
                        setViewHistory(hasSeen ? [View.Landing] : [View.Welcome]);
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
                return currentUser;
            });
        });
        return () => unsubscribe();
    }, [getStorageKey, loadStateForUser, getDefaultProgress, isAuthenticating]); // Removed user from deps but kept isAuthenticating

    useEffect(() => {
        const key = getStorageKey('user_progress', user?.uid);
        safeLocalStorageSetItem(key, JSON.stringify(userProgress));
        
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

    const lastActiveDate = userProgress?.lastActiveDate;

    // Track active date
    useEffect(() => {
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local format
        if (lastActiveDate !== todayStr) {
            setUserProgress(prev => ({
                ...prev,
                lastActiveDate: todayStr,
                lastActive: new Date().toISOString()
            }));
        }
    }, [lastActiveDate, setUserProgress]);

    const [isDbLoaded, setIsDbLoaded] = useState(true);
    const [examsUpdatedTrigger, setExamsUpdatedTrigger] = useState(0);
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
    // Debounced to avoid heavy writes on every timer tick
    useEffect(() => {
        if (!user && isAuthenticating) return; // Wait for initial auth attempt
        
        const saveState = () => {
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
            safeLocalStorageSetItem(key, JSON.stringify(appState));
        };

        const timeout = setTimeout(saveState, timer > 0 ? 2000 : 500); // Save less frequently during active exams
        return () => clearTimeout(timeout);
    }, [user, isAuthenticating, getStorageKey, viewHistory, selectedSubject, sessionTitle, currentQuiz, currentQuestionIndex, userAnswers, showResults, currentLessonTitle, currentUnitTitle, examNumber, timer, expandedUnitIndices, expandedLessonKeys, currentPdfUrl, pdfTitle]);

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
    }, [viewHistory]);

    // Rehydrate browser history when loading state from localStorage
    // Only run when isAuthenticating becomes false (initial load)
    const hasRehydratedRef = useRef(false);
    useEffect(() => {
        if (!isAuthenticating && viewHistory.length > 1 && !hasRehydratedRef.current) {
            hasRehydratedRef.current = true;
            console.log("Initial history rehydration...");
            window.history.replaceState({ view: viewHistory[0], historyIndex: 0 }, '');
            for (let i = 1; i < viewHistory.length; i++) {
                window.history.pushState({ view: viewHistory[i], historyIndex: i }, '');
            }
        }
    }, [isAuthenticating, viewHistory]);

    const fetchExams = useCallback(async () => {
        setIsBackgroundFetching(true);
        const examSets = [
            { subject: SubjectName.JordanHistory, exams: [...HISTORY_U1_EXAMS, ...HISTORY_U2_EXAMS, ...HISTORY_U3_EXAMS] },
            { subject: SubjectName.IslamicEducation, exams: [...ISLAMIC_U1_EXAMS, ...ISLAMIC_U2_EXAMS, ...ISLAMIC_U3_EXAMS, ...ISLAMIC_U4_EXAMS] },
            { subject: SubjectName.Arabic, exams: ARABIC_EXAMS.slice(0, 30) }, // First 30 Arabic exams first
            { subject: SubjectName.Math, exams: MATH_S1_EXAMS },
            { subject: "SESSION_2008", exams: SESSION_2008_EXAMS },
            { subject: "SESSION_2008_SUP", exams: SESSION_2008_SUP_EXAMS },
            // Remaining exams
            { subject: SubjectName.JordanHistory, exams: [...HISTORY_S2_U4_EXAMS, ...HISTORY_S2_U5_EXAMS, ...HISTORY_S2_U6_EXAMS, ...HISTORY_S2_U7_EXAMS, ...HISTORY_S2_U8_EXAMS] },
            { subject: SubjectName.IslamicEducation, exams: [...ISLAMIC_S2_U1_EXAMS, ...ISLAMIC_S2_U2_EXAMS, ...ISLAMIC_S2_U3_EXAMS, ...ISLAMIC_S2_U4_EXAMS] },
            { subject: SubjectName.Arabic, exams: ARABIC_EXAMS.slice(30) },
            { subject: SubjectName.Math, exams: MATH_S2_EXAMS }
        ];

        for (const set of examSets) {
            // Processing in larger parallel batches for JSON files (very small size)
            const batchSize = 6; 
            for (let i = 0; i < set.exams.length; i += batchSize) {
                const batch = set.exams.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (item) => {
                    if (!item.url) return;
                    
                    const subjectKey = (set.subject as any === "SESSION_2008" || set.subject as any === "SESSION_2008_SUP") 
                        ? (item as any).subject 
                        : set.subject;
                    
                    const chunkIdx = (item as any).chunkIndex;
                    
                    // Skip if already in database or if we are already fetching it
                    if (hasValidCache(subjectKey as SubjectName, item.title, item.url, chunkIdx)) return;
                    
                    try {
                        const res = await fetch(`${item.url}${item.url.includes('?') ? '&' : '?'}bv=1`, {
                            cache: 'force-cache'
                        });
                        
                        if (!res.ok) return;
                        const text = await res.text();
                        if (!text) return;
                        
                        try {
                            const questions = cleanAndParseJson(text);
                            if (questions && questions.length > 0) {
                                updateDatabase(subjectKey as SubjectName, item.title, questions, item.url, chunkIdx);
                                setExamsUpdatedTrigger(prev => prev + 1);
                            }
                        } catch (parseError) {
                            // Silently ignore
                        }
                    } catch (e: any) {
                        // Silently ignore network errors in background
                    }
                }));

                // Save to cache after each set of batches to keep progress
                if (i % (batchSize * 2) === 0) {
                    saveToCache();
                }
                
                // Very small delay to keep UI responsive
                await new Promise(resolve => setTimeout(resolve, 30));
            }
        }

        saveToCache();
        setIsBackgroundFetching(false);
    }, []);

    useEffect(() => {
        // Load database from cache on startup
        loadFromCache();
        
        // Initial setup for browser history to handle back button on Landing page
        if (!window.history.state || !window.history.state.view) {
            window.history.replaceState({ view: View.Landing, historyIndex: 0 }, '');
        }

        // Start background data fetch with a small delay to prioritize app startup
        const timeout = setTimeout(() => {
            fetchExams();
        }, 1500);
        
        return () => clearTimeout(timeout);
    }, [fetchExams]);

    const getExamsForSubject = useCallback((subject: SubjectName) => {
        switch (subject) {
            case SubjectName.JordanHistory: return [...HISTORY_U1_EXAMS, ...HISTORY_U2_EXAMS, ...HISTORY_U3_EXAMS, ...HISTORY_S2_U4_EXAMS, ...HISTORY_S2_U5_EXAMS, ...HISTORY_S2_U6_EXAMS, ...HISTORY_S2_U7_EXAMS, ...HISTORY_S2_U8_EXAMS];
            case SubjectName.IslamicEducation: return [...ISLAMIC_U1_EXAMS, ...ISLAMIC_U2_EXAMS, ...ISLAMIC_U3_EXAMS, ...ISLAMIC_U4_EXAMS, ...ISLAMIC_S2_U1_EXAMS, ...ISLAMIC_S2_U2_EXAMS, ...ISLAMIC_S2_U3_EXAMS, ...ISLAMIC_S2_U4_EXAMS];
            case SubjectName.Arabic: return ARABIC_EXAMS;
            case SubjectName.Math: return [...MATH_S1_EXAMS, ...MATH_S2_EXAMS];
            default: return [];
        }
    }, []);

    // مراقبة تغيير المادة المختارة لتسريع تحميل اختباراتها إذا لم تكن محملة
    useEffect(() => {
        let isCancelled = false;

        if (selectedSubject) {
            const subjectExams = getExamsForSubject(selectedSubject.id as SubjectName);
            
            const fetchSelectedSubjectExams = async () => {
                // Determine which ones are missing
                const missing = subjectExams.filter(item => 
                    !hasValidCache(selectedSubject.id as SubjectName, item.title, item.url, (item as any).chunkIndex) && item.url
                );

                if (missing.length === 0) return;

                // Priority fetching in small batches
                const batchSize = 4;
                for (let i = 0; i < missing.length; i += batchSize) {
                    if (isCancelled) break;
                    const batch = missing.slice(i, i + batchSize);

                    await Promise.all(batch.map(async (item) => {
                        try {
                            const res = await fetch(`${item.url}${item.url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
                                cache: 'no-store'
                            });
                            
                            if (isCancelled) return;
                            if (!res.ok) return;
                            
                            const text = await res.text();
                            if (!text) return;
                            
                            const questions = cleanAndParseJson(text);
                            if (questions && questions.length > 0) {
                                updateDatabase(selectedSubject.id as SubjectName, item.title, questions, item.url, (item as any).chunkIndex);
                                setExamsUpdatedTrigger(prev => prev + 1);
                            }
                        } catch (err: any) {
                            // Ignore errors in background
                        }
                    }));

                    // Save periodically
                    saveToCache();
                    
                    if (!isCancelled) await new Promise(resolve => setTimeout(resolve, 100));
                }
            };
            
            fetchSelectedSubjectExams();
        }

        return () => {
            isCancelled = true;
        };
    }, [selectedSubject, getExamsForSubject]);

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
                // If we already navigated back synchronously, do nothing here to keep it instant
                return;
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
            // Set flag to bypass confirmation in popstate
            isNavigatingBackRef.current = true;
            
            // Instantly transition view history for ultimate snappiness
            setViewHistory(prev => prev.length > 1 ? prev.slice(0, -1) : [View.Landing]);
            
            try {
                window.history.back();
            } catch (e) {
                console.warn("History back failed", e);
            }
        }
    }, [currentView, showResults, setViewHistory, setShowBackConfirmation, setShowExitConfirmation]);

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
        
        // Instantly transition view history for ultimate snappiness
        setViewHistory(prev => prev.length > 1 ? prev.slice(0, -1) : [View.Landing]);
        
        // Use browser back to trigger the clean history movement
        // This will be caught by popstate which will perform the view transition
        try {
            window.history.back();
        } catch (e) {
            console.warn("History back failed", e);
        }
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

    const toggleLesson = async (key: string) => {
        const isExpanding = !expandedLessonKeys.includes(key);
        setExpandedLessonKeys(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
        
        if (isExpanding && selectedSubject) {
            // Extract lesson title from the key (format: `${uIdx}_${lesson.title}`)
            const underscoreIdx = key.indexOf('_');
            if (underscoreIdx !== -1) {
                const lessonTitle = key.substring(underscoreIdx + 1);
                const subjectId = selectedSubject.id as SubjectName;
                
                if (subjectId === SubjectName.Math) {
                    const uIdx = parseInt(key.substring(0, underscoreIdx));
                    const semesterKey = `${selectedSubject.id}-${selectedSubject.semester}`;
                    const units = subjectIndexData[semesterKey] || subjectIndexData[selectedSubject.id] || [];
                    const unit = units[uIdx];
                    if (unit) {
                        const lIdx = unit.lessons.findIndex(l => l.title === lessonTitle);
                        if (lIdx !== -1) {
                            const unitNum = selectedSubject.semester === Semester.First ? (uIdx + 1) : (uIdx + 5);
                            const lessonNum = lIdx + 1;
                            const semPrefix = selectedSubject.semester === Semester.First ? 's1' : 's2';
                            
                            const examsCount = (selectedSubject.semester === Semester.First && ((unitNum === 1 && (lessonNum === 1 || lessonNum === 2 || lessonNum === 3 || lessonNum === 4)) || (unitNum === 2 && (lessonNum === 1 || lessonNum === 2 || lessonNum === 3)) || (unitNum === 3 && (lessonNum === 1 || lessonNum === 2 || lessonNum === 3 || lessonNum === 4 || lessonNum === 5 || lessonNum === 6)))) ? 10 : 7;
                            const examsToFetch = Array.from({ length: examsCount }, (_, i) => i + 1);
                            await Promise.all(examsToFetch.map(async (examNum) => {
                                const url = (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 1)
                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L1_E${examNum}.json`
                                    : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 2)
                                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L2_E${examNum}.json`
                                        : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 3)
                                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L3_E${examNum}.json`
                                            : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 4)
                                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L4_E${examNum}.json`
                                                : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 1)
                                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L1_E${examNum}.json`
                                                    : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 2)
                                                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L2_E${examNum}.json`
                                                        : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 3)
                                                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L3_E${examNum}.json`
                                                            : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 1)
                                                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L1_E${examNum}.json`
                                                                : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 2)
                                                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L2_E${examNum}.json`
                                                                    : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 3)
                                                                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L3_E${examNum}.json`
                                                                        : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 4)
                                                                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L4_E${examNum}.json`
                                                                            : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 5)
                                                                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L5_E${examNum}.json`
                                                                                : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 6)
                                                                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L6_E${examNum}.json`
                                                                                    : `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math_${semPrefix}_unit${unitNum}_L${lessonNum}_exam${examNum}.json`;
                                if (hasValidCache(subjectId, lessonTitle, url, examNum - 1)) return;
                                try {
                                    const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
                                    if (res.ok) {
                                        const text = await res.text();
                                        const questions = cleanAndParseJson(text);
                                        if (questions && questions.length > 0) {
                                            updateDatabase(subjectId, lessonTitle, questions, url, examNum - 1);
                                        }
                                    }
                                } catch (e) {
                                    console.warn(`Failed to fetch Math exam ${examNum} for ${lessonTitle}`, e);
                                }
                            }));
                            saveToCache();
                            setExamsUpdatedTrigger(prev => prev + 1);
                        }
                    }
                } else {
                    const subjectExams = getExamsForSubject(subjectId);
                    const examConfig = subjectExams.find(e => e.title === lessonTitle);
                    
                    if (examConfig && examConfig.url) {
                        try {
                            const res = await fetch(`${examConfig.url}${examConfig.url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
                                cache: 'no-store'
                            });
                            if (res.ok) {
                                const text = await res.text();
                                const fetchedQuestions = cleanAndParseJson(text);
                                if (fetchedQuestions && fetchedQuestions.length > 0) {
                                    updateDatabase(subjectId, lessonTitle, fetchedQuestions, examConfig.url);
                                    saveToCache();
                                    setExamsUpdatedTrigger(prev => prev + 1);
                                }
                            }
                        } catch (err) {
                            console.warn("Failed on-demand fetch for expanded lesson", err);
                        }
                    }
                }
            }
        }
    };

    const openExternalBook = () => {
        if (!selectedSubject) return;
        if (selectedSubject.semester === Semester.Second || (!selectedSubject.textbookUrl && !selectedSubject.multiBooks)) {
            showNotice(
                'عندما تقوم وزارة التربية والتعليم بإصدار نسخة الفصل الثاني لعام 2026/2027 سيتم عرض أحدث نسخة هنا',
                'تنبيه',
                'https://i.postimg.cc/XvYQrc5C/FB-IMG-1780984890803.jpg'
            );
            return;
        }
        if (selectedSubject.multiBooks) {
            setShowMultiBooksModal(true);
        } else if (selectedSubject.textbookUrl) {
            window.open(selectedSubject.textbookUrl, '_blank');
        }
    };

    const getMathUrl = (lesson: any, chunkIndex: number, unitTitle?: string) => {
        if (!selectedSubject) return null;
        const semesterKey = `${selectedSubject.id}-${selectedSubject.semester}`;
        const units = subjectIndexData[semesterKey] || subjectIndexData[selectedSubject.id] || [];
        const uIdx = units.findIndex(u => u.title === unitTitle);
        if (uIdx === -1) return null;
        const unit = units[uIdx];
        const lIdx = unit.lessons.findIndex((l: any) => l.title === lesson.title);
        if (lIdx === -1) return null;
        const unitNum = selectedSubject.semester === Semester.First ? (uIdx + 1) : (uIdx + 5);
        const lessonNum = lIdx + 1;
        const semPrefix = selectedSubject.semester === Semester.First ? 's1' : 's2';
        const examNum = chunkIndex + 1;
        return (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 1)
            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L1_E${examNum}.json`
            : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 2)
                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L2_E${examNum}.json`
                : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 3)
                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L3_E${examNum}.json`
                    : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 4)
                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L4_E${examNum}.json`
                        : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 1)
                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L1_E${examNum}.json`
                            : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 2)
                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L2_E${examNum}.json`
                                : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 3)
                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L3_E${examNum}.json`
                                    : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 1)
                                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L1_E${examNum}.json`
                                        : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 2)
                                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L2_E${examNum}.json`
                                            : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 3)
                                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L3_E${examNum}.json`
                                                : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 4)
                                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L4_E${examNum}.json`
                                                    : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 5)
                                                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L5_E${examNum}.json`
                                                        : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 6)
                                                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L6_E${examNum}.json`
                                                            : `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math_${semPrefix}_unit${unitNum}_L${lessonNum}_exam${examNum}.json`;
    };

    const startQuiz = async (lesson: any, chunkIndex?: number, unitTitle?: string, resumeProgress?: ExamProgress) => {
        const subjectId = selectedSubject?.id as SubjectName;
        const isEnglish = selectedSubject?.id === SubjectName.English;
        const examNum = (chunkIndex || 0) + 1;
        const examLabel = isEnglish ? `Exam (${examNum})` : `امتحان (${examNum})`;
        const fullLessonTitle = `${lesson.title} - ${examLabel}`;

        const launchQuizWithQuestions = (questions: Question[]) => {
            setCurrentLessonTitle(fullLessonTitle);
            setCurrentUnitTitle(unitTitle || '');
            setExamNumber(examNum);
            setCurrentQuiz([...questions]);
            
            const secondsPerQuestion = selectedSubject?.id === SubjectName.Math ? 240 : 60;
            if (resumeProgress && resumeProgress.lessonTitle === fullLessonTitle) {
                const validIdx = (typeof resumeProgress.currentQuestionIndex === 'number' && resumeProgress.currentQuestionIndex >= 0 && resumeProgress.currentQuestionIndex < questions.length)
                    ? resumeProgress.currentQuestionIndex
                    : 0;
                setCurrentQuestionIndex(validIdx);
                setUserAnswers(resumeProgress.userAnswers || new Array(questions.length).fill(null));
                setTimer((resumeProgress.totalQuestions - validIdx) * secondsPerQuestion); 
            } else {
                setCurrentQuestionIndex(0);
                setUserAnswers(new Array(questions.length).fill(null));
                setTimer(questions.length * secondsPerQuestion);
            }
            
            setShowResults(false);
            navigateTo(View.Quiz);
        };

        // Always fetch the latest version of the exam from GitHub on start
        setIsLoadingExam(true);
        let freshQuestions: Question[] | null = null;
        try {
            let targetUrl = lesson.url;
            if (subjectId === SubjectName.Math && chunkIndex !== undefined) {
                targetUrl = getMathUrl(lesson, chunkIndex, unitTitle) || targetUrl;
            } else if (!targetUrl) {
                const subjectExams = getExamsForSubject(subjectId);
                const examConfig = subjectExams.find(e => e.title === lesson.title);
                targetUrl = examConfig?.url;
            }

            if (targetUrl) {
                const res = await fetch(`${targetUrl}${targetUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const text = await res.text();
                    const fetchedQuestions = cleanAndParseJson(text);
                    if (fetchedQuestions && fetchedQuestions.length > 0) {
                        updateDatabase(subjectId, lesson.title, fetchedQuestions, targetUrl, chunkIndex);
                        saveToCache();
                        setExamsUpdatedTrigger(prev => prev + 1);
                        freshQuestions = fetchedQuestions;
                    }
                }
            }
        } catch (e) {
            console.warn("[JoSchool DB] Failed to fetch fresh exam from GitHub, falling back to cached questions.", e);
        } finally {
            setIsLoadingExam(false);
        }

        const questionsToUse = freshQuestions || getQuizzesForLesson(subjectId, lesson.title, chunkIndex);
        if (!questionsToUse || questionsToUse.length === 0) {
            alert('تعذر تحميل أسئلة الامتحان. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
            return;
        }

        launchQuizWithQuestions(questionsToUse);
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
        
        const subjectId = selectedSubject.id as SubjectName;
        const unitOrdinal = unit.title.split(':')[0];
        const isEnglish = selectedSubject?.id === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
        const fullLessonTitle = `${unitOrdinal} - ${examLabel}`;

        const launchUnitExamWithQuestions = (questions: Question[]) => {
            setCurrentLessonTitle(fullLessonTitle);
            setCurrentUnitTitle(unit.title);
            setExamNumber(1);
            setCurrentQuiz(questions);
            
            const secondsPerQuestion = selectedSubject?.id === SubjectName.Math ? 240 : 60;
            if (resumeProgress && resumeProgress.lessonTitle === fullLessonTitle) {
                const validIdx = (typeof resumeProgress.currentQuestionIndex === 'number' && resumeProgress.currentQuestionIndex >= 0 && resumeProgress.currentQuestionIndex < questions.length)
                    ? resumeProgress.currentQuestionIndex
                    : 0;
                setCurrentQuestionIndex(validIdx);
                setUserAnswers(resumeProgress.userAnswers || new Array(questions.length).fill(null));
                setTimer((resumeProgress.totalQuestions - validIdx) * secondsPerQuestion);
            } else {
                setCurrentQuestionIndex(0);
                setUserAnswers(new Array(questions.length).fill(null));
                setTimer(questions.length * secondsPerQuestion);
            }

            setShowResults(false);
            navigateTo(View.Quiz);
        };

        // Always fetch the latest version of unit exam from GitHub on start
        setIsLoadingExam(true);
        try {
            const semesterKey = `${selectedSubject.id}-${selectedSubject.semester}`;
            const units = subjectIndexData[semesterKey] || subjectIndexData[selectedSubject.id] || [];
            const uIdx = units.findIndex(u => u.title === unit.title);
            
            await Promise.all(unit.lessons.map(async (lesson: any, lIdx: number) => {
                if (subjectId === SubjectName.Math) {
                    if (uIdx !== -1) {
                        const unitNum = selectedSubject.semester === Semester.First ? (uIdx + 1) : (uIdx + 5);
                        const lessonNum = lIdx + 1;
                        const semPrefix = selectedSubject.semester === Semester.First ? 's1' : 's2';
                        const examsCount = (selectedSubject.semester === Semester.First && ((unitNum === 1 && (lessonNum === 1 || lessonNum === 2 || lessonNum === 3 || lessonNum === 4)) || (unitNum === 2 && (lessonNum === 1 || lessonNum === 2 || lessonNum === 3)) || (unitNum === 3 && (lessonNum === 1 || lessonNum === 2 || lessonNum === 3 || lessonNum === 4 || lessonNum === 5 || lessonNum === 6)))) ? 10 : 7;
                        const examsToFetch = Array.from({ length: examsCount }, (_, i) => i + 1);
                        await Promise.all(examsToFetch.map(async (examNum) => {
                            const url = (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 1)
                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L1_E${examNum}.json`
                                : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 2)
                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L2_E${examNum}.json`
                                    : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 3)
                                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L3_E${examNum}.json`
                                        : (selectedSubject.semester === Semester.First && unitNum === 1 && lessonNum === 4)
                                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit1_L4_E${examNum}.json`
                                            : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 1)
                                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L1_E${examNum}.json`
                                                : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 2)
                                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L2_E${examNum}.json`
                                                    : (selectedSubject.semester === Semester.First && unitNum === 2 && lessonNum === 3)
                                                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit2_L3_E${examNum}.json`
                                                        : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 1)
                                                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L1_E${examNum}.json`
                                                            : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 2)
                                                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L2_E${examNum}.json`
                                                                : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 3)
                                                                    ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L3_E${examNum}.json`
                                                                    : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 4)
                                                                        ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L4_E${examNum}.json`
                                                                        : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 5)
                                                                            ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L5_E${examNum}.json`
                                                                            : (selectedSubject.semester === Semester.First && unitNum === 3 && lessonNum === 6)
                                                                                ? `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit3_L6_E${examNum}.json`
                                                                                : `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math_${semPrefix}_unit${unitNum}_L${lessonNum}_exam${examNum}.json`;
                            try {
                                const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
                                if (res.ok) {
                                    const text = await res.text();
                                    const fetchedQuestions = cleanAndParseJson(text);
                                    if (fetchedQuestions && fetchedQuestions.length > 0) {
                                        updateDatabase(subjectId, lesson.title, fetchedQuestions, url, examNum - 1);
                                        setExamsUpdatedTrigger(prev => prev + 1);
                                    }
                                }
                            } catch (err) {
                                /* ignore error */
                            }
                        }));
                    }
                } else {
                    const subjectExams = getExamsForSubject(subjectId);
                    const examConfig = subjectExams.find(e => e.title === lesson.title);
                    const targetUrl = lesson.url || examConfig?.url;
                    if (targetUrl) {
                        try {
                            const res = await fetch(`${targetUrl}${targetUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
                            if (res.ok) {
                                const text = await res.text();
                                const fetchedQuestions = cleanAndParseJson(text);
                                if (fetchedQuestions && fetchedQuestions.length > 0) {
                                    updateDatabase(subjectId, lesson.title, fetchedQuestions, targetUrl);
                                    setExamsUpdatedTrigger(prev => prev + 1);
                                }
                            }
                        } catch (err) {
                            /* ignore error */
                        }
                    }
                }
            }));
            saveToCache();
        } catch (e) {
            console.error("Failed to load unit exam", e);
        } finally {
            setIsLoadingExam(false);
        }

        const questions = getQuizzesForUnit(subjectId, unit);
        if (!questions || questions.length === 0) {
            alert('تعذر تحميل أسئلة امتحان الوحدة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
            return;
        }

        launchUnitExamWithQuestions(questions);
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
        
        const subjectId = selectedSubject.id as SubjectName;

        setIsLoadingExam(true);
        const subjectExams = getExamsForSubject(subjectId);
        try {
            await Promise.all(subjectExams.map(async (item) => {
                if (!item.url) return;
                try {
                    const res = await fetch(`${item.url}${item.url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
                    if (res.ok) {
                        const text = await res.text();
                        const questions = cleanAndParseJson(text);
                        if (questions && questions.length > 0) {
                            updateDatabase(subjectId, item.title, questions, item.url);
                        }
                    }
                } catch (err) {
                    /* ignore error */
                }
            }));
            saveToCache();
            setExamsUpdatedTrigger(prev => prev + 1);
        } catch (e) {
            console.error("Failed to load comprehensive exam", e);
        } finally {
            setIsLoadingExam(false);
        }

        const finalSubjectData = examsDatabase[subjectId];
        if (!finalSubjectData) {
            alert('تعذر تحميل أسئلة الامتحان الشامل. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
            return;
        }

        const finalAllQuestions: Question[] = [];
        Object.values(finalSubjectData).forEach(lessonChunks => {
            lessonChunks.forEach(chunk => {
                finalAllQuestions.push(...chunk);
            });
        });

        if (finalAllQuestions.length === 0) {
            alert('تعذر تحميل أسئلة الامتحان الشامل. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
            return;
        }

        const shuffled = [...finalAllQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 40);

        const isEnglish = selectedSubject?.id === SubjectName.English;
        const title = isEnglish ? 'Comprehensive Exam - Exam (1)' : 'امتحان شامل - امتحان (1)';
        setCurrentLessonTitle(title);
        setCurrentQuiz(selected);
        setCurrentQuestionIndex(0);
        setUserAnswers(new Array(selected.length).fill(null));
        setShowResults(false);
        const secondsPerQuestion = selectedSubject?.id === SubjectName.Math ? 240 : 60;
        setTimer(selected.length * secondsPerQuestion);
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

    const isTimerActive = timer > 0;
    useEffect(() => {
        if (currentView === View.Quiz && !showResults && isTimerActive) {
            // Only start interval if not already running
            if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                    setTimer(prev => {
                        if (prev <= 1) {
                            handleFinish();
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [currentView, showResults, handleFinish, isTimerActive]);

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

    const startSessionExam = useCallback((title: string, questions: Question[], progress?: ExamProgress) => {
        setCurrentLessonTitle(title);
        setCurrentQuiz(questions);
        setCurrentUnitTitle(''); // Clear unit title for course exams
        const secondsPerQuestion = (selectedSubject?.id === SubjectName.Math || title.includes("الرياضيات")) ? 240 : 60;
        if (progress && progress.currentQuestionIndex > 0) {
            const validIdx = (typeof progress.currentQuestionIndex === 'number' && progress.currentQuestionIndex >= 0 && progress.currentQuestionIndex < questions.length)
                ? progress.currentQuestionIndex
                : 0;
            setCurrentQuestionIndex(validIdx);
            setUserAnswers(progress.userAnswers || new Array(questions.length).fill(null));
            setTimer((progress.totalQuestions - validIdx) * secondsPerQuestion);
        } else {
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(questions.length).fill(null));
            setTimer(questions.length * secondsPerQuestion);
        }
        setShowResults(false);
        navigateTo(View.Quiz);
    }, [selectedSubject, navigateTo]);

    const handleStartMockExam = useCallback(async (subjectId: SubjectName) => {
        const subject = subjectsData.find(s => s.id === subjectId);
        if (subject) setSelectedSubject(subject);

        const allExams = getExamsForSubject(subjectId);
        if (allExams.length === 0) {
            alert('عذراً، هذا الامتحان غير متوفر حالياً.');
            return;
        }

        setIsLoadingExam(true);

        try {
            const fetchPromises = allExams.map(async (exam) => {
                let questions = getQuizzesForLesson(subjectId, exam.title);
                if (exam.url) {
                    try {
                        const res = await fetch(`${exam.url}${exam.url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
                            cache: 'no-store'
                        });
                        if (res.ok) {
                            const text = await res.text();
                            const qs = cleanAndParseJson(text);
                            if (qs && qs.length > 0) {
                                updateDatabase(subjectId, exam.title, qs, exam.url);
                                setExamsUpdatedTrigger(prev => prev + 1);
                                questions = qs;
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to fetch ${exam.title}`, e);
                    }
                }
                return { title: exam.title, questions: questions || [] };
            });

            const results = await Promise.all(fetchPromises);
            saveToCache();
            
            const validResults = results.filter(r => r.questions.length > 0);
            if (validResults.length === 0) {
                alert('عذراً، لم تتوفر أسئلة لهذا الامتحان حالياً.');
                return;
            }

            const guaranteedQuestions: Question[] = [];
            const allRemainingQuestions: Question[] = [];

            validResults.forEach(res => {
                const randomIndex = Math.floor(Math.random() * res.questions.length);
                guaranteedQuestions.push(res.questions[randomIndex]);
                const others = res.questions.filter((_, idx) => idx !== randomIndex);
                allRemainingQuestions.push(...others);
            });

            let finalQuestions: Question[] = [];
            if (guaranteedQuestions.length >= 40) {
                finalQuestions = guaranteedQuestions.sort(() => Math.random() - 0.5).slice(0, 40);
            } else {
                finalQuestions = [...guaranteedQuestions];
                const pool = allRemainingQuestions.sort(() => Math.random() - 0.5);
                const needed = 40 - finalQuestions.length;
                finalQuestions.push(...pool.slice(0, needed));
            }

            finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);

            const isEnglish = subjectId === SubjectName.English;
            const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
            const fullLessonTitle = `دورة تجريبية - ${subjectId} - ${examLabel}`;
            
            startSessionExam(fullLessonTitle, finalQuestions);

        } catch (error) {
            console.error("Error starting mock exam:", error);
            alert('فشل تحميل الامتحان. يرجى المحاولة لاحقاً.');
        } finally {
            setIsLoadingExam(false);
        }
    }, [getExamsForSubject, startSessionExam]);

    const handleStartSessionExam = async (subjectId: SubjectName, sessionName: string) => {
        if ((sessionName === 'دورة 2008' || sessionName === 'دورة 2008 تكميلي') && subjectId === SubjectName.Math) {
            showNotice(
                'أقرت وزارة التربية والتعليم مادة الرياضيات لطلاب الصف الحادي عشر الأكاديمي جيل 2010 لأول مرة لهذا العام 2026/2027 لذلك لا يتوفر امتحانات وزارة سابقة',
                'تنبيه',
                'https://i.postimg.cc/XvYQrc5C/FB-IMG-1780984890803.jpg'
            );
            return;
        }

        if (sessionName === 'الدورة التجريبية') {
            handleStartMockExam(subjectId);
            return;
        }

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

        const launchSessionExam = (qs: Question[]) => {
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
        };

        setIsLoadingExam(true);
        let freshQuestions: Question[] | null = null;
        try {
            const res = await fetch(`${examInfo.url}${examInfo.url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
                cache: 'no-store'
            });
            if (res.ok) {
                const text = await res.text();
                const qs = cleanAndParseJson(text);
                if (qs && qs.length > 0) {
                    updateDatabase(subjectId, examInfo.title, qs, examInfo.url);
                    saveToCache();
                    setExamsUpdatedTrigger(prev => prev + 1);
                    freshQuestions = qs;
                }
            }
        } catch (e) {
            console.warn("[JoSchool DB] Failed to fetch fresh session exam from GitHub, falling back to cached questions.", e);
        } finally {
            setIsLoadingExam(false);
        }

        const questions = freshQuestions || getQuizzesForLesson(subjectId, examInfo.title);
        if (!questions || questions.length === 0) {
            alert('تعذر تحميل أسئلة الامتحان. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
            return;
        }

        launchSessionExam(questions);
    };

    const startQuizWithQuestions = (title: string, questions: Question[]) => {
        setCurrentLessonTitle(title);
        setCurrentQuiz(questions);
        setCurrentQuestionIndex(0);
        setUserAnswers(new Array(questions.length).fill(null));
        setShowResults(false);
        const secondsPerQuestion = (selectedSubject?.id === SubjectName.Math || title.includes("الرياضيات")) ? 240 : 60;
        setTimer(questions.length * secondsPerQuestion);
        navigateTo(View.Quiz);
    };

    const handleLogout = (skipConfirm = false) => {
        if (skipConfirm === true) {
            confirmLogout();
        } else {
            setShowLogoutConfirmation(true);
        }
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

    const handleViewSessionResult = useCallback((subjectId: SubjectName, sessionName: string, providedResult?: QuizResult) => {
        let baseTitle = "";
        const isEnglish = subjectId === SubjectName.English;
        const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';

        if (sessionName === 'دورة 2008') {
            const exam = SESSION_2008_EXAMS.find(e => e.subject === subjectId);
            if (exam) baseTitle = exam.title;
        } else if (sessionName === 'دورة 2008 تكميلي') {
            const exam = SESSION_2008_SUP_EXAMS.find(e => e.subject === subjectId);
            if (exam) baseTitle = exam.title;
        } else if (sessionName === 'الدورة التجريبية') {
            baseTitle = `دورة تجريبية - ${subjectId}`;
        }

        const fullLessonTitle = `${baseTitle} - ${examLabel}`;
        const mockExamTitle = isEnglish ? 'Mock Exam' : 'امتحان تجريبي';

        // Use provided result or find the best one
        const result = providedResult || userProgress.quizResults
            .filter(r => r.subjectId === subjectId && (
                r.lessonTitle === fullLessonTitle || 
                (sessionName === 'الدورة التجريبية' && r.lessonTitle === mockExamTitle) ||
                (baseTitle !== "" && r.lessonTitle.includes(baseTitle))
            ))
            .sort((a, b) => {
                if (a.userAnswers && !b.userAnswers) return -1;
                if (!a.userAnswers && b.userAnswers) return 1;
                return (b.score / b.totalQuestions) - (a.score / a.totalQuestions);
            })[0];

        if (!result) {
            alert('عذراً، لم يتم العثور على نتيجة لهذا الامتحان.');
            return;
        }

        if (!result.userAnswers) {
            alert('عذراً، تفاصيل الإجابات غير متوفرة لهذا الامتحان (تم الحفظ قبل التحديث).');
            return;
        }

        const subject = subjectsData.find(s => s.id === subjectId);
        if (subject) setSelectedSubject(subject);

        const setupResultView = (qs: Question[]) => {
            setCurrentLessonTitle(result.lessonTitle); // Use the title from the result for consistency
            setCurrentQuiz(qs);
            setUserAnswers(result.userAnswers!);
            setExamNumber(result.examNumber || null);
            setCurrentUnitTitle(''); // Clear unit title for course exams
            setShowResults(true);
            navigateTo(View.Quiz);
        };

        if (sessionName === 'الدورة التجريبية') {
            // For mock/experimental, we don't have a single lesson title, so we use all subject questions
            const allExams = getExamsForSubject(subjectId);
            const allQs: Question[] = [];
            allExams.forEach(e => {
                const qs = getQuizzesForLesson(subjectId, e.title);
                if (qs) allQs.push(...qs);
            });

            if (allQs.length > 0) {
                // Since mock exam is 40 questions (or less), and we don't know which 40 were picked,
                // this is a bit tricky. However, most session exams are static.
                // For mock, we only have the answers. We need the original questions.
                // If it's a mock exam, we'll try to find the questions by their text/number if we had to,
                // but usually the user has them in the database.
                setupResultView(allQs); // This might show more questions than answered, but ResultsPage handles it
            } else {
                alert('عذراً، يجب تحميل دروس المادة أولاً لاستعراض النتيجة.');
            }
            return;
        }

        const sessionExams = sessionName === 'دورة 2008' ? SESSION_2008_EXAMS : SESSION_2008_SUP_EXAMS;
        const examInfo = sessionExams.find(e => e.subject === subjectId);
        
        const questions = examInfo && hasValidCache(subjectId, baseTitle, examInfo.url) ? getQuizzesForLesson(subjectId, baseTitle) : null;
        if (!questions || questions.length === 0) {
            if (!examInfo || !examInfo.url) {
                alert('عذراً، محتوى هذا الامتحان غير متوفر حالياً.');
                return;
            }

            setIsLoadingExam(true);
            fetch(examInfo.url)
                .then(res => res.text())
                .then(text => {
                    const qs = cleanAndParseJson(text);
                    if (qs && qs.length > 0) {
                        updateDatabase(subjectId, baseTitle, qs, examInfo.url);
                        setExamsUpdatedTrigger(prev => prev + 1);
                        setupResultView(qs);
                    } else {
                        alert('عذراً، لم نتمكن من استعادة أسئلة الامتحان.');
                    }
                })
                .catch(() => alert('فشل استعادة الامتحان. يرجى المحاولة لاحقاً.'))
                .finally(() => setIsLoadingExam(false));
        } else {
            setupResultView(questions);
        }
    }, [userProgress.quizResults, navigateTo, getExamsForSubject]);

    const handleResetExamResult = (subjectId: SubjectName, lessonTitle: string) => {
        setUserProgress(prev => {
            const newResults = prev.quizResults.filter(r => 
                !(r.subjectId === subjectId && r.lessonTitle === lessonTitle)
            );
            const newProgresses = { ...prev.examProgresses };
            const key = `${subjectId}_${lessonTitle}`;
            if (newProgresses[key]) {
                newProgresses[key] = {
                    ...newProgresses[key],
                    currentQuestionIndex: 0,
                    userAnswers: [],
                    lastUpdated: new Date().toISOString()
                };
            }
            return {
                ...prev,
                lastActive: new Date().toISOString(),
                quizResults: newResults,
                examProgresses: newProgresses
            };
        });
    };

    const handleResetSession = (sessionName: string) => {
        const sessionSubjects = [
            SubjectName.JordanHistory,
            SubjectName.IslamicEducation,
            SubjectName.Arabic,
            SubjectName.Math
        ];

        const sessionExams = sessionName === 'دورة 2008' ? SESSION_2008_EXAMS : SESSION_2008_SUP_EXAMS;
        
        setUserProgress(prev => {
            let newResults = [...prev.quizResults];
            const newProgresses = { ...prev.examProgresses };

            sessionSubjects.forEach(subjectId => {
                let baseTitle = "";
                if (sessionName === 'دورة 2008' || sessionName === 'دورة 2008 تكميلي') {
                    const exam = sessionExams.find(e => e.subject === subjectId);
                    if (exam) baseTitle = exam.title;
                } else if (sessionName === 'الدورة التجريبية') {
                    baseTitle = `دورة تجريبية - ${subjectId}`;
                }

                if (baseTitle) {
                    const isEnglish = false;
                    const examLabel = isEnglish ? 'Exam (1)' : 'امتحان (1)';
                    const lessonTitle = `${baseTitle} - ${examLabel}`;
                    
                    // Filter out the results
                    newResults = newResults.filter(r => 
                        !(r.subjectId === subjectId && (r.lessonTitle === lessonTitle || r.lessonTitle.includes(baseTitle)))
                    );

                    // Also check for legacy titles
                    const mockExamTitle = isEnglish ? 'Mock Exam' : 'امتحان تجريبي';
                    if (sessionName === 'الدورة التجريبية') {
                        newResults = newResults.filter(r => 
                            !(r.subjectId === subjectId && r.lessonTitle === mockExamTitle)
                        );
                    }

                    // Reset progress
                    const key = `${subjectId}_${lessonTitle}`;
                    if (newProgresses[key]) {
                        newProgresses[key] = {
                            ...newProgresses[key],
                            currentQuestionIndex: 0,
                            userAnswers: [],
                            lastUpdated: new Date().toISOString()
                        };
                    }
                }
            });

            return {
                ...prev,
                lastActive: new Date().toISOString(),
                quizResults: newResults,
                examProgresses: newProgresses
            };
        });
    };

    const currentViewComponent = () => {
        try {
            // Log current view state for debugging
            if (isAuthenticating) {
                console.log("App: Authenticating...");
                return (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] py-20 px-6 text-center">
                        <div className="relative w-28 h-28 mx-auto mb-10 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <motion.div 
                                className="absolute inset-0 border-4 border-[#1d5bfc] rounded-full border-t-transparent"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                                <img src={LOGO_DATA_URI} alt="JoSchool" className="w-full h-auto object-contain" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">جاري التحقق من الهوية...</h3>
                        <p className="text-slate-500 font-bold text-sm">يرجى الانتظار قليلاً</p>
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
                case View.Welcome:
                    return (
                        <WelcomePage 
                            onStart={() => {
                                const key = getStorageKey('has_seen_welcome', user?.uid);
                                safeLocalStorageSetItem(key, 'true');
                                safeLocalStorageSetItem('joschool_has_seen_welcome', 'true');
                                isNavigatingBackRef.current = true;
                                setViewHistory([View.Landing]);
                                window.history.replaceState({ view: View.Landing, historyIndex: 0 }, '');
                            }}
                        />
                    );
                case View.Landing: 
                    return (
                        <LandingPage 
                            subjectsData={subjectsData} 
                            subjectIndexData={subjectIndexData}
                            userProgress={userProgress}
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
                            showNotice={showNotice}
                            navigateTo={navigateTo} 
                            onBack={goBack}
                            examsUpdatedTrigger={examsUpdatedTrigger}
                        />
                    );
                case View.Quiz: {
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

                    const safeQuestionIndex = (currentQuestionIndex >= 0 && currentQuestionIndex < currentQuiz.length)
                        ? currentQuestionIndex
                        : 0;

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
                            userProgress={userProgress}
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
                            currentQuestionIndex={safeQuestionIndex} 
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
                }
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
                            setUserProgress={setUserProgress}
                            goBack={goBack}
                        />
                    );
                case View.Announcements:
                    return (
                        <AnnouncementsPage 
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
                            onBack={goBack}
                            sessionTitle={sessionTitle}
                            handleStartSessionExam={handleStartSessionExam}
                            handleResetExamResult={handleResetExamResult}
                            handleResetSession={handleResetSession}
                            handleViewSessionResult={handleViewSessionResult}
                            userProgress={userProgress}
                        />
                    );
                case View.MoEResults:
                    return (
                        <MoEResultsPage 
                            userProgress={userProgress}
                            userName={user?.displayName || ''}
                            onBack={goBack}
                            sessionTitle={sessionTitle}
                        />
                    );
                case View.SessionsList:
                    return (
                        <SessionsListPage 
                            navigateTo={(view, subject, title) => {
                                if (subject) setSelectedSubject(subject);
                                navigateTo(view, title);
                            }}
                            onBack={goToHome}
                        />
                    );
                case View.Library:
                    return (
                        <LibraryPage 
                            subjectsData={subjectsData}
                            navigateTo={(view, subject, title) => {
                                if (subject) setSelectedSubject(subject);
                                navigateTo(view, title);
                            }}
                            onBack={goToHome}
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
                        className="fixed inset-0 z-[10001] bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[2.5rem] p-12 shadow-2xl border-2 border-slate-900 max-w-xs w-full"
                        >
                            <div className="relative w-28 h-28 mx-auto mb-10 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <motion.div 
                                    className="absolute inset-0 border-4 border-[#1d5bfc] rounded-full border-t-transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                                <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                                    <img src={LOGO_DATA_URI} alt="JoSchool" className="w-full h-auto object-contain" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-3">جاري تحضير الامتحان...</h3>
                            <p className="text-slate-500 font-bold text-sm">لحظات قليلة ونبدأ!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {user && ![View.Welcome, View.Landing, View.Quiz, View.SubjectIndex, View.Results, View.SessionSubjects, View.Favorites, View.SessionsList, View.Library].includes(currentView) && (
                <button 
                    onClick={goBack}
                    className={`fixed top-4 z-[9999] p-3 bg-white border border-slate-900 rounded-full shadow-lg text-slate-600 hover:text-primary transition-all active:scale-95 
                        ${((isEnglish || currentView === View.SessionSubjects || currentView === View.Favorites || currentView === View.Progress || currentView === View.PdfViewer || currentView === View.Announcements) && currentView !== View.MoEResults) ? 'left-4' : 'right-4'}`}
                    title={(isEnglish && currentView !== View.MoEResults) ? "Back" : "رجوع"}
                >
                    {((isEnglish || currentView === View.SessionSubjects || currentView === View.Favorites || currentView === View.Progress || currentView === View.PdfViewer || currentView === View.Announcements) && currentView !== View.MoEResults) ? <ChevronLeftIcon className="w-6 h-6" strokeWidth={3} /> : <ChevronRightIcon className="w-6 h-6" strokeWidth={3} />}
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

            {showMultiBooksModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-secondary/60 backdrop-blur-sm" dir="rtl">
                    <div className="bg-white w-full max-w-sm rounded-xl p-8 shadow-2xl relative border-t-4 border-primary border border-slate-900">
                        <button 
                            onClick={() => setShowMultiBooksModal(false)} 
                            className="absolute top-6 left-6 p-2 bg-app-bg rounded-full border border-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            <XIcon className="w-5 h-5"/>
                        </button>
                        <h3 className="text-xl font-black text-text-main text-center mb-8 pt-2">اختر الكتاب</h3>
                        <div className="space-y-4">
                            {selectedSubject?.multiBooks?.map((book, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => { window.open(book.url, '_blank'); setShowMultiBooksModal(false); }} 
                                    className="w-full p-4 bg-white border-r-[6px] border-sky-400 border-l border-t border-b border-sky-400 shadow-md shadow-sky-400/30 rounded-2xl flex items-center gap-3 transition-all duration-100 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-sky-400/40 group whitespace-nowrap touch-manipulation"
                                >
                                    {book.coverImage ? (
                                        <div className="w-10 h-14 bg-white rounded-md overflow-hidden flex items-center justify-center border border-slate-900 shadow-sm shrink-0">
                                            <img 
                                                src={book.coverImage} 
                                                alt={book.label} 
                                                className="w-full h-full object-cover" 
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                                            <BookOpenIcon className="w-5 h-5 text-primary" />
                                        </div>
                                    )}
                                    <span className="text-base font-black text-text-main">{book.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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

            {noticeModal?.show && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fast-fade" dir="rtl">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border-2 border-slate-900 relative text-center">
                        <button 
                            onClick={() => setNoticeModal(null)} 
                            className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors border border-slate-300"
                        >
                            <XIcon className="w-5 h-5"/>
                        </button>
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-900 shadow-md mx-auto mb-3 flex items-center justify-center bg-white shrink-0">
                            <img 
                                src={noticeModal.imageUrl || "https://i.postimg.cc/XvYQrc5C/FB-IMG-1780984890803.jpg"} 
                                alt="شعار التنبيه" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">{noticeModal.title || "تنبيه"}</h3>
                        <p className="text-slate-700 font-bold text-sm leading-relaxed mb-6 px-2">
                            {noticeModal.message}
                        </p>
                        <button 
                            onClick={() => setNoticeModal(null)}
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 text-sm"
                        >
                            حسناً، فهمت
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;