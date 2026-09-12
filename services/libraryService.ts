// Service to fetch, cache, and filter library data from the official JSON repository
// URL: https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_Library.json

export const LIBRARY_JSON_URL = 'https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/Math11_Library.json';
export const LIBRARY_CACHE_KEY = 'math11_library_remote_cache_v3';

export interface RawLibraryItem {
    id?: number | string;
    title: string;
    type?: string;
    fileUrl?: string;
    thumbnail?: string;
}

export interface RawLibraryGroup {
    subject: string;
    semester: string;
    category: string;
    items: RawLibraryItem[];
}

export interface ValidLibraryItem {
    id: number | string;
    title: string;
    type: 'pdf' | 'image' | 'video' | 'link';
    fileUrl: string;
    thumbnail?: string;
    subject: string;
    semester: string;
    category: string;
    isAvailable: boolean;
}

// Default bundled data directly matching the remote JSON repository
export const DEFAULT_LIBRARY_DATA: RawLibraryGroup[] = [
  {
    "subject": "الرياضيات",
    "semester": "الفصل الأول",
    "category": "الكتب المدرسية",
    "items": [
      {
        "title": "كتاب الطالب (رياضيات) - (2026/2027) ف1",
        "type": "pdf",
        "fileUrl": "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_S1_StudentBook.pdf",
        "thumbnail": ""
      }
    ]
  },
  {
    "subject": "الرياضيات",
    "semester": "الفصل الأول",
    "category": "الكتب المدرسية",
    "items": [
      {
        "title": "كتاب التمارين (رياضيات) - (2026/2027) ف1",
        "type": "pdf",
        "fileUrl": "https://raw.githubusercontent.com/MashalMath/Pdf_Library/main/Math11_WorkBook.pdf",
        "thumbnail": ""
      }
    ]
  },
  {
    "subject": "تاريخ الأردن",
    "semester": "الفصل الأول",
    "category": "ملخصات",
    "items": [
      {
        "title": "ملخص تاريخ الأردن - فصل أول",
        "type": "pdf",
        "fileUrl": "",
        "thumbnail": ""
      }
    ]
  },
  {
    "subject": "الرياضيات",
    "semester": "الفصل الأول",
    "category": "امتحانات",
    "items": [
      {
        "title": "امتحان مقترح وزارة - فصل أول",
        "type": "pdf",
        "fileUrl": "",
        "thumbnail": ""
      }
    ]
  },
  {
    "subject": "الرياضيات",
    "semester": "الفصل الأول",
    "category": "ملازم",
    "items": [
      {
        "title": "ملزمة رياضيات - فصل أول",
        "type": "pdf",
        "fileUrl": "",
        "thumbnail": ""
      }
    ]
  },
  {
    "subject": "الرياضيات",
    "semester": "الفصل الأول",
    "category": "ملخصات",
    "items": [
      {
        "title": "ملخص رياضيات - فصل أول",
        "type": "pdf",
        "fileUrl": "",
        "thumbnail": ""
      }
    ]
  },
  {
    "subject": "اللغة العربية",
    "semester": "الفصل الأول",
    "category": "امتحانات",
    "items": [
      {
        "title": "امتحان مقترح وزارة - فصل أول",
        "type": "pdf",
        "fileUrl": "",
        "thumbnail": ""
      }
    ]
  },
  {
    "subject": "التربية الإسلامية",
    "semester": "الفصل الأول",
    "category": "امتحانات",
    "items": [
      {
        "title": "امتحان مقترح وزارة - فصل أول",
        "type": "pdf",
        "fileUrl": "",
        "thumbnail": ""
      }
    ]
  }
];

// Helper to determine resource type
export function inferResourceType(type?: string, url?: string): 'pdf' | 'image' | 'video' | 'link' {
    const cleanUrl = (url || '').toLowerCase();
    const cleanType = (type || '').toLowerCase();

    if (cleanType === 'pdf' || cleanUrl.includes('.pdf') || (cleanUrl.includes('drive.google.com') && !cleanUrl.includes('youtube'))) {
        return 'pdf';
    }
    if (cleanType === 'image' || cleanUrl.match(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i)) {
        return 'image';
    }
    if (cleanType === 'video' || cleanUrl.includes('youtube') || cleanUrl.includes('youtu.be') || cleanUrl.match(/\.(mp4|webm)(\?.*)?$/i)) {
        return 'video';
    }
    if (cleanType === 'link' || cleanUrl.startsWith('http')) {
        return 'link';
    }
    return 'pdf';
}

