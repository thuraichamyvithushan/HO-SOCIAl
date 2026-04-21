import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, MessageSquare, ArrowLeft, ChevronLeft, ChevronRight, PlayCircle, Image as ImgIcon, Download, Maximize2, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const PostDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeMedia, setActiveMedia] = useState(0);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postRes, commentsRes] = await Promise.all([
                    api.get(`/posts/${id}`),
                    api.get(`/comments/${id}`)
                ]);
                setPost(postRes.data);
                setComments(commentsRes.data);
            } catch (error) {
                toast.error('Failed to load content');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const { data } = await api.post('/comments', { postId: id, comment: newComment });
            setComments([data, ...comments]);
            setNewComment('');
            toast.success('Reply sent');
        } catch (error) {
            toast.error('Failed to send reply');
        }
    };
    const handleDownload = async (media) => {
        try {
            const url = media.url?.startsWith('http') ? media.url : `http://localhost:5000${media.url}`;
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `HO_SOCIAL_${post.title.replace(/\s+/g, '_')}_${activeMedia + 1}.${media.url.split('.').pop()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success('Starting download...');
        } catch (error) {
            toast.error('Failed to download asset');
        }
    };
    if (loading) return <div className="p-20 text-center text-gray-400 animate-pulse font-bold tracking-widest uppercase">Loading...</div>;
    if (!post) return <div className="p-20 text-center text-red-500 font-bold">Content not found.</div>;

    // Build media list — prefer new media[], fall back to legacy mediaUrl
    const mediaList = post.media && post.media.length > 0
        ? post.media
        : [{ url: post.mediaUrl, type: post.mediaType }];

    const current = mediaList[activeMedia] || mediaList[0];

    return (
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700 px-4 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
                <div>
                    <Link to={user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'} className="inline-flex items-center gap-2 text-black hover:text-primary-600 transition-colors font-black uppercase tracking-widest text-[10px] mb-4 group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Return</span>
                    </Link>
                    <h1 className="text-2xl md:text-5xl font-black text-black tracking-tighter uppercase italic leading-tight">{post.title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:text-right">
                    <span className="px-3 py-1.5 bg-black text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                        {mediaList.length} Media File{mediaList.length !== 1 ? 's' : ''}
                    </span>
                    <p className="w-full text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">By {post.createdBy?.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-black">
                {/* ── Media Section ─────────────────────────────────── */}
                <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-black flex flex-col">

                    {/* Main viewer */}
                    <div className="bg-black aspect-video flex items-center justify-center relative overflow-hidden">
                        {current?.type === 'image' ? (
                            <img src={current.url?.startsWith('http') ? current.url : `http://localhost:5000${current.url}`} className="w-full h-full object-contain" alt={post.title} />
                        ) : (
                            <video src={current.url?.startsWith('http') ? current.url : `http://localhost:5000${current.url}`} controls className="w-full h-full" />
                        )}

                        {/* Prev / Next arrows */}
                        {mediaList.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveMedia(i => Math.max(0, i - 1))}
                                    disabled={activeMedia === 0}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black text-white disabled:opacity-20 transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setActiveMedia(i => Math.min(mediaList.length - 1, i + 1))}
                                    disabled={activeMedia === mediaList.length - 1}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black text-white disabled:opacity-20 transition-all"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                    {activeMedia + 1} / {mediaList.length}
                                </div>
                            </>
                        )}

                        {/* Download Button */}
                        <div className="absolute top-2 right-2 flex gap-2 z-20">
                            <button
                                onClick={() => setIsMaximized(true)}
                                className="p-2 bg-white hover:bg-black text-black hover:text-white shadow-[4px_4px_0px_#000] border-2 border-black transition-all flex items-center gap-2 group"
                                title="View Full Screen"
                            >
                                <Maximize2 size={14} className="group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => handleDownload(current)}
                                className="p-2 bg-primary-600 hover:bg-primary-700 text-white shadow-[4px_4px_0px_#000] border-2 border-black transition-all flex items-center gap-2 group"
                                title="Download this asset"
                            >
                                <Download size={14} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Download Asset</span>
                            </button>
                        </div>
                    </div>

                    {/* Fullscreen Overlay */}
                    <AnimatePresence>
                        {isMaximized && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 md:p-10"
                            >
                                <button
                                    onClick={() => setIsMaximized(false)}
                                    className="absolute top-6 right-6 p-4 bg-white text-black border-2 border-black shadow-[6px_6px_0px_#ff3e3e] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all z-[110]"
                                >
                                    <X size={24} />
                                </button>

                                <div className="w-full h-full flex items-center justify-center relative">
                                    {current?.type === 'image' ? (
                                        <img
                                            src={current.url?.startsWith('http') ? current.url : `http://localhost:5000${current.url}`}
                                            className="max-w-full max-h-full object-contain shadow-2xl"
                                            alt={post.title}
                                        />
                                    ) : (
                                        <video
                                            src={current.url?.startsWith('http') ? current.url : `http://localhost:5000${current.url}`}
                                            controls
                                            autoPlay
                                            className="max-w-full max-h-full shadow-2xl"
                                        />
                                    )}

                                    {/* Navigation in Fullscreen */}
                                    {mediaList.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMedia(i => Math.max(0, i - 1)); }}
                                                disabled={activeMedia === 0}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 p-6 bg-white/10 hover:bg-white text-white hover:text-black transition-all disabled:opacity-0"
                                            >
                                                <ChevronLeft size={48} strokeWidth={3} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMedia(i => Math.min(mediaList.length - 1, i + 1)); }}
                                                disabled={activeMedia === mediaList.length - 1}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 p-6 bg-white/10 hover:bg-white text-white hover:text-black transition-all disabled:opacity-0"
                                            >
                                                <ChevronRight size={48} strokeWidth={3} />
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="mt-6 flex flex-col items-center gap-2">
                                    <h2 className="text-white font-black uppercase italic tracking-tighter text-xl">
                                        {post.title} <span className="text-primary-600">({activeMedia + 1} / {mediaList.length})</span>
                                    </h2>
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.3em]">Immersive Review Mode</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Thumbnails row */}
                    {mediaList.length > 1 && (
                        <div className="flex gap-0 border-t border-black overflow-x-auto">
                            {mediaList.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveMedia(i)}
                                    className={`relative w-20 h-16 shrink-0 border-r border-black overflow-hidden transition-all ${i === activeMedia ? 'ring-2 ring-inset ring-primary-600' : 'opacity-50 hover:opacity-100'}`}
                                >
                                    {item.type === 'image' ? (
                                        <img src={item.url?.startsWith('http') ? item.url : `http://localhost:5000${item.url}`} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                            <PlayCircle size={20} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div className="p-6 md:p-10 space-y-4 flex-1 border-t border-black">
                        <div className="flex items-center gap-3">
                            <div className="h-1 w-12 bg-primary-600"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Overview</span>
                        </div>
                        <p className="text-sm md:text-base font-medium text-gray-600 leading-relaxed italic">"{post.description}"</p>
                    </div>
                </div>

                {/* ── Replies / Comments ─────────────────────────────── */}
                <div className="flex flex-col bg-gray-50/50">
                    <div className="p-6 md:p-10 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
                            <span className="font-black italic uppercase tracking-tighter text-lg">Replies</span>
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{comments.length}</span>
                        </div>

                        {/* Comment list */}
                        <div className="flex-1 space-y-6 mb-6 overflow-y-auto custom-scrollbar max-h-[300px] md:max-h-[420px]">
                            {comments.length === 0 ? (
                                <div className="text-center py-10 text-gray-300">
                                    <MessageSquare className="mx-auto mb-2" size={28} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No replies yet.</p>
                                </div>
                            ) : (
                                comments.map((c) => (
                                    <motion.div key={c._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="group">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-5 h-5 bg-black text-white flex items-center justify-center font-black text-[8px] italic rounded-full">
                                                {c.userId?.name?.charAt(0)}
                                            </div>
                                            <h4 className="text-[10px] font-black text-black uppercase tracking-widest">{c.userId?.name}</h4>
                                            {!c.readByAdmin && user?.role === 'admin' && (
                                                <span className="text-[7px] font-black bg-primary-600 text-white px-1.5 py-0.5 uppercase tracking-widest">New</span>
                                            )}
                                        </div>
                                        <div className="pl-7">
                                            <p className="text-xs font-medium text-gray-600 leading-snug border-l-2 border-black/10 pl-3 group-hover:border-primary-600 transition-colors italic">
                                                {c.comment}
                                            </p>
                                            <p className="text-[8px] text-gray-300 mt-1 uppercase tracking-widest pl-3">
                                                {new Date(c.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Reply form */}
                        <form onSubmit={handleComment} className="mt-auto border-t-2 border-black pt-4">
                            <textarea
                                className="input-field resize-none min-h-20 md:min-h-24 w-full text-sm bg-transparent"
                                placeholder="Write your reply..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="btn-primary w-full py-3 mt-2 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <Send size={14} />
                                <span>Send Reply</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetails;
