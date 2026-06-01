const express = require('express');
const router = express.Router();
const {
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
    .post(protect, admin, upload.single('image'), createCategory);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateCategory)
    .delete(protect, admin, deleteCategory);

module.exports = router;
