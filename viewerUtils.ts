/**
 * Utility functions for Google Docs Viewer and PDF document handling.
 */

/**
 * Returns clean direct URL or CDN fallback
 */
export function optimizePdfUrl(url: string): string {
    if (!url) return '';
    return url.trim();
}

/**
 * Formats a document/PDF URL for viewing via Google Docs Viewer or Google Drive.
 * @param url The target document URL
 * @param embedded If true, formats for iframe embedding with &embedded=true. If false, formats for opening in a browser tab.
 */
export function getGoogleViewerUrl(url: string, embedded = true): string {
    if (!url) return '';
    const trimmed = url.trim();

    // Google Drive Documents
    if (trimmed.includes('drive.google.com')) {
        let fileId = '';
        if (trimmed.includes('/file/d/')) {
            fileId = trimmed.split('/file/d/')[1]?.split('/')[0]?.split('?')[0] || '';
        } else if (trimmed.includes('id=')) {
            const match = trimmed.match(/[?&]id=([^&#]+)/);
            if (match && match[1]) fileId = match[1];
        }
        if (fileId) {
            return embedded
                ? `https://drive.google.com/file/d/${fileId}/preview`
                : `https://drive.google.com/file/d/${fileId}/view`;
        }
    }

    if (trimmed.includes('/preview')) {
        return embedded ? trimmed : trimmed.replace('/preview', '/view');
    }

    return embedded 
        ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(trimmed)}`
        : `https://docs.google.com/viewer?url=${encodeURIComponent(trimmed)}`;
}
