import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Grid, Card, CardContent, Chip, Alert } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bloodCamps, setBloodCamps] = useState([]);
  const [campDonations, setCampDonations] = useState({});
  const [showDonations, setShowDonations] = useState({});
  const [totalUnitsByBloodGroup, setTotalUnitsByBloodGroup] = useState({});

  // Always call hooks at the top level
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const [reqRes] = await Promise.all([
          axios.get('http://localhost:5000/api/requests/my-requests', { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);
        setMyRequests(reqRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (myRequests.length > 0) {
      const pendingRequests = myRequests.filter(r => r.status === 'pending');
      console.log('Pending requests:', pendingRequests);
      console.log('All requests:', myRequests);
    }
  }, [user, myRequests]);

  useEffect(() => {
    if (!user || user.userType !== 'medicalUser') return;
    const fetchCamps = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/requests/blood-camps', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBloodCamps(res.data);
        let allDonations = [];
        for (const camp of res.data) {
          try {
            const dRes = await axios.get(`http://localhost:5000/api/requests/blood-camps/${camp._id}/donations`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            allDonations = allDonations.concat(dRes.data);
          } catch (err) {
            // Ignore errors for now
          }
        }
        const totals = {};
        for (const donation of allDonations) {
          const bg = donation.bloodType;
          totals[bg] = (totals[bg] || 0) + 1;
        }
        setTotalUnitsByBloodGroup(totals);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCamps();
  }, [user]);

  // Handler to fetch and toggle donations for a camp
  const handleViewDonations = async (campId) => {
    setShowDonations((prev) => ({ ...prev, [campId]: !prev[campId] }));
    if (!campDonations[campId]) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/requests/blood-camps/${campId}/donations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCampDonations((prev) => ({ ...prev, [campId]: res.data }));
      } catch (err) {
        setCampDonations((prev) => ({ ...prev, [campId]: [] }));
      }
    }
  };

  // Now safe to return conditionally
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.name}!
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Information
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Email: {user?.email}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  User Type: {user?.userType === 'medicalUser' ? 'Medical Institution' : 'Donor'}
                </Typography>
                {user?.bloodType && (
                  <Typography color="textSecondary" gutterBottom>
                    Blood Type: {user?.bloodType}
                  </Typography>
                )}
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={user?.userType === 'medicalUser' ? <LocalHospitalIcon /> : <BloodtypeIcon />}
                    label={user?.userType === 'medicalUser' ? 'Medical Institution' : 'Donor'}
                    color="primary"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {user?.userType === 'commonUser' && (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mb: 2 }}
                      onClick={() => navigate('/requests/new')}
                    >
                      Request Blood
                    </Button>
                  )}
                  {user?.userType === 'medicalUser' && (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mb: 2 }}
                      onClick={() => navigate('/blood-camp/new')}
                    >
                      Set Blood Camp
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={() => navigate('/requests')}
                  >
                    View Requests
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Requests
                </Typography>
                {loading ? (
                  <Typography>Loading...</Typography>
                ) : myRequests.length === 0 ? (
                  <Typography color="text.secondary">No requests yet.</Typography>
                ) : myRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <Typography color="text.secondary">No pending requests.</Typography>
                ) : (
                  myRequests
                    .filter(r => r.status === 'pending')
                    .map((req, idx) => {
                      console.log('Rendering request:', req); // Debug log
                      return (
                        <Box key={req._id || idx} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <AddCircleOutlineIcon color="error" sx={{ mr: 1 }} />
                            <Typography fontWeight={600}>
                              Request for: {req.bloodType} | Total Units: {req.totalUnits} | Units Left: {req.unitsLeft}
                            </Typography>
                          </Box>
                          <Typography variant="body2">Status: {req.status}</Typography>
                          {req.donations && req.donations.length > 0 && (
                            <Typography variant="body2">
                              Donations: {req.donations.length}
                            </Typography>
                          )}
                        </Box>
                      );
                    })
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {/* Show blood camps for medical users */}
        {user?.userType === 'medicalUser' && bloodCamps.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>My Blood Camps</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total Units Collected by Blood Group:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                {Object.keys(totalUnitsByBloodGroup).length === 0 ? (
                  <Typography color="text.secondary">No donations yet.</Typography>
                ) : (
                  Object.entries(totalUnitsByBloodGroup).map(([bg, count]) => (
                    <Chip key={bg} label={`${bg}: ${count}`} color="primary" sx={{ fontSize: 16, height: 32 }} />
                  ))
                )}
              </Box>
            </Box>
            {bloodCamps.map((camp) => (
              <Card key={camp._id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{camp.name}</Typography>
                  <Typography>Date: {camp.date}</Typography>
                  <Typography>Time: {camp.startTime} - {camp.endTime}</Typography>
                  <Typography>Location: {camp.location}, {camp.city}, {camp.state}</Typography>
                  <Typography>Contact: {camp.contactNumber}</Typography>
                  <Typography>Email: {camp.email}</Typography>
                  <Typography>Description: {camp.description}</Typography>
                  <Typography>Status: {camp.isActive ? 'Active' : 'Inactive'}</Typography>
                  <Typography>Created At: {new Date(camp.createdAt).toLocaleString()}</Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 2, mb: 1 }}
                    onClick={() => handleViewDonations(camp._id)}
                  >
                    {showDonations[camp._id] ? 'Hide Donations' : 'View Donations'}
                  </Button>
                  {showDonations[camp._id] && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Donations:</Typography>
                      {campDonations[camp._id] && campDonations[camp._id].length > 0 ? (
                        campDonations[camp._id].map((donation, idx) => (
                          <Box key={donation._id || idx} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 2 }}>
                            <Typography>Name: {donation.donor?.name || 'Unknown'}</Typography>
                            <Typography>Email: {donation.donor?.email || 'Unknown'}</Typography>
                            <Typography>Blood Type: {donation.bloodType}</Typography>
                            <Typography>Donated At: {new Date(donation.donatedAt).toLocaleString()}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography color="text.secondary">No donations yet.</Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard; 