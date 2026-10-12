import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, 
    Heart, 
    Send, 
    Image as ImageIcon, 
    X, 
    Trash2, 
    Flag, 
    RefreshCw, 
    ChevronRight, 
    ShieldAlert, 
    CheckCircle2, 
    Loader2, 
    AlertCircle, 
    User as UserIcon,
    MoreVertical,
    Sparkles,
    Check,
    Pencil
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ForumPost, ForumComment, ForumReportReason } from './types';
import { 
    createForumPost, 
    updateForumPost,
    fetchForumPosts, 
    subscribeToForumPosts, 
    deleteForumPost, 
    hasUserLikedPost, 
    togglePostLike, 
    subscribeToPostComments, 
    addPostComment, 
    deletePostComment, 
    submitForumReport,
    isUserAdmin,
    fetchPendingReports,
    updateReportStatus,
    compressImageToDataUrl,
    ADMIN_EMAIL
} from './services/forumService';

interface ForumPageProps {
    user: User | null;
    userProfileName?: string;
    onBack: () => void;
}

export const ForumPage: React.FC<ForumPageProps> = ({
    user,
    userProfileName,
    onBack
}) => {
    // Current user details
    const currentUserId = user?.uid || '';
    const currentUserName = userProfileName || user?.displayName || user?.email?.split('@')[0] || 'طالب متميز';
    const currentUserPhoto = user?.photoURL || undefined;
    const currentUserEmail = user?.email || undefined;
    const isAdmin = isUserAdmin(user?.email);

    // Feed state
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

    // Create post state
    const [postText, setPostText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [preparedImageDataUrl, setPreparedImageDataUrl] = useState<string | null>(null);
    const [isPreparingImage, setIsPreparingImage] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [postError, setPostError] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Active comments state
    const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
    const [commentsMap, setCommentsMap] = useState<{ [postId: string]: ForumComment[] }>({});
    const [commentInputMap, setCommentInputMap] = useState<{ [postId: string]: string }>({});
    const [submittingCommentPostId, setSubmittingCommentPostId] = useState<string | null>(null);

    // Report modal state
    const [reportModal, setReportModal] = useState<{
        isOpen: boolean;
        targetType: 'post' | 'comment';
        targetId: string;
        postId?: string;
    }>({
        isOpen: false,
        targetType: 'post',
        targetId: ''
    });
    const [reportReason, setReportReason] = useState<ForumReportReason>('محتوى غير مناسب');
    const [reportDetails, setReportDetails] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportSuccessMessage, setReportSuccessMessage] = useState(false);

    // Post menu state
    const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

    // Edit post state
    interface EditingPostState {
        postId: string;
        text: string;
        existingImageUrl?: string;
        newImageDataUrl?: string | null;
        removeImage: boolean;
    }
    const [editingPost, setEditingPost] = useState<EditingPostState | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isPreparingEditImage, setIsPreparingEditImage] = useState(false);
    const [editError, setEditError] = useState('');
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Delete Confirmation Modal state
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
        isOpen: boolean;
        type: 'post' | 'comment';
        targetId: string;
        postId?: string;
    } | null>(null);
    const [isDeletingItem, setIsDeletingItem] = useState(false);

    // Toast message state
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(prev => prev === msg ? null : prev);
        }, 3200);
    }, []);

    // Image viewer modal
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

    // Admin panel modal
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [adminReports, setAdminReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Close options menu when clicking/touching anywhere outside
    useEffect(() => {
        if (!activeMenuPostId) return;

        const handleOutsideDismiss = (e: Event) => {
            const target = e.target as HTMLElement | null;
            if (target && target.closest('[data-post-menu]')) {
                return;
            }
            setActiveMenuPostId(null);
        };

        const events = ['pointerdown', 'touchstart', 'mousedown'];
        events.forEach(eventName => {
            document.addEventListener(eventName, handleOutsideDismiss, { capture: true });
        });

        return () => {
            events.forEach(eventName => {
                document.removeEventListener(eventName, handleOutsideDismiss, { capture: true });
            });
        };
    }, [activeMenuPostId]);

    // Subscribe to real-time posts
    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToForumPosts(
            25,
            (newPosts) => {
                setPosts(newPosts);
                setLoading(false);
                setRefreshing(false);
            },
            (err) => {
                console.error("[ForumPage] Error fetching posts:", err);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Check likes for current user when posts or user changes
    useEffect(() => {
        if (!currentUserId || posts.length === 0) return;

        let isMounted = true;
        const checkLikes = async () => {
            const likedSet = new Set<string>();
            await Promise.all(
                posts.slice(0, 20).map(async (post) => {
                    const liked = await hasUserLikedPost(post.id, currentUserId);
                    if (liked) likedSet.add(post.id);
                })
            );
            if (isMounted) {
                setLikedPostIds(likedSet);
            }
        };

        checkLikes();
        return () => {
            isMounted = false;
        };
    }, [currentUserId, posts]);

    // Handle manual refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await fetchForumPosts({ pageSize: 25 });
            setPosts(res.posts);
        } catch (e) {
            console.error("Refresh failed:", e);
        } finally {
            setRefreshing(false);
        }
    };

    // Handle Image Selection with instant high-speed compression
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setPostError('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
            return;
        }

        setPostError('');
        setSelectedImage(file);
        setIsPreparingImage(true);

        try {
            const compressedDataUrl = await compressImageToDataUrl(file);
            setPreparedImageDataUrl(compressedDataUrl);
            setImagePreviewUrl(compressedDataUrl);
        } catch (err) {
            console.error("Image compression error:", err);
            const reader = new FileReader();
            reader.onload = (re) => {
                const res = re.target?.result as string;
                setPreparedImageDataUrl(res);
                setImagePreviewUrl(res);
            };
            reader.readAsDataURL(file);
        } finally {
            setIsPreparingImage(false);
        }
    };

    const handleClearSelectedImage = () => {
        setSelectedImage(null);
        setPreparedImageDataUrl(null);
        setImagePreviewUrl(null);
        setIsPreparingImage(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Create a new post with instant optimistic publishing (< 300ms)
    const handleCreatePost = async () => {
        if (!postText.trim()) {
            setPostError('يرجى كتابة نص المنشور');
            return;
        }

        if (!currentUserId) {
            setPostError('يجب تسجيل الدخول لنشر مشاركة');
            return;
        }

        if (isPreparingImage) {
            setPostError('يرجى الانتظار لحين اكتمال تجهيز الصورة');
            return;
        }

        const textToPublish = postText.trim();
        const imageToPublish = preparedImageDataUrl || undefined;

        setIsPosting(true);
        setPostError('');

        // 1. Optimistic insertion - post appears on the student's feed immediately!
        const tempId = 'temp-' + Date.now();
        const optimisticPost: ForumPost = {
            id: tempId,
            userId: currentUserId,
            userName: currentUserName,
            userPhoto: currentUserPhoto,
            userEmail: currentUserEmail,
            text: textToPublish,
            imageUrl: imageToPublish,
            createdAt: new Date().toISOString(),
            likesCount: 0,
            commentsCount: 0
        };

        setPosts(prev => [optimisticPost, ...prev]);

        // 2. Immediately close modal and reset form so the user doesn't wait
        setPostText('');
        handleClearSelectedImage();
        setIsCreateOpen(false);
        setIsPosting(false);

        // 3. Persist to Firestore in the background with zero UI blocking
        try {
            await createForumPost({
                userId: currentUserId,
                userName: currentUserName,
                userPhoto: currentUserPhoto,
                userEmail: currentUserEmail,
                text: textToPublish,
                imageDataUrl: imageToPublish
            });
        } catch (err: any) {
            console.error("Failed to create post:", err);
            // Revert optimistic post if write fails
            setPosts(prev => prev.filter(p => p.id !== tempId));
            showToast('تعذر نشر المنشور: ' + (err.message || 'فشل الاتصال'));
        }
    };

    // Handle Like Toggle
    const handleToggleLike = async (postId: string) => {
        if (!currentUserId) return;

        const isCurrentlyLiked = likedPostIds.has(postId);

        // Optimistic UI update
        setLikedPostIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyLiked) {
                next.delete(postId);
            } else {
                next.add(postId);
            }
            return next;
        });

        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    likesCount: Math.max(0, p.likesCount + (isCurrentlyLiked ? -1 : 1))
                };
            }
            return p;
        }));

        try {
            await togglePostLike(postId, currentUserId, isCurrentlyLiked);
        } catch (e) {
            console.error("Failed to toggle like:", e);
            // Revert on failure
            setLikedPostIds(prev => {
                const next = new Set(prev);
                if (isCurrentlyLiked) {
                    next.add(postId);
                } else {
                    next.delete(postId);
                }
                return next;
            });
        }
    };

    // Toggle comments visibility
    const handleToggleComments = (postId: string) => {
        if (expandedCommentsPostId === postId) {
            setExpandedCommentsPostId(null);
            return;
        }
        setExpandedCommentsPostId(postId);
    };

    // Subscribe to comments for the expanded post
    useEffect(() => {
        if (!expandedCommentsPostId) return;

        const postId = expandedCommentsPostId;
        const unsubscribe = subscribeToPostComments(
            postId,
            (comments) => {
                setCommentsMap(prev => ({
                    ...prev,
                    [postId]: comments
                }));
            },
            (err) => console.error(`Error loading comments for post ${postId}:`, err)
        );

        return () => unsubscribe();
    }, [expandedCommentsPostId]);

    // Handle Add Comment
    const handleAddComment = async (postId: string) => {
        const text = (commentInputMap[postId] || '').trim();
        if (!text || !currentUserId) return;

        setSubmittingCommentPostId(postId);

        try {
            await addPostComment({
                postId,
                userId: currentUserId,
                userName: currentUserName,
                userPhoto: currentUserPhoto,
                text
            });

            // Clear input for this post
            setCommentInputMap(prev => ({ ...prev, [postId]: '' }));

            // Update local comment count optimistically
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
        } catch (err) {
            console.error("Failed to add comment:", err);
        } finally {
            setSubmittingCommentPostId(null);
        }
    };

    // Handle Starting Post Edit
    const handleStartEdit = (post: ForumPost) => {
        setEditingPost({
            postId: post.id,
            text: post.text,
            existingImageUrl: post.imageUrl,
            newImageDataUrl: null,
            removeImage: false
        });
        setEditError('');
        setActiveMenuPostId(null);
    };

    const handleCancelEdit = () => {
        setEditingPost(null);
        setEditError('');
        setIsSavingEdit(false);
        setIsPreparingEditImage(false);
    };

    const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingPost) return;

        if (!file.type.startsWith('image/')) {
            setEditError('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP)');
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            setEditError('حجم الصورة كبير جداً، يرجى اختيار صورة أصغر من 8MB');
            return;
        }

        setEditError('');
        setIsPreparingEditImage(true);

        try {
            const compressedDataUrl = await compressImageToDataUrl(file);
            setEditingPost(prev => prev ? {
                ...prev,
                newImageDataUrl: compressedDataUrl,
                removeImage: false
            } : null);
        } catch (err) {
            console.error("Edit image compression error:", err);
            const reader = new FileReader();
            reader.onload = (re) => {
                const res = re.target?.result as string;
                setEditingPost(prev => prev ? {
                    ...prev,
                    newImageDataUrl: res,
                    removeImage: false
                } : null);
            };
            reader.readAsDataURL(file);
        } finally {
            setIsPreparingEditImage(false);
        }
    };

    const handleRemoveEditImage = () => {
        if (!editingPost) return;
        setEditingPost(prev => prev ? {
            ...prev,
            newImageDataUrl: null,
            removeImage: true
        } : null);
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    const handleRestoreOriginalImage = () => {
        if (!editingPost) return;
        setEditingPost(prev => prev ? {
            ...prev,
            newImageDataUrl: null,
            removeImage: false
        } : null);
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    const handleSaveEdit = async () => {
        if (!editingPost) return;

        const trimmedText = editingPost.text.trim();
        if (!trimmedText) {
            setEditError('لا يمكن أن يكون نص المنشور فارغاً');
            return;
        }

        if (isPreparingEditImage) {
            setEditError('يرجى الانتظار لحين اكتمال تجهيز الصورة');
            return;
        }

        setIsSavingEdit(true);
        setEditError('');

        const postId = editingPost.postId;
        const finalImageUrl = editingPost.newImageDataUrl 
            ? editingPost.newImageDataUrl 
            : (editingPost.removeImage ? undefined : editingPost.existingImageUrl);

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    text: trimmedText,
                    imageUrl: finalImageUrl,
                    isEdited: true,
                    updatedAt: new Date().toISOString()
                };
            }
            return p;
        }));

        const postToUpdate = { ...editingPost };
        setEditingPost(null);
        setIsSavingEdit(false);

        try {
            await updateForumPost({
                postId: postToUpdate.postId,
                text: trimmedText,
                imageUrl: postToUpdate.newImageDataUrl !== null ? postToUpdate.newImageDataUrl : (postToUpdate.removeImage ? null : undefined),
                removeImage: postToUpdate.removeImage
            });
            showToast('تم حفظ تعديلات المنشور بنجاح');
        } catch (err: any) {
            console.error("Failed to update post:", err);
            showToast('تعذر حفظ التعديل: ' + (err.message || 'حدث خطأ في الاتصال'));
        }
    };

    // Handle Request Delete Post
    const requestDeletePost = (postId: string) => {
        setActiveMenuPostId(null);
        setDeleteConfirmModal({
            isOpen: true,
            type: 'post',
            targetId: postId
        });
    };

    // Handle Request Delete Comment
    const requestDeleteComment = (postId: string, commentId: string) => {
        setDeleteConfirmModal({
            isOpen: true,
            type: 'comment',
            targetId: commentId,
            postId
        });
    };

    // Execute Confirmed Delete
    const handleConfirmDelete = async () => {
        if (!deleteConfirmModal) return;
        setIsDeletingItem(true);
        const { type, targetId, postId } = deleteConfirmModal;

        try {
            if (type === 'post') {
                await deleteForumPost(targetId);
                setPosts(prev => prev.filter(p => p.id !== targetId));
                showToast('تم حذف المنشور بنجاح');
            } else if (type === 'comment' && postId) {
                await deletePostComment(postId, targetId);
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
                setCommentsMap(prev => {
                    const list = prev[postId] || [];
                    return { ...prev, [postId]: list.filter(c => c.id !== targetId) };
                });
                showToast('تم حذف التعليق بنجاح');
            }
        } catch (err: any) {
            console.error("Failed to delete:", err);
            showToast('تعذر الحذف: ' + (err.message || 'حدث خطأ غير متوقع'));
        } finally {
            setIsDeletingItem(false);
            setDeleteConfirmModal(null);
        }
    };

    // Handle Submit Report
    const handleSubmitReport = async () => {
        if (!currentUserId || !reportModal.targetId) return;

        setIsSubmittingReport(true);
        try {
            await submitForumReport({
                reporterId: currentUserId,
                reporterName: currentUserName,
                targetType: reportModal.targetType,
                targetId: reportModal.targetId,
                postId: reportModal.postId,
                reason: reportReason,
                details: reportDetails
            });

            setReportSuccessMessage(true);
            setTimeout(() => {
                setReportSuccessMessage(false);
                setReportModal({ isOpen: false, targetType: 'post', targetId: '' });
                setReportDetails('');
            }, 1800);
        } catch (err) {
            console.error("Failed to submit report:", err);
            showToast('تعذر إرسال البلاغ. يرجى المحاولة لاحقاً.');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    // Load reports for admin
    const handleOpenAdminPanel = async () => {
        setShowAdminPanel(true);
        setLoadingReports(true);
        try {
            const data = await fetchPendingReports();
            setAdminReports(data);
        } catch (e) {
            console.error("Failed to load admin reports:", e);
        } finally {
            setLoadingReports(false);
        }
    };

    // Format human-friendly relative time in Arabic
    const formatArabicTime = (isoString?: string) => {
        if (!isoString) return 'الآن';
        const date = new Date(isoString);
        const diffMs = Date.now() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `منذ ${diffDays} أيام`;
        return date.toLocaleDateString('ar-JO', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans" dir="rtl">
            {/* Global Screen Backdrop for Active Post Menu */}
            {activeMenuPostId && (
                <div 
                    className="fixed inset-0 z-30 bg-transparent cursor-default"
                    onClick={() => setActiveMenuPostId(null)}
                    onTouchStart={() => setActiveMenuPostId(null)}
                    onPointerDown={() => setActiveMenuPostId(null)}
                />
            )}

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 -mr-1.5 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors active:scale-95 cursor-pointer"
                            title="العودة للرئيسية"
                        >
                            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-black text-slate-900 font-jordan">
                                    منتدى الطلاب
                                </h1>
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                                    مجتمع تفاعلي
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold truncate">
                                شارك أسئلتك، أفكارك، وناقش المواد مع زملائك
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Admin Badge/Button */}
                        {isAdmin && (
                            <button
                                onClick={handleOpenAdminPanel}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                title="لوحة البلاغات والإدارة"
                            >
                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                                <span className="hidden sm:inline">الإشراف</span>
                            </button>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 cursor-pointer border border-slate-200"
                            title="تحديث المنشورات"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
                {/* Create Post Prompt / Trigger Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 transition-all hover:border-slate-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs border border-amber-600/20">
                            {currentUserPhoto ? (
                                <img src={currentUserPhoto} alt={currentUserName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                currentUserName.charAt(0) || <UserIcon className="w-5 h-5" />
                            )}
                        </div>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex-1 text-right py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 rounded-xl font-bold text-sm transition-all cursor-pointer border border-slate-200/60"
                        >
                            بماذا تفكّر يا {currentUserName}؟ شارك زملاءك...
                        </button>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                        <button
                            onClick={() => {
                                setIsCreateOpen(true);
                                setTimeout(() => fileInputRef.current?.click(), 100);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-lg text-emerald-600 transition-colors cursor-pointer"
                        >
                            <ImageIcon className="w-4 h-4" />
                            <span>إضافة صورة للمنشور</span>
                        </button>
                        <span className="text-[11px] text-slate-400">
                            احترام الزملاء واجب في مجتمعنا التعليمي
                        </span>
                    </div>
                </div>

                {/* Create Post Expanded Modal */}
                <AnimatePresence>
                    {isCreateOpen && (
                        <motion.div 
                            key="create-post-modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
                        >
                            <motion.div
                                key="create-post-modal-card"
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                {/* Modal Header */}
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <h2 className="font-black text-slate-800 text-base">إنشاء منشور جديد</h2>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateOpen(false)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                                    {/* Author Profile */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black text-sm shrink-0">
                                            {currentUserPhoto ? (
                                                <img src={currentUserPhoto} alt={currentUserName} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                currentUserName.charAt(0) || <UserIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-slate-900">{currentUserName}</p>
                                            <span className="text-[11px] text-slate-400 font-bold">عام • لجميع طلاب المنصة</span>
                                        </div>
                                    </div>

                                    {/* Text Area */}
                                    <textarea
                                        value={postText}
                                        onChange={(e) => setPostText(e.target.value)}
                                        placeholder="اكتب سؤالك، ملخصك، أو موضوع النقاش هنا..."
                                        maxLength={2500}
                                        rows={5}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none leading-relaxed"
                                        autoFocus
                                    />

                                    {/* Image Preview if selected */}
                                    {isPreparingImage ? (
                                        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-5 flex flex-col items-center justify-center text-center">
                                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-2" />
                                            <p className="text-xs font-black text-amber-800">جاري معالجة وتحسين الصورة لتسريع النشر...</p>
                                        </div>
                                    ) : imagePreviewUrl ? (
                                        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-60 flex items-center justify-center p-1">
                                            <img
                                                src={imagePreviewUrl}
                                                alt="صورة المنشور"
                                                className="w-full h-auto max-h-56 object-contain rounded-lg shadow-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleClearSelectedImage}
                                                className="absolute top-2 left-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer shadow-md"
                                                title="إزالة الصورة"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : null}

                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                    />

                                    {/* Error Banner */}
                                    {postError && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                            <span>{postError}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 sm:px-3 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                                        <span>{selectedImage ? 'تغيير الصورة' : 'إرفاق صورة'}</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateOpen(false)}
                                            className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCreatePost}
                                            disabled={isPosting || isPreparingImage || !postText.trim()}
                                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                                        >
                                            {isPosting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>جاري النشر...</span>
                                                </>
                                            ) : isPreparingImage ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>تجهيز الصورة...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5 rotate-180" />
                                                    <span>نشر الآن</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Edit Post Modal */}
                <AnimatePresence>
                    {editingPost && (
                        <motion.div 
                            key="edit-post-modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
                            onClick={handleCancelEdit}
                        >
                            <motion.div
                                key="edit-post-modal-card"
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/70">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                                            <Pencil className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="font-black text-slate-800 text-base">تعديل المنشور</h2>
                                            <p className="text-[11px] text-slate-500 font-bold">يمكنك تعديل النص أو استبدال/حذف الصورة المرفقة</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                                        title="إلغاء"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                                    {/* Text Area */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-600">
                                            <span>نص المنشور:</span>
                                            <span className={editingPost.text.length > 2400 ? 'text-amber-600' : 'text-slate-400'}>
                                                {editingPost.text.length} / 2500
                                            </span>
                                        </div>
                                        <textarea
                                            value={editingPost.text}
                                            onChange={(e) => setEditingPost(prev => prev ? { ...prev, text: e.target.value } : null)}
                                            placeholder="اكتب التعديلات على منشورك هنا..."
                                            maxLength={2500}
                                            rows={5}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white resize-none leading-relaxed"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Image handling in Edit Modal */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-600">
                                            <span>الصورة المرفقة:</span>
                                        </div>

                                        {isPreparingEditImage ? (
                                            <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/60 p-5 flex flex-col items-center justify-center text-center">
                                                <Loader2 className="w-6 h-6 text-sky-500 animate-spin mb-2" />
                                                <p className="text-xs font-black text-sky-800">جاري معالجة وتحسين الصورة الجديدة...</p>
                                            </div>
                                        ) : editingPost.newImageDataUrl ? (
                                            /* New image preview */
                                            <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-emerald-50/30 max-h-56 flex items-center justify-center p-1">
                                                <img
                                                    src={editingPost.newImageDataUrl}
                                                    alt="الصورة الجديدة"
                                                    className="w-full h-auto max-h-52 object-contain rounded-lg shadow-xs"
                                                />
                                                <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md shadow-xs">
                                                    صورة جديدة
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveEditImage}
                                                    className="absolute top-2 left-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer shadow-md"
                                                    title="إزالة الصورة"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : !editingPost.removeImage && editingPost.existingImageUrl ? (
                                            /* Existing image */
                                            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-56 flex items-center justify-center p-1">
                                                <img
                                                    src={editingPost.existingImageUrl}
                                                    alt="صورة المنشور الحالية"
                                                    className="w-full h-auto max-h-52 object-contain rounded-lg shadow-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveEditImage}
                                                    className="absolute top-2 left-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer shadow-md flex items-center gap-1 text-[11px] font-bold px-2.5"
                                                    title="حذف الصورة"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>حذف الصورة</span>
                                                </button>
                                            </div>
                                        ) : editingPost.removeImage ? (
                                            /* Image removed state */
                                            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <span>سيتم حذف الصورة من المنشور عند حفظ التعديل.</span>
                                                </div>
                                                {editingPost.existingImageUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRestoreOriginalImage}
                                                        className="text-[11px] font-black text-sky-700 hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs shrink-0"
                                                    >
                                                        استعادة الصورة الأصلية
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            /* No image attached */
                                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                                                <p className="text-xs text-slate-400 font-bold mb-2">لا توجد صورة مرفقة مع هذا المنشور</p>
                                                <button
                                                    type="button"
                                                    onClick={() => editFileInputRef.current?.click()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>إرفاق صورة للمنشور</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Hidden edit file input */}
                                        <input
                                            type="file"
                                            ref={editFileInputRef}
                                            onChange={handleEditImageChange}
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Error Banner */}
                                    {editError && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                            <span>{editError}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => editFileInputRef.current?.click()}
                                        className="p-2 sm:px-3 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <ImageIcon className="w-4 h-4 text-sky-600" />
                                        <span>{editingPost.newImageDataUrl || (!editingPost.removeImage && editingPost.existingImageUrl) ? 'تغيير الصورة' : 'إرفاق صورة'}</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            disabled={isSavingEdit || isPreparingEditImage || !editingPost.text.trim()}
                                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                                        >
                                            {isSavingEdit ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>جاري الحفظ...</span>
                                                </>
                                            ) : isPreparingEditImage ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>تجهيز الصورة...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                    <span>حفظ التعديلات</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Posts Feed */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
                        <p className="text-slate-500 font-bold text-sm">جاري تحميل منشورات الطلاب...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center border border-amber-200/60 shadow-xs">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 mb-1">لا توجد منشورات حتى الآن</h3>
                            <p className="text-slate-500 text-xs font-bold max-w-sm mx-auto">
                                كن أول طالب يشارك فكرة، سؤالاً، أو ملخصاً دراسياً في المنتدى وافتح باب النقاش لزملائك!
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                        >
                            <Send className="w-3.5 h-3.5 rotate-180" />
                            <span>كتابة أول منشور</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => {
                            const isLiked = likedPostIds.has(post.id);
                            const isOwner = Boolean(
                                (currentUserId && post.userId === currentUserId) || 
                                (currentUserEmail && post.userEmail && post.userEmail === currentUserEmail)
                            );
                            const isCommentsOpen = expandedCommentsPostId === post.id;
                            const postComments = commentsMap[post.id] || [];

                            return (
                                <article
                                    key={post.id}
                                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                                >
                                    {/* Post Top Header */}
                                    <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black text-sm shrink-0 border border-amber-600/10 shadow-xs">
                                                {post.userPhoto ? (
                                                    <img src={post.userPhoto} alt={post.userName} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    post.userName.charAt(0) || <UserIcon className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="truncate">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-slate-900 text-sm truncate">
                                                        {post.userName}
                                                    </h3>
                                                    {post.userEmail === ADMIN_EMAIL && (
                                                        <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-1.5 py-0.5 rounded-sm border border-rose-200">
                                                            مشرف
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                                                    <span>{formatArabicTime(post.createdAt)}</span>
                                                    {post.isEdited && (
                                                        <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md font-bold inline-flex items-center gap-0.5" title="تم تعديل هذا المنشور">
                                                            <Pencil className="w-2.5 h-2.5" />
                                                            <span>(معدّل)</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Post Options Menu */}
                                        <div className="flex items-center gap-1">
                                            {isOwner && (
                                                <button
                                                    onClick={() => handleStartEdit(post)}
                                                    className="px-2 py-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                                    title="تعديل المنشور"
                                                >
                                                    <Pencil className="w-3 h-3 text-sky-600" />
                                                    <span className="hidden sm:inline">تعديل</span>
                                                </button>
                                            )}
                                            <div className="relative">
                                                <button
                                                    data-post-menu="trigger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                    title="خيارات"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                <AnimatePresence>
                                                    {activeMenuPostId === post.id && (
                                                        <motion.div
                                                            key={`post-menu-${post.id}`}
                                                            data-post-menu="content"
                                                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                                            className="absolute left-0 top-8 z-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-40 text-xs font-bold overflow-hidden"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {isOwner && (
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuPostId(null);
                                                                        handleStartEdit(post);
                                                                    }}
                                                                    className="w-full px-3 py-2 text-right text-sky-600 hover:bg-sky-50 flex items-center gap-2 transition-colors cursor-pointer"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                                                                    <span>تعديل المنشور</span>
                                                                </button>
                                                            )}

                                                            {(isOwner || isAdmin) && (
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuPostId(null);
                                                                        requestDeletePost(post.id);
                                                                    }}
                                                                    className="w-full px-3 py-2 text-right text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                                                    <span>حذف المنشور</span>
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => {
                                                                    setActiveMenuPostId(null);
                                                                    setReportModal({
                                                                        isOpen: true,
                                                                        targetType: 'post',
                                                                        targetId: post.id,
                                                                        postId: post.id
                                                                    });
                                                                }}
                                                                className="w-full px-3 py-2 text-right text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                                                            >
                                                                <Flag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                <span>إبلاغ عن محتوى</span>
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post Text Body */}
                                    <div className="px-4 sm:px-5 pb-3">
                                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                                            {post.text}
                                        </p>
                                    </div>

                                    {/* Post Optional Image */}
                                    {post.imageUrl && (
                                        <div className="px-4 sm:px-5 pb-4">
                                            <div
                                                onClick={() => setEnlargedImage(post.imageUrl || null)}
                                                className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-96 flex items-center justify-center cursor-pointer group"
                                            >
                                                <img
                                                    src={post.imageUrl}
                                                    alt="محتوى المنشور"
                                                    className="w-full h-auto max-h-96 object-contain group-hover:scale-[1.01] transition-transform duration-200"
                                                    loading="lazy"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Post Action Buttons Bar */}
                                    <div className="px-4 sm:px-5 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                                        <div className="flex items-center gap-4">
                                            {/* Like Button */}
                                            <button
                                                onClick={() => handleToggleLike(post.id)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                                                    isLiked 
                                                        ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 font-black' 
                                                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                                                }`}
                                                title={isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
                                            >
                                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                                                <span>{post.likesCount > 0 ? post.likesCount : ''} إعجاب</span>
                                            </button>

                                            {/* Comments Button */}
                                            <button
                                                onClick={() => handleToggleComments(post.id)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
                                                title="عرض التعليقات"
                                            >
                                                <MessageSquare className="w-4 h-4 text-sky-600" />
                                                <span>{post.commentsCount > 0 ? `${post.commentsCount} تعليق` : 'تعليق'}</span>
                                            </button>
                                        </div>

                                        {/* Fast Report Button */}
                                        <button
                                            onClick={() => setReportModal({
                                                isOpen: true,
                                                targetType: 'post',
                                                targetId: post.id,
                                                postId: post.id
                                            })}
                                            className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                                            title="إبلاغ"
                                        >
                                            <Flag className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Collapsible Comments Section */}
                                    <AnimatePresence>
                                        {isCommentsOpen && (
                                            <motion.div
                                                key={`comments-section-${post.id}`}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-200 bg-slate-50/40 p-4 space-y-3.5 overflow-hidden"
                                            >
                                                {/* Add Comment Input */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {currentUserPhoto ? (
                                                            <img src={currentUserPhoto} alt={currentUserName} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            currentUserName.charAt(0)
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={commentInputMap[post.id] || ''}
                                                        onChange={(e) => setCommentInputMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddComment(post.id);
                                                        }}
                                                        placeholder="أضف تعليقاً على هذا المنشور..."
                                                        className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        onClick={() => handleAddComment(post.id)}
                                                        disabled={submittingCommentPostId === post.id || !(commentInputMap[post.id] || '').trim()}
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                                                        title="إرسال التعليق"
                                                    >
                                                        {submittingCommentPostId === post.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4 -rotate-[65deg] translate-x-0.5" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Comments List */}
                                                {postComments.length === 0 ? (
                                                    <p className="text-center text-[11px] text-slate-400 font-bold py-2">
                                                        لا توجد تعليقات بعد. كن أول من يعلّق!
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2 pt-1 max-h-72 overflow-y-auto">
                                                        {postComments.map((comment) => {
                                                            const isCommentOwner = currentUserId && comment.userId === currentUserId;
                                                            return (
                                                                <div
                                                                    key={comment.id}
                                                                    className="bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-start justify-between gap-2 text-xs"
                                                                >
                                                                    <div className="flex items-start gap-2.5 min-w-0">
                                                                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                                                                            {comment.userPhoto ? (
                                                                                <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full rounded-full object-cover" />
                                                                            ) : (
                                                                                comment.userName.charAt(0)
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-black text-slate-900 text-xs">
                                                                                    {comment.userName}
                                                                                </span>
                                                                                <span className="text-[10px] text-slate-400">
                                                                                    {formatArabicTime(comment.createdAt)}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-slate-800 font-medium text-xs mt-0.5 whitespace-pre-wrap leading-relaxed">
                                                                                {comment.text}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        {(isCommentOwner || isAdmin) && (
                                                                            <button
                                                                                onClick={() => requestDeleteComment(post.id, comment.id)}
                                                                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                                                                title="حذف التعليق"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        )}

                                                                        <button
                                                                            onClick={() => setReportModal({
                                                                                isOpen: true,
                                                                                targetType: 'comment',
                                                                                targetId: comment.id,
                                                                                postId: post.id
                                                                            })}
                                                                            className="p-1 text-slate-300 hover:text-amber-500 rounded-md transition-colors"
                                                                            title="إبلاغ"
                                                                        >
                                                                            <Flag className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Report Modal */}
            <AnimatePresence>
                {reportModal.isOpen && (
                    <motion.div 
                        key="report-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            key="report-modal-card"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200 text-right space-y-4"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                                    <Flag className="w-4 h-4" />
                                    <span>الإبلاغ عن محتوى مخالف</span>
                                </div>
                                <button
                                    onClick={() => setReportModal({ isOpen: false, targetType: 'post', targetId: '' })}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {reportSuccessMessage ? (
                                <div className="py-6 text-center space-y-2">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                                    <p className="font-black text-sm text-slate-800">تم إرسال البلاغ بنجاح</p>
                                    <p className="text-xs text-slate-500">شكراً لمساعدتنا في الحفاظ على بيئة تعليمية آمنة.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 block">سبب الإبلاغ:</label>
                                        {(['محتوى غير مناسب', 'إساءة أو تنمر', 'spam', 'محتوى مخالف', 'أخرى'] as ForumReportReason[]).map((reason) => (
                                            <label
                                                key={reason}
                                                className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                                                    reportReason === reason 
                                                        ? 'bg-amber-50 border-amber-300 text-amber-900' 
                                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="reportReason"
                                                    value={reason}
                                                    checked={reportReason === reason}
                                                    onChange={() => setReportReason(reason)}
                                                    className="accent-amber-600"
                                                />
                                                <span>{reason}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">تفاصيل إضافية (اختياري):</label>
                                        <textarea
                                            value={reportDetails}
                                            onChange={(e) => setReportDetails(e.target.value)}
                                            rows={3}
                                            placeholder="اكتب توضيحاً مختصراً للمشرف..."
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setReportModal({ isOpen: false, targetType: 'post', targetId: '' })}
                                            className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmitReport}
                                            disabled={isSubmittingReport}
                                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            {isSubmittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                                            <span>إرسال البلاغ</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enlarged Image Lightbox */}
            <AnimatePresence>
                {enlargedImage && (
                    <motion.div 
                        key="enlarged-image-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEnlargedImage(null)}
                        className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
                    >
                        <motion.div 
                            key="enlarged-image-card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-[90vh]"
                        >
                            <button
                                onClick={() => setEnlargedImage(null)}
                                className="absolute -top-10 left-0 p-2 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <img
                                src={enlargedImage}
                                alt="Enlarged"
                                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admin Moderation Panel */}
            <AnimatePresence>
                {showAdminPanel && isAdmin && (
                    <motion.div 
                        key="admin-panel-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
                    >
                        <motion.div
                            key="admin-panel-card"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
                                <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
                                    <ShieldAlert className="w-5 h-5" />
                                    <span>لوحة إشراف المنتدى (المشرف)</span>
                                </div>
                                <button
                                    onClick={() => setShowAdminPanel(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto space-y-3 flex-1">
                                {loadingReports ? (
                                    <div className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-2" />
                                        <p className="text-xs text-slate-500 font-bold">جاري تحميل البلاغات...</p>
                                    </div>
                                ) : adminReports.length === 0 ? (
                                    <div className="py-12 text-center text-slate-500 text-xs font-bold space-y-2">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                                        <p>لا توجد بلاغات معلقة حالياً. المنتدى آمن ونظيف!</p>
                                    </div>
                                ) : (
                                    adminReports.map((rep) => (
                                        <div
                                            key={rep.id}
                                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-sm">
                                                    {rep.reason}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {formatArabicTime(rep.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 font-medium">
                                                المبلّغ: <b>{rep.reporterName}</b> | الهدف: <b>{rep.targetType === 'post' ? 'منشور' : 'تعليق'}</b>
                                            </p>
                                            {rep.details && (
                                                <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                                                    التفاصيل: {rep.details}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                                                {rep.targetType === 'post' && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await deleteForumPost(rep.targetId);
                                                                await updateReportStatus(rep.id, 'resolved');
                                                                setAdminReports(prev => prev.filter(r => r.id !== rep.id));
                                                                setPosts(prev => prev.filter(p => p.id !== rep.targetId));
                                                                showToast('تم حذف المنشور ومعالجة البلاغ');
                                                            } catch (e: any) {
                                                                showToast('تعذر حذف المنشور: ' + (e.message || 'خطأ'));
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                                                    >
                                                        حذف المنشور المخالف
                                                    </button>
                                                )}

                                                <button
                                                    onClick={async () => {
                                                        await updateReportStatus(rep.id, 'dismissed');
                                                        setAdminReports(prev => prev.filter(r => r.id !== rep.id));
                                                    }}
                                                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[11px]"
                                                >
                                                    تجاهل البلاغ
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmModal?.isOpen && (
                    <motion.div
                        key="delete-confirm-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !isDeletingItem && setDeleteConfirmModal(null)}
                    >
                        <motion.div
                            key="delete-confirm-modal-card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 mb-1">
                                    {deleteConfirmModal.type === 'post' ? 'حذف المنشور؟' : 'حذف التعليق؟'}
                                </h3>
                                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                    {deleteConfirmModal.type === 'post'
                                        ? 'هل أنت متأكد من رغبتك في حذف هذا المنشور؟ لا يمكن التراجع عن هذه الخطوة.'
                                        : 'هل أنت متأكد من رغبتك في حذف هذا التعليق؟'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirmModal(null)}
                                    disabled={isDeletingItem}
                                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeletingItem}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    {isDeletingItem ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>جاري الحذف...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            <span>نعم، احذف</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        key="forum-toast-notification"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-2xl border border-slate-700/60 flex items-center gap-2 backdrop-blur-md"
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ForumPage;
