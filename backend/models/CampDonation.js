const mongoose = require('mongoose');

const campDonationSchema = new mongoose.Schema({
  camp: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodCamp', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodType: { type: String, required: true },
  donatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CampDonation', campDonationSchema); 