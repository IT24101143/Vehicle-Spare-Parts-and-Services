const express = require('express');
const router = express.Router();
const { 
  getSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  getSuppliersByCategory
} = require('../controllers/supplierController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getSuppliers);
router.get('/by-category/:category', protect, admin, getSuppliersByCategory);
router.get('/:id', protect, admin, getSupplierById);
router.post('/', protect, admin, createSupplier);
router.put('/:id', protect, admin, updateSupplier);
router.delete('/:id', protect, admin, deleteSupplier);

module.exports = router;