// Resilient Regex fallback extractor when JSON is syntactically broken by manual edits
export function regexExtractLibraryItems(text: string): ValidLibraryItem[] {
    const results: ValidLibraryItem[] = [];
    const seenKeys = new Set<string>();

    const objectRegex = /\{[^{}]*"fileUrl"\s*:\s*"([^"]+)"[^{}]*\}/gi;
    let match: RegExpExecArray | null;

    while ((match = objectRegex.exec(text)) !== null) {
        const block = match[0];
        const rawUrl = match[1]?.trim();
        if (!rawUrl || rawUrl === '""') continue;

        const titleMatch = block.match(/"title"\s*:\s*"([^"]+)"/i);
        const typeMatch = block.match(/"type"\s*:\s*"([^"]+)"/i);
        const subjectMatch = block.match(/"subject"\s*:\s*"([^"]+)"/i);
        const semesterMatch = block.match(/"semester"\s*:\s*"([^"]+)"/i);
        const categoryMatch = block.match(/"category"\s*:\s*"([^"]+)"/i);

        const rawTitle = titleMatch ? titleMatch[1].trim() : 'ملف دراسي';
        const curSub = subjectMatch ? subjectMatch[1].trim() : 'الرياضيات';
        // Skip English items
        if (curSub.includes('انجليز') || curSub.includes('انكليز') || curSub.toLowerCase().includes('english')) {
            continue;
        }
        const curSem = semesterMatch ? semesterMatch[1].trim() : 'الفصل الأول';
        const curCat = categoryMatch ? categoryMatch[1].trim() : 'الكتب المدرسية';

        const itemKey = `${curSub}|${curSem}|${curCat}|${rawTitle}|${rawUrl}`;
        if (seenKeys.has(itemKey)) continue;
        seenKeys.add(itemKey);

        results.push({
            id: `regex-${results.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
            title: rawTitle,
            type: inferResourceType(typeMatch ? typeMatch[1] : undefined, rawUrl),
            fileUrl: rawUrl,
            thumbnail: '',
            subject: curSub,
            semester: curSem,
            category: curCat,
            isAvailable: true
        });
    }

    return results;
}

// Resilient parser that repairs common human JSON editing mistakes (trailing commas, unclosed braces, comments, smart quotes, accidental nesting)
export function robustParseLibraryJSON(text: string): any {
    if (!text || typeof text !== 'string') return null;

    // 1. Strip BOM, zero-width spaces, non-breaking spaces
    let clean = text.replace(/\u00a0/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    // 2. Direct JSON.parse
    try {
        const direct = JSON.parse(clean);
        if (direct) return direct;
    } catch {
        // Continue to robust cleanup
    }

    // 3. Strip JS-style comments (//... and /* ... */)
    clean = clean.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*/g, '$1');

    // 4. Normalize smart/curly quotes to standard double quotes
    clean = clean.replace(/[\u201C\u201D\u00AB\u00BB]/g, '"').replace(/[\u2018\u2019]/g, '"');

    // 5. Remove trailing commas before } or ]
    const noCommas = clean.replace(/,\s*([\]}])/g, '$1');
    try {
        const parsed = JSON.parse(noCommas);
        if (parsed) return parsed;
    } catch {
        // Continue to nested syntax repair
    }

    // 6. Precise repair: Handle accidental group nesting where a new group `{ "subject": ... }` was pasted inside `items: [ ... ]` without closing `] }`
    // This matches `}, { "subject"` where the preceding `}` is NOT closing a group `]`
    const fixedNesting = noCommas.replace(/([^\]\s]\s*\})\s*,\s*\{\s*"subject"/g, '$1\n    ]\n  },\n  {\n    "subject"');
    try {
        const parsed = JSON.parse(fixedNesting);
        if (parsed) return parsed;
    } catch {
        // Continue to bracket balancing
    }

    // 7. Balance mismatched brackets and braces at end of string
    const candidates = [fixedNesting, noCommas, clean];
    for (const candidate of candidates) {
        const openBraces = (candidate.match(/\{/g) || []).length;
        let closeBraces = (candidate.match(/\}/g) || []).length;
        const openBrackets = (candidate.match(/\[/g) || []).length;
        let closeBrackets = (candidate.match(/\]/g) || []).length;

        let balanced = candidate;
        while (closeBraces < openBraces) {
            balanced += '\n}';
            closeBraces++;
        }
        while (closeBrackets < openBrackets) {
            balanced += '\n]';
            closeBrackets++;
        }
        try {
            const parsed = JSON.parse(balanced);
            if (parsed) return parsed;
        } catch {
            // Try next candidate
        }
    }

    // 8. Fallback: Extract items directly using regex
    try {
        const regexItems = regexExtractLibraryItems(text);
        if (regexItems.length > 0) {
            return regexItems;
        }
    } catch {
        // Final fallback failed
    }

    return null;
}

// Load cached library groups from localStorage, falling back to bundled data
export function loadCachedLibraryData(): RawLibraryGroup[] {
    try {
        const cached = localStorage.getItem(LIBRARY_CACHE_KEY);
        if (cached) {
            const parsed = robustParseLibraryJSON(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Ensure cached data has at least as many valid items as default bundled data
                const cachedValidCount = extractValidLibraryItems(parsed).length;
                const defaultValidCount = extractValidLibraryItems(DEFAULT_LIBRARY_DATA).length;
                if (cachedValidCount >= defaultValidCount) {
                    return parsed;
                }
            }
        }
    } catch (e) {
        console.warn('Error reading cached library data:', e);
    }
    return DEFAULT_LIBRARY_DATA;
}

// GitHub Contents API URL as a secondary live endpoint (bypasses raw CDN cache)
export const GITHUB_API_URL = "https://api.github.com/repos/MashalMath/joschool-11-arabic-exams/contents/Math11_Library.json?ref=JoSchool112010";

// Fetch remote library data with multi-source fallback and zero-preflight CORS compatibility
export async function fetchRemoteLibraryData(): Promise<any> {
    const timestamp = Date.now();
    const rnd = Math.random().toString(36).slice(2, 7);

    // 1. Primary Attempt: Direct raw GitHub URL with query string cache-buster
    // Note: We DO NOT send custom headers here to avoid triggering an OPTIONS CORS preflight that GitHub raw rejects
    try {
        const rawUrl = `${LIBRARY_JSON_URL}?t=${timestamp}&_r=${rnd}`;
        const response = await fetch(rawUrl);
        if (response.ok) {
            const text = await response.text();
            const data = robustParseLibraryJSON(text);
            if (data && ((Array.isArray(data) && data.length > 0) || (typeof data === 'object' && Object.keys(data).length > 0))) {
                try {
                    localStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(data));
                } catch {
                    // Storage quota exceeded
                }
                return data;
            }
        }
    } catch (rawErr) {
        console.warn('Primary fetch from GitHub raw failed, trying API fallback:', rawErr);
    }

    // 2. Secondary Attempt: GitHub API contents endpoint (returns Base64 encoded live file from Git tree)
    try {
        const apiUrl = `${GITHUB_API_URL}&t=${timestamp}`;
        const apiResponse = await fetch(apiUrl);
        if (apiResponse.ok) {
            const jsonMeta = await apiResponse.json();
            if (jsonMeta && typeof jsonMeta.content === 'string') {
                const cleanBase64 = jsonMeta.content.replace(/\s/g, '');
                // Decode UTF-8 string from Base64
                const binaryString = atob(cleanBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const decodedText = new TextDecoder('utf-8').decode(bytes);
                const data = robustParseLibraryJSON(decodedText);
                if (data && ((Array.isArray(data) && data.length > 0) || (typeof data === 'object' && Object.keys(data).length > 0))) {
                    try {
                        localStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(data));
                    } catch {
                        // Storage quota exceeded
                    }
                    return data;
                }
            }
        }
    } catch (apiErr) {
        console.warn('Secondary fetch from GitHub API failed:', apiErr);
    }

    // 3. Third Attempt: jsDelivr CDN
    try {
        const cdnUrl = `https://cdn.jsdelivr.net/gh/MashalMath/joschool-11-arabic-exams@JoSchool112010/Math11_Library.json?t=${timestamp}`;
        const cdnRes = await fetch(cdnUrl);
        if (cdnRes.ok) {
            const text = await cdnRes.text();
            const data = robustParseLibraryJSON(text);
            if (data && ((Array.isArray(data) && data.length > 0) || (typeof data === 'object' && Object.keys(data).length > 0))) {
                try {
                    localStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(data));
                } catch {
                    // Storage quota exceeded
                }
                return data;
            }
        }
    } catch (cdnErr) {
        console.warn('Third fetch from jsDelivr failed:', cdnErr);
    }

    return loadCachedLibraryData();
}

