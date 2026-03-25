const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: null
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Engine Parts', 'Brake System', 'Electrical', 'Suspension', 'Body Parts', 'Interior', 'Exterior', 'Transmission', 'Cooling System', 'Fuel System', 'Other']
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['Car', 'Motorcycle', 'Truck', 'Van', 'SUV', 'Bus', 'Universal']
  },
  vehicleBrand: {
    type: String,
    required: true
  },
  vehicleModel: {
    type: String
  },
  partNumber: {
    type: String,
    unique: true,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isTopRated: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  warrantyPeriod: {
    type: Number,
    default: 0,
    description: 'Warranty period in months'
  }
}, { timestamps: true });

// Index for search functionality
productSchema.index({ name: 'text', description: 'text', partNumber: 'text' });

module.exports = mongoose.model('Product', productSchema);
