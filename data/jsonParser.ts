import { Question, SubjectName, Semester } from '../types';
import { examsDatabase, updateDatabase, saveToCache } from './examsDatabase';

/**
 * Safely escape invalid backslashes inside JSON strings (e.g. \implies, \sqrt, \cdot)
 */
export const fixUnescapedBackslashesInJson = (jsonString: string): string => {
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

/**
 * Clean and parse JSON that might contain BOM, non-breaking spaces, or unescaped LaTeX
 */
export const cleanAndParseJson = (text: string): Question[] | null => {
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
                if (q && q.options && (!q.choices || q.choices.length === 0)) {
                    q.choices = q.options.map((opt: any) => opt.label);
                }
            });
            return questions;
        }
        return null;
    } catch (e) {
        if (!cleanedText.includes('404')) {
            console.warn('[JSON Parser] Parse error:', e);
        }
        return null;
    }
};

/**
 * Get Math exam raw URL for specific unit, lesson, and chunk
 */
export const getMathExamUrl = (unitIdx: number, lessonIdx: number, chunkIndex: number, semester: Semester = Semester.First): string => {
    const unitNum = semester === Semester.First ? (unitIdx + 1) : (unitIdx + 5);
    const lessonNum = lessonIdx + 1;
    const examNum = chunkIndex + 1;
    const semPrefix = semester === Semester.First ? 's1' : 's2';

    if (semester === Semester.First) {
        return `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_s1_unit${unitNum}_L${lessonNum}_E${examNum}.json`;
    }
    return `https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math_${semPrefix}_unit${unitNum}_L${lessonNum}_exam${examNum}.json`;
};

/**
 * Fetch and parse an exam directly from GitHub and cache it
 */
export const fetchExamQuestions = async (
    subject: SubjectName,
    lessonTitle: string,
    chunkIndex: number = 0,
    unitTitle?: string,
    unitIdx?: number,
    lessonIdx?: number,
    knownUrl?: string
): Promise<Question[] | null> => {
    try {
        let targetUrl = knownUrl;
        if (!targetUrl && subject === SubjectName.Math) {
            const uIdx = unitIdx !== undefined ? unitIdx : 0;
            const lIdx = lessonIdx !== undefined ? lessonIdx : 0;
            targetUrl = getMathExamUrl(uIdx, lIdx, chunkIndex);
        }

        if (!targetUrl) return null;

        const res = await fetch(`${targetUrl}${targetUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return null;

        const text = await res.text();
        const questions = cleanAndParseJson(text);
        if (questions && questions.length > 0) {
            updateDatabase(subject, lessonTitle, questions, targetUrl, chunkIndex);
            saveToCache();
            return questions;
        }
    } catch (err) {
        console.error('[fetchExamQuestions] Failed to fetch exam:', err);
    }
    return null;
};
