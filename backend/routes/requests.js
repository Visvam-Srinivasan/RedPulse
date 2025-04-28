const express = require('express');
const router = express.Router();
const { auth, checkUserType } = require('../middleware/auth');
const {
  createRequest,
  acceptRequest,
  fulfillRequest,
  getNearbyRequests,
  getMyRequests,
  getMyDonations,
  getAllRequests
} = require('../controllers/requestController');

// Protected routes
router.use(auth);

// Create request (for medical users)
router.post('/', createRequest);

// Accept request (for common users)
router.post('/:id/accept', checkUserType('commonUser'), acceptRequest);

// Fulfill request (for medical users)
router.post('/:id/fulfill', checkUserType('medicalUser'), fulfillRequest);

// Get nearby requests (for common users)
router.get('/nearby', checkUserType('commonUser'), getNearbyRequests);

// Get all requests made by the logged-in user
router.get('/my-requests', getMyRequests);

// Get all donations (requests accepted) by the logged-in user
router.get('/my-donations', getMyDonations);

// Get all requests (for medical users, not filtered by blood group)
router.get('/all', checkUserType('medicalUser'), getAllRequests);

module.exports = router; 