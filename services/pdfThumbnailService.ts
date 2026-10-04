/**
 * Service to dynamically generate and cache first-page cover thumbnails for PDF files.
 * Uses pdfjs-dist and canvas rendering, with a two-tier cache (in-memory + IndexedDB).
 */

import { optimizePdfUrl } from '../viewerUtils';

const DB_NAME = 'JoSchoolPdfCoversDB';
const STORE_NAME = 'pdf_covers_v1';
const DB_VERSION = 1;

// Level 1: In-memory cache for instantaneous zero-latency lookups
const memoryCache = new Map<string, string>();
// Track URLs that permanently failed or have no valid PDF structure
const failedUrls = new Set<string>();
// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<string | null>>();

// Dynamic loader for pdfjs-dist to optimize initial bundle size
let pdfjsLibInstance: typeof import('pdfjs-dist') | null = null;
let pdfjsLoadingPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function getPdfJsLib(): Promise<typeof import('pdfjs-dist')> {
    if (pdfjsLibInstance) return pdfjsLibInstance;
    if (!pdfjsLoadingPromise) {
        pdfjsLoadingPromise = import('pdfjs-dist').then((lib) => {
            if (typeof window !== 'undefined' && lib.GlobalWorkerOptions) {
                if (!lib.GlobalWorkerOptions.workerSrc) {
                    lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';
                }
            }
            pdfjsLibInstance = lib;
            return lib;
        });
    }
    return pdfjsLoadingPromise;
}

// Simple concurrency queue to ensure smooth UI performance
let activeRenderCount = 0;
const MAX_CONCURRENT_RENDERS = 2;
const renderQueue: Array<() => void> = [];

function enqueueRender<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const execute = async () => {
            activeRenderCount++;
            try {
                const res = await task();
                resolve(res);
            } catch (err) {
                reject(err);
            } finally {
                activeRenderCount--;
                if (renderQueue.length > 0) {
                    const next = renderQueue.shift();
                    if (next) next();
                }
            }
        };

        if (activeRenderCount < MAX_CONCURRENT_RENDERS) {
            execute();
        } else {
            renderQueue.push(execute);
        }
    });
}

/**
 * Open IndexedDB store for persistent thumbnail caching across sessions
 */
function openCoversDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        try {
            const req = window.indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

/**
 * Retrieve cached thumbnail data URL from IndexedDB
 */
async function getFromIndexedDB(key: string): Promise<string | null> {
    try {
        const db = await openCoversDB();
        if (!db) return null;
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(key);
                req.onsuccess = () => {
                    const result = req.result as string | undefined;
                    resolve(result || null);
                };
                req.onerror = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
    } catch {
        return null;
    }
}

/**
 * Save rendered thumbnail data URL into IndexedDB
 */
async function saveToIndexedDB(key: string, dataUrl: string): Promise<void> {
    try {
        const db = await openCoversDB();
        if (!db) return;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(dataUrl, key);
    } catch {
        // Silently ignore storage quota or transaction errors
    }
}

/**
 * Normalizes URL keys for cache lookup
 */
function normalizeKey(url: string): string {
    return url.trim().replace(/^https?:\/\//i, '').replace(/[#?].*$/, '');
}

/**
 * Renders the first page of a PDF document to an optimized JPEG data URL
 */
async function renderFirstPageToDataUrl(pdfDataOrUrl: string | Uint8Array): Promise<string | null> {
    let pdfDoc: any = null;
    try {
        const pdfjsLib = await getPdfJsLib();

        const loadingTask = typeof pdfDataOrUrl === 'string'
            ? pdfjsLib.getDocument({
                url: pdfDataOrUrl,
                cMapUrl: '/pdfjs/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: '/pdfjs/standard_fonts/',
            })
            : pdfjsLib.getDocument({
                data: pdfDataOrUrl,
                cMapUrl: '/pdfjs/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: '/pdfjs/standard_fonts/',
            });

        // Set a 12s safety timeout on loading task
        const timeoutPromise = new Promise<null>((_, reject) => {
            setTimeout(() => reject(new Error('PDF loading timeout')), 12000);
        });

        pdfDoc = await Promise.race([loadingTask.promise, timeoutPromise]);
        if (!pdfDoc || pdfDoc.numPages < 1) return null;

        const page = await pdfDoc.getPage(1);
        const originalViewport = page.getViewport({ scale: 1 });

        // Target cover width around 240px for crisp retina display on 56px-70px thumbnail cards
        const targetWidth = 240;
        const scale = targetWidth / originalViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
            page.cleanup();
            return null;
        }

        // Fill background with white to handle transparent PDF pages cleanly
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Produce a compressed JPEG thumbnail
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Free memory resources
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;

        return dataUrl;
    } catch (err) {
        console.warn('PDF thumbnail generation failed for source:', err);
        return null;
    } finally {
        if (pdfDoc) {
            try {
                pdfDoc.cleanup();
                pdfDoc.destroy();
            } catch {
                // Ignore cleanup errors
            }
        }
    }
}

/**
 * Fetches PDF bytes with timeout and fallback
 */
async function fetchPdfBytes(url: string, timeoutMs = 15000): Promise<Uint8Array | null> {
    const urlsToTry = [
        url,
        optimizePdfUrl(url),
    ];

    // Deduplicate
    const uniqueUrls = Array.from(new Set(urlsToTry.filter(Boolean)));

    for (const targetUrl of uniqueUrls) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            const res = await fetch(targetUrl, {
                signal: controller.signal,
                mode: 'cors',
            });
            clearTimeout(timer);

            if (res.ok) {
                const buffer = await res.arrayBuffer();
                if (buffer && buffer.byteLength > 100) {
                    return new Uint8Array(buffer);
                }
            }
        } catch {
            // Try next url candidate
        }
    }
    return null;
}

/**
 * Main function: get or generate the first page cover thumbnail for a PDF URL
 */
export async function getPdfCoverThumbnail(pdfUrl: string): Promise<string | null> {
    if (!pdfUrl || !pdfUrl.trim()) return null;
    const trimmedUrl = pdfUrl.trim();
    const cacheKey = normalizeKey(trimmedUrl);

    // 1. In-memory cache hit
    if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey) || null;
    }

    // 2. Previously failed
    if (failedUrls.has(cacheKey)) {
        return null;
    }

    // 3. In-flight request deduplication
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey)!;
    }

    const task = (async (): Promise<string | null> => {
        // Check IndexedDB
        const stored = await getFromIndexedDB(cacheKey);
        if (stored) {
            memoryCache.set(cacheKey, stored);
            return stored;
        }

        // Generate via queue
        return enqueueRender(async () => {
            // Check again in case another job filled it while in queue
            if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey)!;

            let result: string | null;

            // First attempt: direct URL via PDF.js (uses Range requests if supported)
            try {
                result = await renderFirstPageToDataUrl(trimmedUrl);
            } catch {
                result = null;
            }

            // Fallback attempt: fetch buffer directly with CDN/optimize fallback
            if (!result) {
                const bytes = await fetchPdfBytes(trimmedUrl);
                if (bytes) {
                    result = await renderFirstPageToDataUrl(bytes);
                }
            }

            if (result) {
                memoryCache.set(cacheKey, result);
                await saveToIndexedDB(cacheKey, result);
                return result;
            } else {
                failedUrls.add(cacheKey);
                return null;
            }
        });
    })();

    inFlightRequests.set(cacheKey, task);
    try {
        const result = await task;
        return result;
    } finally {
        inFlightRequests.delete(cacheKey);
    }
}