// Check if an item is valid (must have a title and a non-empty fileUrl)
export function isValidLibraryItem(item: any): boolean {
    return Boolean(
        item &&
        typeof item.title === 'string' &&
        item.title.trim().length > 0 &&
        typeof item.fileUrl === 'string' &&
        item.fileUrl.trim().length > 0
    );
}

// Normalizer for Arabic text matching
function normalizeArabic(str?: string): string {
    if (!str) return '';
    return str
        .trim()
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ');
}

// Helper to match category considering common Arabic naming variations
export function isCategoryMatch(filterCat?: string, groupCat?: string): boolean {
    if (!filterCat || filterCat === 'all' || filterCat === 'كل التصنيفات') return true;
    if (!groupCat) return false;

    const f = normalizeArabic(filterCat);
    const g = normalizeArabic(groupCat);
    if (f === g) return true;

    // Dosiat vs Malazem synonyms
    if ((f.includes('دوسي') || f.includes('ملازم') || f.includes('ملزم')) && 
        (g.includes('دوسي') || g.includes('ملازم') || g.includes('ملزم'))) {
        return true;
    }
    // Cards
    if (f.includes('بطاق') && g.includes('بطاق')) {
        return true;
    }
    // Books
    if ((f.includes('كتاب') || f.includes('كتب')) && (g.includes('كتاب') || g.includes('كتب'))) {
        return true;
    }
    // Worksheets
    if (f.includes('اوراق عمل') && g.includes('اوراق عمل')) {
        return true;
    }
    // Summaries
    if (f.includes('ملخص') && g.includes('ملخص')) {
        return true;
    }
    // Exams
    if ((f.includes('امتحان') || f.includes('اسئل')) && (g.includes('امتحان') || g.includes('اسئل'))) {
        return true;
    }
    return false;
}

