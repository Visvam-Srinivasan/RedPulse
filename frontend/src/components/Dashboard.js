import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Grid, Card, CardContent, Chip, Alert } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const [reqRes, donRes] = await Promise.all([
          axios.get('http://localhost:5000/api/requests/my-requests', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get('http://localhost:5000/api/requests/my-donations', { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);
        
        setMyRequests(reqRes.data);
        setMyDonations(donRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Debug: Log the filtered pending requests
  useEffect(() => {
    if (myRequests.length > 0) {
      const pendingRequests = myRequests.filter(r => r.status === 'pending');
      console.log('Pending requests:', pendingRequests);
      console.log('All requests:', myRequests);
    }
  }, [myRequests]);

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
      </Box>
    </Container>
  );
};

export default Dashboard; 