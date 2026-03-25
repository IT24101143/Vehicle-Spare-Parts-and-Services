const Product = require('../models/Product');
const { Inventory } = require('../models/Inventory');

const mergeInventoryStock = async (productDocs) => {
  if (!productDocs || productDocs.length === 0) return [];

  const productIds = productDocs.map((product) => product._id);
  const inventoryRows = await Inventory.find({ product: { $in: productIds } })
    .select('product currentStock')
    .lean();

  const stockByProductId = new Map(
    inventoryRows.map((row) => [String(row.product), row.currentStock])
  );

  return productDocs.map((product) => {
    const key = String(product._id);
    const inventoryStock = stockByProductId.get(key);
    if (inventoryStock === undefined) return product;
    return { ...product, stockQuantity: inventoryStock };
  });
};

const syncInventoryForProduct = async (productId, stockQuantity, minStockLevel) => {
  if (stockQuantity === undefined || stockQuantity === null || Number.isNaN(Number(stockQuantity))) {
    return null;
  }

  const normalizedStock = Math.max(0, Number(stockQuantity));
  let inventory = await Inventory.findOne({ product: productId });
  if (!inventory) {
    // Keep product and inventory decoupled at creation time.
    // Inventory must be created explicitly from Inventory module.
    return null;
  }
  inventory.currentStock = normalizedStock;
  if (minStockLevel !== undefined && minStockLevel !== null && !Number.isNaN(Number(minStockLevel))) {
    inventory.minStockLevel = Math.max(0, Number(minStockLevel));
  }

  await inventory.save();
  await Product.findByIdAndUpdate(productId, { stockQuantity: inventory.currentStock });
  return inventory.currentStock;
};

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, vehicleType, vehicleBrand, search, sortBy, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    if (vehicleType) query.vehicleType = vehicleType;
    if (vehicleBrand) query.vehicleBrand = new RegExp(vehicleBrand, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { partNumber: new RegExp(search, 'i') }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    switch (sortBy) {
      case 'price_low': sortOption = { price: 1 }; break;
      case 'price_high': sortOption = { price: -1 }; break;
      case 'rating': sortOption = { averageRating: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('supplier', 'name')
      .lean();

    const productsWithLiveStock = await mergeInventoryStock(products);

    res.json({
      products: productsWithLiveStock,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top rated products
// @route   GET /api/products/top-rated
const getTopRatedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, averageRating: { $gte: 4 } })
      .sort({ averageRating: -1 })
      .limit(10)
      .lean();

    const productsWithLiveStock = await mergeInventoryStock(products);
    res.json(productsWithLiveStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name').lean();
    if (product) {
      const [productWithLiveStock] = await mergeInventoryStock([product]);
      res.json(productWithLiveStock);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    const product = new Product(productData);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    let product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
    if (product) {
      await syncInventoryForProduct(product._id, req.body.stockQuantity, req.body.minStockLevel);
      product = await Product.findById(product._id);
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (product) {
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get categories
// @route   GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get vehicle brands
// @route   GET /api/products/brands
const getVehicleBrands = async (req, res) => {
  try {
    const brands = await Product.distinct('vehicleBrand');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category stats for homepage
// @route   GET /api/products/category-stats
const getCategoryStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          image: { $first: { $arrayElemAt: ['$images', 0] } }
        }
      },
      { $project: { _id: 0, name: '$_id', count: 1, image: 1 } },
      { $sort: { count: -1, name: 1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getTopRatedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getVehicleBrands,
  getCategoryStats
};
