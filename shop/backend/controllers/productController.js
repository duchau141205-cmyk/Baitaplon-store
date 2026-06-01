const Product = require('../models/Product');

// @desc    Fetch products with filters, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const { category, brand, minPrice, maxPrice, sort, page, limit, keyword } = req.query;

        // 1. Filtering
        let query = {};
        
        if (category) query.category = category;
        if (brand) query.brand = brand;

        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { brand: { $regex: keyword, $options: 'i' } }
            ];
        }
        
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // 2. Sorting
        let sortOption = {};
        if (sort) {
            // e.g. sort=price (asc), sort=-price (desc)
            const sortFields = sort.split(',');
            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    sortOption[field.substring(1)] = -1;
                } else {
                    sortOption[field] = 1;
                }
            });
        } else {
            sortOption = { createdAt: -1 }; // default sort
        }

        // 3. Pagination
        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 12; // default 12 items per page
        const skip = (pageNumber - 1) * limitNumber;

        // Execute query
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(limitNumber);

        res.json({
            products,
            page: pageNumber,
            pages: Math.ceil(total / limitNumber),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm', error: error.message });
    }
};

// @desc    Search products by name or brand
// @route   GET /api/products/search?q=
// @access  Public
const searchProducts = async (req, res) => {
    try {
        const keyword = req.query.q
            ? {
                  $or: [
                      { name: { $regex: req.query.q, $options: 'i' } },
                      { brand: { $regex: req.query.q, $options: 'i' } }
                  ]
              }
            : {};

        const products = await Product.find({ ...keyword }).populate('category', 'name');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tìm kiếm sản phẩm', error: error.message });
    }
};


// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name');

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const { name, price, description, brand, category, countInStock, manufacturer, technicalSpecs } = req.body;
        
        let image = '';
        if (req.file) {
            // Normalize path for Windows/Linux
            image = '/' + req.file.path.replace(/\\/g, '/');
        } else if (req.body.image) {
            image = req.body.image; // fallback to URL if provided
        }

        // technicalSpecs might be a JSON string if sent via FormData
        let parsedSpecs = {};
        if (technicalSpecs) {
            try {
                parsedSpecs = typeof technicalSpecs === 'string' ? JSON.parse(technicalSpecs) : technicalSpecs;
            } catch (e) {
                console.warn('Could not parse technical specs');
            }
        }

        const product = new Product({
            name,
            price: price || 0,
            image,
            brand,
            category,
            countInStock: countInStock || 0,
            manufacturer,
            description,
            technicalSpecs: parsedSpecs
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm', error: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { name, price, description, brand, category, countInStock, manufacturer, technicalSpecs } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.price = price !== undefined ? price : product.price;
            product.description = description || product.description;
            product.brand = brand || product.brand;
            product.category = category || product.category;
            product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
            product.manufacturer = manufacturer || product.manufacturer;
            
            if (req.file) {
                product.image = '/' + req.file.path.replace(/\\/g, '/');
            } else if (req.body.image) {
                product.image = req.body.image;
            }

            if (technicalSpecs) {
                try {
                    product.technicalSpecs = typeof technicalSpecs === 'string' ? JSON.parse(technicalSpecs) : technicalSpecs;
                } catch (e) {
                    // Ignore parsing error
                }
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm', error: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Đã xóa sản phẩm' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm', error: error.message });
    }
};

module.exports = {
    getProducts,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
