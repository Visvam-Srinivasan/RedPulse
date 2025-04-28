import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, Button, Grid, Card, CardContent, CardActions, Chip } from '@mui/material';
import axios from 'axios';

const RequestList = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = user.userType === 'commonUser'
        ? 'http://localhost:5000/api/requests/nearby'
        : 'http://localhost:5000/api/requests/all';
      
      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  }, [user.userType]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      if (user.userType === 'medicalUser') {
        const units = parseInt(unitsToDonate[requestId], 10);
        if (!units || units < 1) {
          setError('Please enter a valid number of units to donate.');
          return;
        }
        await axios.post(
          `http://localhost:5000/api/requests/${requestId}/accept`,
          { unitsDonated: units },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          `http://localhost:5000/api/requests/${requestId}/accept`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  const handleFulfill = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/requests/${requestId}/fulfill`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'info';
      case 'fulfilled':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const urgencyOrder = { high: 3, medium: 2, low: 1 };
  const urgencyColor = { high: '#d32f2f', medium: '#ff9800', low: '#fbc02d' };

  // For medical users, track units to donate per request
  const [unitsToDonate, setUnitsToDonate] = useState({});

  // Blood camps state
  const [bloodCamps, setBloodCamps] = useState([]);
  const [campDonationStatus, setCampDonationStatus] = useState({}); // { [campId]: 'donated' | 'error' | 'success' | null }

  // Fetch active blood camps
  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/requests/blood-camps/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBloodCamps(res.data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCamps();
  }, []);

  // Track which camps the user has donated to (and 30-day buffer)
  const [userCampDonations, setUserCampDonations] = useState([]); // [{ camp: id, donatedAt }]
  useEffect(() => {
    const fetchUserCampDonations = async () => {
      try {
        const token = localStorage.getItem('token');
        // Get all donations for all camps for this user
        const res = await axios.get('http://localhost:5000/api/requests/blood-camps/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // For each camp, fetch donations for that camp and filter for this user
        const campIds = res.data.map(c => c._id);
        let donations = [];
        for (const campId of campIds) {
          const dRes = await axios.get(`http://localhost:5000/api/requests/blood-camps/${campId}/donations`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const userDonation = dRes.data.find(d => d.donor && d.donor._id === user.id);
          if (userDonation) {
            donations.push({ camp: campId, donatedAt: userDonation.donatedAt });
          }
        }
        setUserCampDonations(donations);
      } catch (err) {
        // Optionally handle error
      }
    };
    if (user && user.userType === 'commonUser') fetchUserCampDonations();
  }, [user]);

  // Donate to a camp
  const handleCampDonate = async (campId) => {
    setCampDonationStatus(s => ({ ...s, [campId]: null }));
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/requests/blood-camps/${campId}/donate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampDonationStatus(s => ({ ...s, [campId]: 'success' }));
      setUserCampDonations(donations => [...donations, { camp: campId, donatedAt: new Date().toISOString() }]);
    } catch (err) {
      setCampDonationStatus(s => ({ ...s, [campId]: 'error' }));
      setError(err.response?.data?.message || 'An error occurred while donating to the camp');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        <div style={{ background: '#fff3e0', borderRadius: 8, padding: '16px 24px', marginBottom: 24, boxShadow: '0 2px 8px #eee' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#b71c1c' }}>
            Blood Requests
          </Typography>
        </div>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Grid container spacing={3}>
          {(() => {
            const filteredRequests = requests
              .filter(request => request.requester?._id !== user.id)
              .filter(request => request.unitsLeft > 0)
              .filter(request => !request.donations?.some(d => d.donor === user.id));
            if (filteredRequests.length === 0) {
              return (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" color="text.secondary">
                      No requests available at the moment.
                    </Typography>
                  </Box>
                </Grid>
              );
            }
            return filteredRequests
              .sort((a, b) => (urgencyOrder[b.urgency] - urgencyOrder[a.urgency]))
              .map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request._id}>
                  <Card sx={{ borderTop: `6px solid ${urgencyColor[request.urgency] || '#bdbdbd'}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: urgencyColor[request.urgency],
                          mr: 1, border: '2px solid #fff', boxShadow: '0 0 4px #ccc'
                        }} />
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: urgencyColor[request.urgency] }}>
                          {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)} Urgency
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Blood Type: {request.bloodType}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Units Required: {request.totalUnits} (Left: {request.unitsLeft})
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Distance: {request.maxDistance} km
                      </Typography>
                      {request.hospitalName && (
                        <Typography variant="body1" gutterBottom>
                          Hospital: {request.hospitalName}
                        </Typography>
                      )}
                      {request.notes && (
                        <Typography variant="body1" gutterBottom>
                          Notes: {request.notes}
                        </Typography>
                      )}
                      <Typography variant="body1" gutterBottom>
                        Requested by: {request.requester?.name || 'Unknown'}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status)}
                          sx={{ fontSize: 16, height: 32 }}
                        />
                      </Box>
                      {request.location && request.location.coordinates && request.location.coordinates.length === 2 && (
                        <Box sx={{ mt: 2 }}>
                          <iframe
                            title="Request Location"
                            width="100%"
                            height="180"
                            frameBorder="0"
                            style={{ border: 0, borderRadius: 8 }}
                            src={`https://www.google.com/maps?q=${request.location.coordinates[1]},${request.location.coordinates[0]}&z=15&output=embed`}
                            allowFullScreen
                          ></iframe>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      {user.userType === 'commonUser' && request.status === 'pending' && (
                        <Button
                          size="large"
                          variant="contained"
                          color="primary"
                          sx={{ fontWeight: 700, fontSize: 18, px: 4, py: 1.5, borderRadius: 3 }}
                          onClick={() => handleAccept(request._id)}
                          disabled={request.donations?.some(d => d.donor === user.id)}
                        >
                          Accept
                        </Button>
                      )}
                      {user.userType === 'medicalUser' && request.status === 'pending' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input
                            type="number"
                            min={1}
                            max={request.unitsLeft}
                            value={unitsToDonate[request._id] || ''}
                            onChange={e => setUnitsToDonate({ ...unitsToDonate, [request._id]: e.target.value })}
                            style={{ width: 120, height: 48, padding: '0 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 18 }}
                            placeholder="Units"
                          />
                          <Button
                            size="large"
                            variant="contained"
                            color="primary"
                            sx={{ fontWeight: 700, fontSize: 18, px: 2, py: 1, borderRadius: 3, height: 48 }}
                            onClick={() => handleAccept(request._id)}
                          >
                            Donate
                          </Button>
                        </Box>
                      )}
                      {user.userType === 'medicalUser' &&
                        request.status === 'accepted' &&
                        request.requester._id === user.id && (
                          <Button
                            size="large"
                            variant="contained"
                            color="primary"
                            sx={{ fontWeight: 700, fontSize: 18, px: 4, py: 1.5, borderRadius: 3 }}
                            onClick={() => handleFulfill(request._id)}
                          >
                            Fulfill
                          </Button>
                        )}
                    </CardActions>
                  </Card>
                </Grid>
              ));
          })()}
        </Grid>
      </Box>
      {/* Blood Camps Section */}
      {bloodCamps.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#b71c1c' }}>
            Blood Camps
          </Typography>
          <Grid container spacing={3}>
            {bloodCamps.map((camp) => {
              // Check if user has donated to this camp or within 30 days
              let donated = false;
              let within30Days = false;
              if (user && user.userType === 'commonUser') {
                const userDonation = userCampDonations.find(d => d.camp === camp._id);
                if (userDonation) {
                  donated = true;
                  const donatedAt = new Date(userDonation.donatedAt);
                  const now = new Date();
                  const diffDays = (now - donatedAt) / (1000 * 60 * 60 * 24);
                  if (diffDays < 30) within30Days = true;
                }
              }
              return (
                <Grid item xs={12} sm={6} md={4} key={camp._id}>
                  <Card sx={{ borderTop: '6px solid #FFD600' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: '#FFD600',
                          mr: 1, border: '2px solid #fff', boxShadow: '0 0 4px #ccc'
                        }} />
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#FFD600' }}>
                          Blood Camp
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {camp.name}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Date: {camp.date}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Time: {camp.startTime} - {camp.endTime}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Location: {camp.location}, {camp.city}, {camp.state}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Contact: {camp.contactNumber}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Email: {camp.email}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Description: {camp.description}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Status: {camp.isActive ? 'Active' : 'Inactive'}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Created At: {new Date(camp.createdAt).toLocaleString()}
                      </Typography>
                      {user && user.userType === 'commonUser' && (
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ mt: 2, fontWeight: 700, fontSize: 18, px: 4, py: 1.5, borderRadius: 3 }}
                          disabled={donated || within30Days || campDonationStatus[camp._id] === 'success'}
                          onClick={() => handleCampDonate(camp._id)}
                        >
                          {donated ? 'Already Donated' : within30Days ? 'Wait 30 Days' : 'Donate'}
                        </Button>
                      )}
                      {campDonationStatus[camp._id] === 'success' && (
                        <Typography color="success.main" sx={{ mt: 1 }}>Thank you for your donation!</Typography>
                      )}
                      {campDonationStatus[camp._id] === 'error' && (
                        <Typography color="error.main" sx={{ mt: 1 }}>{error}</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default RequestList; 