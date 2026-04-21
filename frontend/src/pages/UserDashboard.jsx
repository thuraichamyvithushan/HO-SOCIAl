import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlayCircle, ArrowRight, Clock, Archive, ArchiveRestore } from 'lucide-react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const TABS = [
    { key: 'active', label: 'Active Briefings' },
    { key: 'archive', label: 'Content Archive' },
];

const UserDashboard = () => {
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'active';

    const [activePosts, setActivePosts] = useState([]);
    const [archivedPosts, setArchivedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(initialTab);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;

    useEffect(() => {
        const t = searchParams.get('tab');
        if (t && (t === 'active' || t === 'archive')) {
            setTab(t);
            setCurrentPage(1);
        }
    }, [searchParams]);

    // Reset page when manual tab switch
    useEffect(() => {
        setCurrentPage(1);
    }, [tab]);

    const fetchPosts = useCallback(async () => {
        try {
            const [activeRes, archivedRes] = await Promise.all([
                api.get('/posts/user'),
                api.get('/posts/user/archived')
            ]);
            setActivePosts(activeRes.data);
            setArchivedPosts(archivedRes.data);
        } catch (error) {
            console.error('Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleArchive = async (postId) => {
        try {
            await api.patch(`/posts/${postId}/archive`);
            const post = activePosts.find(p => p._id === postId);
            setActivePosts(prev => prev.filter(p => p._id !== postId));
            if (post) setArchivedPosts(prev => [post, ...prev]);
            toast.success('Moved to Content Archive');
        } catch {
            toast.error('Failed to archive');
        }
    };

    const handleUnarchive = async (postId) => {
        try {
            await api.patch(`/posts/${postId}/unarchive`);
            const post = archivedPosts.find(p => p._id === postId);
            setArchivedPosts(prev => prev.filter(p => p._id !== postId));
            if (post) setActivePosts(prev => [post, ...prev]);
            toast.success('Restored to Active Briefings');
        } catch {
            toast.error('Failed to unarchive');
        }
    };

    const posts = tab === 'active' ? activePosts : archivedPosts;

    return (
        <div className="space-y-8 md:space-y-12 max-w-7xl mx-auto px-4 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
                <div>
                    <h1 className="text-2xl md:text-6xl font-black text-black tracking-tighter uppercase italic">
                        My <span className="text-primary-600">Assignments.</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs mt-2">
                        Content assigned for your review
                    </p>
                </div>
                <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Assets</p>
                    <p className="text-sm font-black text-primary-600 uppercase tracking-tighter">
                        {activePosts.length + archivedPosts.length} Items
                    </p>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────── */}
            <div className="flex border-b-2 border-black">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`relative px-6 md:px-10 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] transition-all ${tab === t.key
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-400 hover:text-black'
                            }`}
                    >
                        {t.label}
                        {t.key === 'active' && activePosts.length > 0 && (
                            <span className={`ml-2 px-1.5 py-0.5 text-[8px] font-black rounded-none ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {activePosts.length}
                            </span>
                        )}
                        {t.key === 'archive' && archivedPosts.length > 0 && (
                            <span className={`ml-2 px-1.5 py-0.5 text-[8px] font-black rounded-none ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {archivedPosts.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ───────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l border-black">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-gray-100 animate-pulse h-64 border-b border-r border-black" />
                    ))}
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {posts.length === 0 ? (
                            <div className="p-16 md:p-24 text-center border-2 border-black border-dashed opacity-20">
                                {tab === 'active' ? (
                                    <>
                                        <Clock size={40} className="mx-auto mb-4 text-black" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No active briefings</p>
                                    </>
                                ) : (
                                    <>
                                        <Archive size={40} className="mx-auto mb-4 text-black" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Content archive is empty</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className={`grid grid-cols-1 gap-0 border-t border-l border-black ${tab === 'archive'
                                    ? 'md:grid-cols-2 lg:grid-cols-3'
                                    : 'md:grid-cols-2'
                                    }`}>
                                    {posts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((post, index) => (
                                        <PostCard
                                            key={post._id}
                                            post={post}
                                            index={index}
                                            archived={tab === 'archive'}
                                            onArchive={handleArchive}
                                            onUnarchive={handleUnarchive}
                                        />
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {posts.length > ITEMS_PER_PAGE && (
                                    <div className="flex items-center justify-between mt-8 border-2 border-black p-4 bg-white shadow-[6px_6px_0px_#000]">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="px-6 py-2 border-2 border-black font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(posts.length / ITEMS_PER_PAGE)))}
                                                disabled={currentPage === Math.ceil(posts.length / ITEMS_PER_PAGE)}
                                                className="px-6 py-2 border-2 border-black font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            PAGE <span className="text-black">{currentPage}</span> / {Math.ceil(posts.length / ITEMS_PER_PAGE)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

/* ── PostCard ────────────────────────────────────────────────── */
const PostCard = ({ post, index, archived = false, onArchive, onUnarchive }) => {
    const firstMedia = post.media?.[0] || { url: post.mediaUrl, type: post.mediaType };
    const mediaCount = post.media?.length || (post.mediaUrl ? 1 : 0);
    const [busy, setBusy] = useState(false);

    const handleAction = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (busy) return;
        setBusy(true);
        try {
            if (archived) await onUnarchive(post._id);
            else await onArchive(post._id);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Link to={`/post/${post._id}`} className="block">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: archived ? 0.75 : 1 }}
                transition={{ delay: index * 0.07 }}
                className="group border-b border-r border-black relative overflow-hidden bg-white hover:bg-black transition-colors duration-500 cursor-pointer"
            >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                    {firstMedia.type === 'image' && firstMedia.url ? (
                        <img
                            src={firstMedia.url?.startsWith('http') ? firstMedia.url : `http://localhost:5000${firstMedia.url}`}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                            <PlayCircle className="text-white opacity-40 group-hover:opacity-100" size={48} />
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-0 left-0 p-3 flex gap-2 items-center">
                        <span className="px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest">
                            {firstMedia.type || 'media'}
                        </span>
                        {mediaCount > 1 && (
                            <span className="px-2 py-1 bg-primary-600 text-white text-[8px] font-black uppercase tracking-widest">
                                +{mediaCount - 1} more
                            </span>
                        )}
                        {archived && (
                            <span className="px-2 py-1 bg-gray-700 text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Archive size={8} /> Archived
                            </span>
                        )}
                    </div>

                    {/* Archive / Unarchive action button */}
                    <button
                        onClick={handleAction}
                        disabled={busy}
                        title={archived ? 'Restore to Active' : 'Move to Archive'}
                        className={`absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40 ${archived
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-white text-black hover:bg-gray-100'
                            }`}
                    >
                        {archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </button>
                </div>

                {/* Card body */}
                <div className="p-5 md:p-7 flex flex-col gap-4 group-hover:text-white transition-colors duration-500">
                    <div>
                        <h3 className="text-base md:text-xl font-black uppercase tracking-tighter leading-tight italic">
                            {post.title}
                        </h3>
                        <p className="text-[10px] font-medium opacity-50 line-clamp-2 leading-relaxed tracking-wide mt-1">
                            {post.description}
                        </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-black/10 group-hover:border-white/10 pt-3 mt-auto">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center font-black text-[9px] text-white">
                                {post.createdBy?.name?.charAt(0)}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-80">
                                {post.createdBy?.name}
                            </span>
                        </div>
                        {archived ? (
                            <span className="flex items-center gap-1.5 text-gray-400 font-black text-[9px] uppercase tracking-widest bg-black/5 group-hover:bg-white/10 px-3 py-1.5 transition-colors">
                                <ArchiveRestore size={10} /> Restore
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-primary-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest bg-black/5 group-hover:bg-primary-600 group-hover:text-white px-3 py-1.5 transition-colors">
                                Open &amp; Reply
                                <ArrowRight size={12} />
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default UserDashboard;
