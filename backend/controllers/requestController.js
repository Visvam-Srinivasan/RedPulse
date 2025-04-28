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
    // Defensive: Check user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized: User information missing' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if request is already fulfilled or cancelled
    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      return res.status(400).json({ message: 'Request is already fulfilled or cancelled' });
    }

    // Check if there are units left to donate
    if (request.unitsLeft <= 0) {
      return res.status(400).json({ message: 'No units left to donate' });
    }

    // Prevent requester from accepting their own request
    if (request.requester.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot accept your own request' });
    }

    // Prevent the same donor from donating twice
    if (request.donations.some(d => d.donor.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already donated for this request' });
    }

    // Add donor and decrement units left
    request.donations.push({ donor: req.user._id });
    request.unitsLeft -= 1;

    // Update status based on units left
    if (request.unitsLeft === 0) {
      request.status = 'fulfilled';
      request.fulfilledAt = new Date();
    } else {
      request.status = 'accepted';
    }

    // Save the updated request
    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error in acceptRequest:', error.message);
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
      status: { $in: ['pending', 'accepted'] }, // Show both pending and accepted requests
      unitsLeft: { $gt: 0 }, // Only show requests with units left
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
    console.log('Fetching requests for user:', req.user._id);
    
    // Get requests with lean() for better performance
    const requests = await Request.find({ requester: req.user._id })
      .lean()
      .sort({ createdAt: -1 });
    
    // Get all unique donor IDs
    const donorIds = [...new Set(requests.flatMap(req => 
      req.donations.map(d => d.donor)
    ).filter(id => id))];
    
    // Fetch all donors in one query
    const donors = await User.find(
      { _id: { $in: donorIds } },
      'name userType'
    ).lean();
    
    // Create a map of donor IDs to donor info
    const donorMap = donors.reduce((acc, donor) => {
      acc[donor._id.toString()] = {
        name: donor.name,
        userType: donor.userType
      };
      return acc;
    }, {});
    
    // Attach donor info to each donation
    const populatedRequests = requests.map(request => ({
      ...request,
      donations: request.donations.map(donation => ({
        ...donation,
        donor: donorMap[donation.donor.toString()] || null
      }))
    }));
    
    console.log('Sample populated request:', {
      requestId: populatedRequests[0]?._id,
      donations: populatedRequests[0]?.donations?.map(d => ({
        donorId: d.donor,
        donorInfo: donorMap[d.donor]
      }))
    });
    
    res.json(populatedRequests);
  } catch (error) {
    console.error('Error in getMyRequests:', error);
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