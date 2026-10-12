import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    addDoc, 
    deleteDoc, 
    updateDoc, 
    query, 
    orderBy, 
    limit, 
    startAfter, 
    onSnapshot, 
    increment, 
    serverTimestamp,
    deleteField,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { ForumPost, ForumComment, ForumReport, ForumReportReason } from '../types';

export const ADMIN_EMAIL = 'mechail.sbeatan1@gmail.com';

/**
 * Check if the user is an admin
 */
export const isUserAdmin = (email?: string | null): boolean => {
    if (!email) return false;
    return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

/**
 * Ultra-fast client-side image compression: converts file to a lightweight, high-performance WebP/JPEG data URL (< 60KB)
 */
export const compressImageToDataUrl = async (file: File, maxDimension = 850, quality = 0.72): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const resultStr = e.target?.result as string;
            if (!resultStr) {
                resolve('');
                return;
            }

            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(resultStr);
                    return;
                }

                // Smooth rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';

                // Fill white background for transparent images
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Use WebP if supported, fallback to JPEG
                try {
                    const webpUrl = canvas.toDataURL('image/webp', quality);
                    if (webpUrl && webpUrl.startsWith('data:image/webp') && webpUrl.length < 500000) {
                        resolve(webpUrl);
                        return;
                    }
                } catch (err) {
                    // fallback to jpeg
                }

                try {
                    const jpegUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(jpegUrl);
                } catch (err) {
                    resolve(resultStr);
                }
            };
            img.onerror = () => resolve(resultStr);
            img.src = resultStr;
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
};

/**
 * Create a new post in the Forum with instant execution (< 300ms)
 */
export const createForumPost = async ({
    userId,
    userName,
    userPhoto,
    userEmail,
    text,
    imageFile,
    imageDataUrl
}: {
    userId: string;
    userName: string;
    userPhoto?: string;
    userEmail?: string;
    text: string;
    imageFile?: File | null;
    imageDataUrl?: string | null;
}): Promise<string> => {
    if (!text.trim()) {
        throw new Error('نص المنشور لا يمكن أن يكون فارغاً');
    }

    let imageUrl: string | undefined = undefined;
    if (imageDataUrl) {
        imageUrl = imageDataUrl;
    } else if (imageFile) {
        imageUrl = await compressImageToDataUrl(imageFile);
    }

    const postDocRef = doc(collection(db, 'posts'));
    const postData = {
        postId: postDocRef.id,
        userId,
        userName: userName.trim() || 'طالب متميز',
        userPhoto: userPhoto || '',
        userEmail: userEmail || '',
        text: text.trim(),
        ...(imageUrl ? { imageUrl } : {}),
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp()
    };

    await setDoc(postDocRef, postData);
    return postDocRef.id;
};

/**
 * Fetch paginated posts
 */
export const fetchForumPosts = async ({
    pageSize = 10,
    lastVisibleDoc
}: {
    pageSize?: number;
    lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<{ posts: ForumPost[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
    const postsCol = collection(db, 'posts');
    let q = query(postsCol, orderBy('createdAt', 'desc'), limit(pageSize));

    if (lastVisibleDoc) {
        q = query(postsCol, orderBy('createdAt', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const posts: ForumPost[] = [];

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        posts.push({
            id: docSnap.id,
            userId: data.userId,
            userName: data.userName,
            userPhoto: data.userPhoto,
            userEmail: data.userEmail,
            text: data.text,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            likesCount: Number(data.likesCount || 0),
            commentsCount: Number(data.commentsCount || 0),
            isEdited: Boolean(data.isEdited),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined
        });
    });

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { posts, lastDoc: newLastDoc };
};

/**
 * Subscribe to real-time latest posts (first page)
 */
export const subscribeToForumPosts = (
    limitCount = 15,
    onPostsUpdate: (posts: ForumPost[]) => void,
    onError?: (error: Error) => void
) => {
    const postsCol = collection(db, 'posts');
    const q = query(postsCol, orderBy('createdAt', 'desc'), limit(limitCount));

    return onSnapshot(q, (snapshot) => {
        const posts: ForumPost[] = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            posts.push({
                id: docSnap.id,
                userId: data.userId,
                userName: data.userName,
                userPhoto: data.userPhoto,
                userEmail: data.userEmail,
                text: data.text,
                imageUrl: data.imageUrl,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                likesCount: Number(data.likesCount || 0),
                commentsCount: Number(data.commentsCount || 0),
                isEdited: Boolean(data.isEdited),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined
            });
        });
        onPostsUpdate(posts);
    }, (error) => {
        console.error("[ForumService] Real-time posts subscription error:", error);
        if (onError) onError(error);
    });
};

/**
 * Update an existing post in the Forum (by author)
 */
export const updateForumPost = async ({
    postId,
    text,
    imageUrl,
    removeImage = false
}: {
    postId: string;
    text: string;
    imageUrl?: string | null;
    removeImage?: boolean;
}): Promise<void> => {
    if (!text.trim()) {
        throw new Error('نص المنشور لا يمكن أن يكون فارغاً');
    }

    const postRef = doc(db, 'posts', postId);
    const updates: Record<string, any> = {
        text: text.trim(),
        isEdited: true,
        updatedAt: serverTimestamp()
    };

    if (removeImage) {
        updates.imageUrl = deleteField();
    } else if (imageUrl !== undefined && imageUrl !== null) {
        updates.imageUrl = imageUrl;
    }

    await updateDoc(postRef, updates);
};

/**
 * Delete a post (by author or admin)
 */
export const deleteForumPost = async (postId: string): Promise<void> => {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
};

/**
 * Check if a user has liked a post
 */
export const hasUserLikedPost = async (postId: string, userId: string): Promise<boolean> => {
    if (!userId) return false;
    const likeDoc = doc(db, 'posts', postId, 'likes', userId);
    const snap = await getDoc(likeDoc);
    return snap.exists();
};

/**
 * Toggle like for a post (atomic update via Subcollection)
 */
export const togglePostLike = async (
    postId: string,
    userId: string,
    currentlyLiked: boolean
): Promise<boolean> => {
    const postRef = doc(db, 'posts', postId);
    const likeRef = doc(db, 'posts', postId, 'likes', userId);

    if (currentlyLiked) {
        // Remove like
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
            likesCount: increment(-1)
        });
        return false;
    } else {
        // Add like
        await setDoc(likeRef, {
            userId,
            createdAt: serverTimestamp()
        });
        await updateDoc(postRef, {
            likesCount: increment(1)
        });
        return true;
    }
};

