const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  bookingNumber: {
    type: String,
    unique: true
  },
  vehicleInfo: {
    type: {
      type: String,
      enum: ['Car', 'Motorcycle', 'Truck', 'Van', 'SUV', 'Bus'],
      required: true
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number },
    plateNumber: { type: String, required: true }
  },
  // Customer requested date/time (request stage)
  requestedDate: {
    type: Date,
    required: true
  },
  requestedTime: {
    type: String
  },
  // Admin assigned slot (confirmation stage)
  scheduledDate: {
    type: Date
  },
  scheduledTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  adminNotes: {
    type: String
  },
  assignedTechnician: {
    type: String
  },
  completedAt: {
    type: Date
  },
  cancelReason: {
    type: String
  }
}, { timestamps: true });

// Backward compatibility: if older docs only have scheduledDate
bookingSchema.pre('validate', function(next) {
  if (!this.requestedDate && this.scheduledDate) {
    this.requestedDate = this.scheduledDate;
  }
  if (!this.requestedTime && this.scheduledTime) {
    this.requestedTime = this.scheduledTime;
  }
  next();
});

// Generate booking number before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = `BK-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
