const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getTopRatedProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCategories,
  getVehicleBrands,
  getCategoryStats
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/top-rated', getTopRatedProducts);
router.get('/categories', getCategories);
router.get('/brands', getVehicleBrands);
router.get('/category-stats', getCategoryStats);
router.get('/:id', getProductById);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
