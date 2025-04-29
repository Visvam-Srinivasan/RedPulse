const mongoose = require('mongoose');

const bloodCampSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('BloodCamp', bloodCampSchema); 