const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  units: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        // Allow 0 only if status is fulfilled
        return v > 0 || this.status === 'fulfilled';
      },
      message: 'Units must be greater than 0 unless request is fulfilled'
    }
  },
  totalUnits: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acceptedAt: {
    type: Date
  },
  fulfilledAt: {
    type: Date
  },
  maxDistance: {
    type: Number,
    required: true,
    default: 10 // Default 10km radius
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  hospitalName: {
    type: String,
    required: function() { return this.requesterType === 'medicalUser'; },
    trim: true
  },
  donations: [
    {
      donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      donatedAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

// Create geospatial index for location
requestSchema.index({ location: '2dsphere' });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request; 