// Helper to match semester flexibly (handles 'الفصل الأول', 'ف1', 'فصل أول', '1', 'كلا الفصلين')
export function isSemesterMatch(filterSem?: string, groupSem?: string): boolean {
    if (!filterSem || filterSem === 'all' || filterSem === 'both' || filterSem === 'كلا الفصلين' || filterSem === 'الفصلين') {
        return true;
    }
    if (!groupSem) return true; // If file doesn't specify semester, make it available across both

    const f = normalizeArabic(filterSem);
    const g = normalizeArabic(groupSem);
    if (f === g) return true;

    if (g.includes('كلا') || g.includes('فصلين') || g.includes('مشترك')) {
        return true;
    }

    const isFirstF = f.includes('اول') || f.includes('1') || f.includes('ف1');
    const isFirstG = g.includes('اول') || g.includes('1') || g.includes('ف1');
    if (isFirstF && isFirstG) return true;

    const isSecondF = f.includes('ثان') || f.includes('2') || f.includes('ف2');
    const isSecondG = g.includes('ثان') || g.includes('2') || g.includes('ف2');
    if (isSecondF && isSecondG) return true;

    return false;
}

// Helper to match subject flexibly (handles 'الرياضيات' vs 'رياضيات', etc.)
export function isSubjectMatch(filterSub?: string, groupSub?: string): boolean {
    if (!filterSub || filterSub === 'all' || filterSub === 'كل المواد') {
        return true;
    }
    if (!groupSub) return false;

    const s1 = normalizeArabic(filterSub);
    const s2 = normalizeArabic(groupSub);
    if (s1 === s2) return true;

    // Strip leading "ال" for root comparison
    const s1NoAl = s1.startsWith('ال') ? s1.slice(2) : s1;
    const s2NoAl = s2.startsWith('ال') ? s2.slice(2) : s2;
    if (s1NoAl === s2NoAl) return true;

    if (s1.includes(s2NoAl) || s2.includes(s1NoAl)) return true;

    return false;
}

