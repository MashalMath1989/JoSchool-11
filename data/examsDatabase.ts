import { Question, SubjectName } from '../types';

export const examsDatabase: {
    [key in SubjectName]?: {
        [lessonTitle: string]: Question[][]
    }
} = {};

/**
 * تحديث قاعدة البيانات بأسئلة لدرس محدد
 */
export const updateDatabase = (subject: SubjectName, lessonTitle: string, questions: Question[]) => {
    try {
        if (!questions || !Array.isArray(questions)) return;

        if (!examsDatabase[subject]) {
            examsDatabase[subject] = {};
        }

        // بالنسبة للغة العربية والإنجليزية، أو امتحانات الدورات (2008/2009)، يتم تحميل الامتحان كاملاً كمجموعة واحدة (Chunk)
        // أما المواد الأخرى فيتم تقسيمها إلى مجموعات من 10 أسئلة
        const chunks: Question[][] = [];
        const isSessionExam = lessonTitle.includes('دورة 2008') || lessonTitle.includes('دورة 2009');
        
        if (subject === SubjectName.Arabic || subject === SubjectName.English || isSessionExam) {
            chunks.push(questions);
        } else {
            for (let i = 0; i < questions.length; i += 10) {
                chunks.push(questions.slice(i, i + 10));
            }
        }

        examsDatabase[subject]![lessonTitle] = chunks;
        // console.log(`[AlShamel DB] Loaded ${questions.length} questions for ${lessonTitle}`);
    } catch (e) {
        console.error("[AlShamel DB] Update failed", e);
    }
};

/**
 * حفظ قاعدة البيانات في التخزين المحلي
 */
export const saveToCache = () => {
    try {
        localStorage.setItem('alshamel_exams_cache', JSON.stringify(examsDatabase));
        console.log("[AlShamel DB] Saved to cache");
    } catch (e) {
        console.warn("[AlShamel DB] Cache save failed (likely quota exceeded)", e);
    }
};

/**
 * تحميل قاعدة البيانات من التخزين المحلي
 */
export const loadFromCache = () => {
    try {
        const cached = localStorage.getItem('alshamel_exams_cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            Object.assign(examsDatabase, parsed);
            console.log("[AlShamel DB] Loaded from cache");
            return true;
        }
    } catch (e) {
        console.error("[AlShamel DB] Cache load failed", e);
    }
    return false;
};
