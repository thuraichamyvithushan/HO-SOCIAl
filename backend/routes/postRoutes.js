const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    createPost,
    getUserPosts,
    getUserArchivedPosts,
    getAdminPosts,
    getAdminArchivedPosts,
    getPostById,
    updatePost,
    archivePost,
    unarchivePost,
    deletePost,
    getRecentActivity
} = require('../controllers/postController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

const { upload } = require('../config/cloudinary');

router.use(protect);

router.post('/', admin, upload.array('media', 10), createPost);
router.get('/user', getUserPosts);
router.get('/user/archived', getUserArchivedPosts);
router.get('/admin', admin, getAdminPosts);
router.get('/admin/archived', admin, getAdminArchivedPosts);
router.get('/admin/recent-activity', admin, getRecentActivity);
router.get('/:id', getPostById);
router.put('/:id', admin, updatePost);
router.patch('/:id/archive', archivePost);
router.patch('/:id/unarchive', unarchivePost);
router.delete('/:id', admin, deletePost);

module.exports = router;