// Recursive universal extractor: extracts all valid items from any JSON structure (groups, nested groups, or flat items)
export function extractValidLibraryItems(
    groupsOrData: any,
    filters?: {
        category?: string;
        subject?: string;
        semester?: string;
        onlyAvailable?: boolean;
    }
): ValidLibraryItem[] {
    const results: ValidLibraryItem[] = [];
    const seenKeys = new Set<string>();

    function collect(node: any, sub = '', sem = '', cat = '') {
        if (!node) return;

        if (Array.isArray(node)) {
            for (const el of node) {
                collect(el, sub, sem, cat);
            }
            return;
        }

        if (typeof node === 'object') {
            const curSub = (node.subject || sub || '').trim();
            const curSem = (node.semester || sem || '').trim();
            const curCat = (node.category || cat || '').trim();

            // Skip English items entirely since the subject is removed
            if (curSub.includes('انجليز') || curSub.includes('انكليز') || curSub.toLowerCase().includes('english')) {
                return;
            }

            // If this node represents a direct file item, it MUST have a valid title AND a valid non-empty fileUrl
            const hasTitle = typeof node.title === 'string' && node.title.trim().length > 0;
            const hasUrl = typeof node.fileUrl === 'string' && node.fileUrl.trim().length > 0;

            if (hasTitle && hasUrl) {
                const cleanTitle = node.title.trim();
                const cleanUrl = node.fileUrl.trim();

                const uniqueKey = `${curSub}|${curSem}|${curCat}|${cleanTitle}|${cleanUrl}`;
                if (!seenKeys.has(uniqueKey)) {
                    // Match against requested filters
                    if (isSubjectMatch(filters?.subject, curSub) &&
                        isSemesterMatch(filters?.semester, curSem) &&
                        isCategoryMatch(filters?.category, curCat)) {
                        
                        seenKeys.add(uniqueKey);
                        results.push({
                            id: node.id || `item-${results.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
                            title: cleanTitle,
                            type: inferResourceType(node.type, cleanUrl),
                            fileUrl: cleanUrl,
                            thumbnail: (node.thumbnail || '').trim(),
                            subject: curSub || 'الرياضيات',
                            semester: curSem || 'الفصل الأول',
                            category: curCat || 'الكتب المدرسية',
                            isAvailable: true
                        });
                    }
                }
            }

            // Recurse into common child arrays: items, files, resources, children
            if (Array.isArray(node.items)) collect(node.items, curSub, curSem, curCat);
            if (Array.isArray(node.files)) collect(node.files, curSub, curSem, curCat);
            if (Array.isArray(node.resources)) collect(node.resources, curSub, curSem, curCat);
            if (Array.isArray(node.children)) collect(node.children, curSub, curSem, curCat);
        }
    }

    collect(groupsOrData);
    return results;
}

// Extract distinct categories present in the data
export function getAvailableCategories(groupsOrData: any): string[] {
    const set = new Set<string>();
    const items = extractValidLibraryItems(groupsOrData);
    for (const item of items) {
        if (item.category) set.add(item.category);
    }
    return Array.from(set);
}

// Extract distinct subjects present in the data
export function getAvailableSubjects(groupsOrData: any): string[] {
    const set = new Set<string>();
    const items = extractValidLibraryItems(groupsOrData);
    for (const item of items) {
        if (item.subject) set.add(item.subject);
    }
    return Array.from(set);
}

// Extract distinct semesters present in the data
export function getAvailableSemesters(groupsOrData: any): string[] {
    const set = new Set<string>();
    const items = extractValidLibraryItems(groupsOrData);
    for (const item of items) {
        if (item.semester) set.add(item.semester);
    }
    return Array.from(set);
}

// Count valid items in a given category (optional subject/semester filters)
export function countValidItemsInCategory(
    groupsOrData: any,
    category: string,
    subject?: string,
    semester?: string
): number {
    return extractValidLibraryItems(groupsOrData, { category, subject, semester }).length;
}
