const BloodCamp = require('../models/BloodCamp');

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