/**
 * Utility functions for Google Docs Viewer and PDF document handling.
 */

/**
 * Transforms raw.githubusercontent.com URLs into cdn.jsdelivr.net URLs
 * so that Google Docs Viewer and mobile browsers receive a valid Content-Type (application/pdf)
 * instead of GitHub's restrictive application/octet-stream.
 */
export function optimizePdfUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.includes('raw.githubusercontent.com')) {
        return trimmed.replace(
            /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/,
            'https://cdn.jsdelivr.net/gh/$1/$2@$3/$4'
        );
    }
    return trimmed;
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
            const match = trimmed.match(/[?&]id=([^&]+)/);
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

    // Optimize URL so Google Docs Viewer gets a proper application/pdf MIME type
    const optimized = optimizePdfUrl(trimmed);
    return `https://docs.google.com/viewer?url=${encodeURIComponent(optimized)}${embedded ? '&embedded=true' : ''}`;
}
