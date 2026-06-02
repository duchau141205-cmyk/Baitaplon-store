const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    const categories = await Category.find({});
    res.json(categories);
};

// Simple slugify helper
const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    const { name, description } = req.body;

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
        res.status(400).json({ message: 'Category already exists' });
        return;
    }

    const slug = slugify(name);
    
    let image = '';
    if (req.file) {
        image = '/' + req.file.path.replace(/\\/g, '/');
    } else if (req.body.image) {
        image = req.body.image;
    }

    const category = await Category.create({ name, description, slug, image });
    res.status(201).json(category);
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
        if (name && name !== category.name) {
            category.name = name;
            category.slug = slugify(name);
        }
        category.description = description || category.description;

        if (req.file) {
            category.image = '/' + req.file.path.replace(/\\/g, '/');
        } else if (req.body.image) {
            category.image = req.body.image;
        }

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404).json({ message: 'Category not found' });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } else {
        res.status(404).json({ message: 'Category not found' });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
