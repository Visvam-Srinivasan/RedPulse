const Request = require('../models/Request');
const User = require('../models/User');

exports.createRequest = async (req, res) => {
  try {
    console.log('Received request data:', req.body);
    
    const { bloodType, totalUnits, maxDistance, urgency, notes, hospitalName, requesterType } = req.body;
    const location = req.body.location;

    // Validate required fields
    if (!bloodType || !totalUnits || !location || !location.coordinates) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          bloodType: !bloodType,
          totalUnits: !totalUnits,
          location: !location || !location.coordinates
        }
      });
    }

    // Validate location coordinates
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Invalid location coordinates format' });
    }

    // Validate numbers
    if (isNaN(totalUnits) || totalUnits < 1) {
      return res.status(400).json({ message: 'Invalid total units value' });
    }

    if (isNaN(maxDistance) || maxDistance < 1) {
      return res.status(400).json({ message: 'Invalid max distance value' });
    }

    // If medical user, require hospitalName
    if (requesterType === 'medicalUser' && !hospitalName) {
      return res.status(400).json({ message: 'Hospital name is required for medical users.' });
    }

    const request = new Request({
      requester: req.user._id,
      bloodType,
      totalUnits: parseInt(totalUnits, 10),
      unitsLeft: parseInt(totalUnits, 10),
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(location.coordinates[0]),
          parseFloat(location.coordinates[1])
        ]
      },
      maxDistance: parseInt(maxDistance, 10),
      urgency,
      notes,
      hospitalName: requesterType === 'medicalUser' ? hospitalName : undefined,
      requesterType
    });

    console.log('Creating request with data:', request);

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
            coordinates: [location.coordinates[0], location.coordinates[1]]
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
    console.error('Error in createRequest:', error);
    res.status(500).json({ 
      message: 'Error creating request', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

    // Check if user is a medical institution
    if (req.user.userType === 'medicalUser') {
      // Medical institution can donate multiple units at once
      let unitsToDonate = parseInt(req.body.unitsDonated, 10);
      if (isNaN(unitsToDonate) || unitsToDonate < 1) {
        return res.status(400).json({ message: 'Invalid units to donate' });
      }
      if (unitsToDonate > request.unitsLeft) {
        return res.status(400).json({ message: 'Cannot donate more units than needed' });
      }
      // Add donation
      request.donations.push({ donor: req.user._id, unitsDonated: unitsToDonate });
      request.unitsLeft -= unitsToDonate;
    } else {
      // Prevent the same donor from donating twice
      if (request.donations.some(d => d.donor.toString() === req.user._id.toString())) {
        return res.status(400).json({ message: 'You have already donated for this request' });
      }
      // Add donor and decrement units left by 1
      request.donations.push({ donor: req.user._id });
      request.unitsLeft -= 1;
    }

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
      status: { $in: ['pending', 'accepted'] },
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
    })
    .select('-donations') // Exclude donations array for better performance
    .populate('requester', 'name email phoneNumber');

    res.json(requests);
  } catch (error) {
    console.error('Error in getNearbyRequests:', error);
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
    
    // Get all unique donor IDs from all requests
    const donorIds = [...new Set(requests.flatMap(req => 
      (req.donations || []).map(d => d.donor)
    ).filter(id => id))];
    
    // Only fetch donors if there are any donations
    let donorMap = {};
    if (donorIds.length > 0) {
      // Fetch all donors in one query
      const donors = await User.find(
        { _id: { $in: donorIds } },
        'name userType'
      ).lean();
      
      // Create a map of donor IDs to donor info
      donorMap = donors.reduce((acc, donor) => {
        acc[donor._id.toString()] = {
          name: donor.name,
          userType: donor.userType
        };
        return acc;
      }, {});
    }
    
    // Attach donor info to each donation
    const populatedRequests = requests.map(request => ({
      ...request,
      donations: (request.donations || []).map(donation => ({
        ...donation,
        donor: donorMap[donation.donor.toString()] || null
      }))
    }));
    
    console.log('Sample populated request:', {
      requestId: populatedRequests[0]?._id,
      totalUnits: populatedRequests[0]?.totalUnits,
      unitsLeft: populatedRequests[0]?.unitsLeft,
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

exports.getAllRequests = async (req, res) => {
  try {
    const { maxDistance = 10 } = req.query;
    const user = await User.findById(req.user._id);

    const requests = await Request.find({
      status: { $in: ['pending', 'accepted'] },
      unitsLeft: { $gt: 0 },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    })
    .populate('requester', 'name email phoneNumber');

    res.json(requests);
  } catch (error) {
    console.error('Error in getAllRequests:', error);
    res.status(500).json({ message: 'Error fetching all requests', error: error.message });
  }
}; 