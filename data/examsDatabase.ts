import { Question, SubjectName } from '../types';

export const examsDatabase: {
    [key in SubjectName]?: {
        [lessonTitle: string]: Question[][]
    }
} = {};

export const examsUrlsDatabase: {
    [cacheKey: string]: string
} = {};

/**
 * التحقق من وجود تخزين مؤقت صالح للرابط المحدد
 */
export const hasValidCache = (subject: SubjectName, lessonTitle: string, currentUrl?: string, chunkIndex?: number): boolean => {
    if (subject === SubjectName.Math && chunkIndex !== undefined) {
        if (!examsDatabase[subject]?.[lessonTitle]?.[chunkIndex]) return false;
        if (!currentUrl) return true;
        const cacheKey = `${subject}_${lessonTitle}_${chunkIndex}`;
        return examsUrlsDatabase[cacheKey] === currentUrl;
    }
    if (!examsDatabase[subject]?.[lessonTitle]) return false;
    if (!currentUrl) return true;
    const cacheKey = `${subject}_${lessonTitle}`;
    return examsUrlsDatabase[cacheKey] === currentUrl;
};

/**
 * تحديث قاعدة البيانات بأسئلة لدرس محدد
 */
export const updateDatabase = (subject: SubjectName, lessonTitle: string, questions: Question[], url?: string, chunkIndex?: number) => {
    try {
        if (!questions || !Array.isArray(questions)) return;

        if (!examsDatabase[subject]) {
            examsDatabase[subject] = {};
        }

        if (subject === SubjectName.Math && chunkIndex !== undefined) {
            if (!examsDatabase[subject]![lessonTitle]) {
                examsDatabase[subject]![lessonTitle] = [];
            }
            examsDatabase[subject]![lessonTitle][chunkIndex] = questions;
            
            if (url) {
                const cacheKey = `${subject}_${lessonTitle}_${chunkIndex}`;
                examsUrlsDatabase[cacheKey] = url;
            }
        } else {
            // بالنسبة للغة العربية أو امتحانات الدورات (2008/2010)، يتم تحميل الامتحان كاملاً كمجموعة واحدة (Chunk)
            // أما تاريخ الأردن، التربية الإسلامية، والرياضيات وبقية المواد فيتم تقسيم أسئلتها إلى مجموعات (عشرات: 10 أسئلة لكل امتحان)
            const chunks: Question[][] = [];
            const isSessionExam = lessonTitle.includes('دورة 2008') || lessonTitle.includes('دورة 2010');
            
            if (subject === SubjectName.Arabic || isSessionExam) {
                chunks.push(questions);
            } else {
                for (let i = 0; i < questions.length; i += 10) {
                    chunks.push(questions.slice(i, i + 10));
                }
            }

            examsDatabase[subject]![lessonTitle] = chunks;

            if (url) {
                const cacheKey = `${subject}_${lessonTitle}`;
                examsUrlsDatabase[cacheKey] = url;
            }
        }
    } catch (e) {
        console.error("[JoSchool DB] Update failed", e);
    }
};

/**
 * حفظ قاعدة البيانات في التخزين المحلي
 */
export const saveToCache = () => {
    try {
        localStorage.setItem('joschool_exams_cache', JSON.stringify(examsDatabase));
        localStorage.setItem('joschool_exams_urls_cache', JSON.stringify(examsUrlsDatabase));
        console.log("[JoSchool DB] Saved to cache");
    } catch (e) {
        console.warn("[JoSchool DB] Cache save failed (likely quota exceeded)", e);
    }
};

/**
 * تحميل قاعدة البيانات من التخزين المحلي
 */
export const loadFromCache = () => {
    try {
        const cached = localStorage.getItem('joschool_exams_cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            Object.assign(examsDatabase, parsed);
        }
        
        const cachedUrls = localStorage.getItem('joschool_exams_urls_cache');
        if (cachedUrls) {
            const parsedUrls = JSON.parse(cachedUrls);
            Object.assign(examsUrlsDatabase, parsedUrls);
        }
        
        console.log("[JoSchool DB] Loaded from cache successfully");
        return true;
    } catch (e) {
        console.error("[JoSchool DB] Cache load failed", e);
    }
    return false;
};