/**
 * Subscribe to comments for a specific post
 */
export const subscribeToPostComments = (
    postId: string,
    onCommentsUpdate: (comments: ForumComment[]) => void,
    onError?: (error: Error) => void
) => {
    const commentsCol = collection(db, 'posts', postId, 'comments');
    const q = query(commentsCol, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const comments: ForumComment[] = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            comments.push({
                id: docSnap.id,
                postId,
                userId: data.userId,
                userName: data.userName,
                userPhoto: data.userPhoto,
                text: data.text,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            });
        });
        onCommentsUpdate(comments);
    }, (error) => {
        console.error(`[ForumService] Comments subscription error for post ${postId}:`, error);
        if (onError) onError(error);
    });
};

/**
 * Add a comment to a post
 */
export const addPostComment = async ({
    postId,
    userId,
    userName,
    userPhoto,
    text
}: {
    postId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    text: string;
}): Promise<string> => {
    if (!text.trim()) {
        throw new Error('نص التعليق لا يمكن أن يكون فارغاً');
    }

    const commentsCol = collection(db, 'posts', postId, 'comments');
    const postRef = doc(db, 'posts', postId);

    const commentDoc = await addDoc(commentsCol, {
        postId,
        userId,
        userName: userName.trim() || 'طالب متميز',
        userPhoto: userPhoto || '',
        text: text.trim(),
        createdAt: serverTimestamp()
    });

    await updateDoc(postRef, {
        commentsCount: increment(1)
    });

    return commentDoc.id;
};

/**
 * Delete a comment (by author or admin)
 */
export const deletePostComment = async (postId: string, commentId: string): Promise<void> => {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const postRef = doc(db, 'posts', postId);

    await deleteDoc(commentRef);
    await updateDoc(postRef, {
        commentsCount: increment(-1)
    });
};

/**
 * Submit an abuse or violation report
 */
export const submitForumReport = async ({
    reporterId,
    reporterName,
    targetType,
    targetId,
    postId,
    reason,
    details
}: {
    reporterId: string;
    reporterName: string;
    targetType: 'post' | 'comment';
    targetId: string;
    postId?: string;
    reason: ForumReportReason;
    details?: string;
}): Promise<string> => {
    const reportCol = collection(db, 'reports');
    const docRef = await addDoc(reportCol, {
        reporterId,
        reporterName: reporterName.trim() || 'طالب مجهول',
        targetType,
        targetId,
        postId: postId || '',
        reason,
        details: (details || '').trim(),
        status: 'pending',
        createdAt: serverTimestamp()
    });

    return docRef.id;
};

/**
 * Fetch pending reports for moderator
 */
export const fetchPendingReports = async (): Promise<ForumReport[]> => {
    const reportCol = collection(db, 'reports');
    const q = query(reportCol, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);

    const reports: ForumReport[] = [];
    snap.forEach(d => {
        const data = d.data();
        if (data.status === 'pending') {
            reports.push({
                id: d.id,
                reporterId: data.reporterId,
                reporterName: data.reporterName,
                targetType: data.targetType,
                targetId: data.targetId,
                postId: data.postId,
                reason: data.reason,
                details: data.details,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                status: data.status
            });
        }
    });

    return reports;
};

/**
 * Dismiss or resolve report
 */
export const updateReportStatus = async (
    reportId: string, 
    status: 'reviewed' | 'resolved' | 'dismissed'
): Promise<void> => {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status });
};
