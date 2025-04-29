const BloodCamp = require('../models/BloodCamp');
const CampDonation = require('../models/CampDonation');
const User = require('../models/User');
const Request = require('../models/Request');

exports.createBloodCamp = async (req, res) => {
  try {
    const {
      name, date, startTime, endTime, location, city, state, contactNumber, email, description, isActive, createdAt
    } = req.body;
    const camp = new BloodCamp({
      name,
      date,
      startTime,
      endTime,
      location,
      city,
      state,
      contactNumber,
      email,
      description,
      isActive,
      createdAt: createdAt || new Date(),
      createdBy: req.user._id
    });
    await camp.save();
    res.status(201).json(camp);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blood camp', error: error.message });
  }
};

exports.getMyBloodCamps = async (req, res) => {
  try {
    const camps = await BloodCamp.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(camps);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blood camps', error: error.message });
  }
};

// Get all active blood camps
exports.getActiveBloodCamps = async (req, res) => {
  try {
    const camps = await BloodCamp.find({ isActive: true }).sort({ date: 1, startTime: 1 });
    res.json(camps);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active blood camps', error: error.message });
  }
};

// Donate to a camp (with 30-day buffer for common users)
exports.donateToCamp = async (req, res) => {
  try {
    const campId = req.params.campId;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const camp = await BloodCamp.findById(campId);
    if (!camp) return res.status(404).json({ message: 'Blood camp not found' });
    // Check 30-day buffer for common users
    if (user.userType === 'commonUser') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      // Check CampDonation
      const recentCampDonation = await CampDonation.findOne({
        donor: userId,
        donatedAt: { $gte: oneMonthAgo }
      });
      // Check Request donations
      const recentRequestDonation = await Request.findOne({
        'donations.donor': userId,
        'donations.donatedAt': { $gte: oneMonthAgo }
      });
      if (recentCampDonation || recentRequestDonation) {
        return res.status(400).json({ message: 'You can only donate once every 30 days.' });
      }
    }
    // Prevent duplicate donation to the same camp
    const alreadyDonated = await CampDonation.findOne({ camp: campId, donor: userId });
    if (alreadyDonated) {
      return res.status(400).json({ message: 'You have already donated to this camp.' });
    }
    // Create donation
    const donation = new CampDonation({
      camp: campId,
      donor: userId,
      bloodType: user.bloodType
    });
    await donation.save();
    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Error donating to blood camp', error: error.message });
  }
};

// Get all donations for a camp
exports.getCampDonations = async (req, res) => {
  try {
    const campId = req.params.campId;
    const donations = await CampDonation.find({ camp: campId }).populate('donor', 'name email bloodType');
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching camp donations', error: error.message });
  }
}; 