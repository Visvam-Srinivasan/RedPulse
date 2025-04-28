const Request = require('../models/Request');
const User = require('../models/User');

exports.createRequest = async (req, res) => {
  try {
    const { bloodType, units, maxDistance, urgency, notes, hospitalName } = req.body;
    const location = req.body.location;

    // Determine requester type
    const requesterType = req.user.userType;

    // If medical user, require hospitalName
    if (requesterType === 'medicalUser' && !hospitalName) {
      return res.status(400).json({ message: 'Hospital name is required for medical users.' });
    }

    const request = new Request({
      requester: req.user._id,
      bloodType,
      units,
      totalUnits: units,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      maxDistance,
      urgency,
      notes,
      hospitalName: requesterType === 'medicalUser' ? hospitalName : undefined,
      requesterType
    });

    await request.save();

    // Find nearby donors who have not donated in the last 1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Find users who have donated in the last month
    const recentDonorIds = await Request.distinct('acceptedBy', {
      acceptedBy: { $ne: null },
      acceptedAt: { $gte: oneMonthAgo }
    });

    const nearbyDonors = await User.find({
      userType: 'commonUser',
      bloodType,
      isAvailable: true,
      _id: { $nin: [...recentDonorIds, req.user._id] },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    });

    res.status(201).json({
      request: await request.populate('requester', 'name email userType'),
      nearbyDonors: nearbyDonors.map(donor => ({
        id: donor._id,
        name: donor.name,
        distance: donor.location.coordinates
      })),
      requesterName: request.requester.name
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.status === 'fulfilled' || request.units <= 0) {
      return res.status(400).json({ message: 'Request is already fulfilled' });
    }
    // Prevent requester from accepting their own request
    if (request.requester.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot accept your own request' });
    }
    // Prevent the same donor from donating twice
    if (request.donations.some(d => d.donor.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already donated for this request' });
    }
    // Log before decrement
    console.log('Before accept:', { units: request.units, donations: request.donations.length });
    // Add donor and decrement units
    request.donations.push({ donor: req.user._id });
    request.units -= 1;
    if (request.units <= 0) {
      request.status = 'fulfilled';
      request.fulfilledAt = new Date();
    } else {
      request.status = 'accepted';
    }
    // Log after decrement
    console.log('After accept:', { units: request.units, donations: request.donations.length });
    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Error in acceptRequest:', error);
    res.status(500).json({ message: 'Error accepting request', error: error.message });
  }
};

exports.fulfillRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Request must be accepted first' });
    }

    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the requester can fulfill the request' });
    }

    request.status = 'fulfilled';
    request.fulfilledAt = new Date();
    
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error fulfilling request', error: error.message });
  }
};

exports.getNearbyRequests = async (req, res) => {
  try {
    const { maxDistance = 10 } = req.query;
    const user = await User.findById(req.user._id);

    const requests = await Request.find({
      status: 'pending',
      bloodType: user.bloodType,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    }).populate('requester', 'name email phoneNumber');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Get all requests made by the logged-in user
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate('acceptedBy', 'name email userType')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your requests', error: error.message });
  }
};

// Get all requests accepted (donations) by the logged-in user
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Request.find({ 'donations.donor': req.user._id })
      .populate('requester', 'name email userType')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your donations', error: error.message });
  }
}; 