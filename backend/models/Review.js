const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true
  },
  comment: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  adminResponse: {
    comment: String,
    respondedAt: Date
  }
}, { timestamps: true });

// Ensure user can only review once per product/service
reviewSchema.index({ user: 1, product: 1 }, { unique: true, sparse: true });
reviewSchema.index({ user: 1, service: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
