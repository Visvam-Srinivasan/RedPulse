import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Chip,
  Skeleton,
  Fade,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const RequestList = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const { user } = useAuth();

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const showSnackbar = (message, severity = 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const endpoint = user.userType === 'commonUser'
        ? 'http://localhost:5000/api/requests/nearby'
        : 'http://localhost:5000/api/requests/all';
      
      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!Array.isArray(res.data)) {
        throw new Error('Invalid response format');
      }

      setRequests(res.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      showSnackbar(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      if (user.userType === 'medicalUser') {
        const units = parseInt(unitsToDonate[requestId], 10);
        if (!units || units < 1) {
          showSnackbar('Please enter a valid number of units to donate.', 'warning');
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
      showSnackbar('Request accepted successfully!', 'success');
      fetchRequests();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to accept request';
      showSnackbar(errorMessage);
    }
  };

  const handleFulfill = async (requestId) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.post(
        `http://localhost:5000/api/requests/${requestId}/fulfill`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showSnackbar('Request fulfilled successfully!', 'success');
      fetchRequests();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fulfill request';
      showSnackbar(errorMessage);
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

  const renderSkeleton = () => (
    <Grid container spacing={3}>
      {[1, 2, 3].map((i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="rectangular" height={180} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Fade in={fadeIn} timeout={2000}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4,
            background: 'transparent',
            borderRadius: 2,
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              textAlign: 'center'
            }}
          >
            Blood Requests
          </Typography>
        </Paper>
      </Fade>

      {loading ? (
        renderSkeleton()
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {(() => {
            const filteredRequests = requests
              .filter(request => request.requester?._id !== user?.id)
              .filter(request => request.unitsLeft > 0)
              .filter(request => !request.donations?.some(d => d.donor === user?.id));

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
                          {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1)} Urgency
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Blood Type: {request.bloodType || 'Not specified'}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Units Required: {request.totalUnits || 0} (Left: {request.unitsLeft || 0})
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Distance: {request.maxDistance || 0} km
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
                          label={request.status || 'Unknown'}
                          color={getStatusColor(request.status)}
                          sx={{ fontSize: 16, height: 32 }}
                        />
                      </Box>
                      {request.location?.coordinates?.length === 2 && (
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
                      {user?.userType === 'commonUser' && request.status === 'pending' && (
                        <Button
                          size="large"
                          variant="contained"
                          color="primary"
                          sx={{ fontWeight: 700, fontSize: 18, px: 4, py: 1.5, borderRadius: 3 }}
                          onClick={() => handleAccept(request._id)}
                          disabled={request.donations?.some(d => d.donor === user?.id)}
                        >
                          Accept
                        </Button>
                      )}
                      {user?.userType === 'medicalUser' && request.status === 'pending' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input
                            type="number"
                            min={1}
                            max={request.unitsLeft}
                            value={unitsToDonate[request._id] || ''}
                            onChange={e => setUnitsToDonate({ ...unitsToDonate, [request._id]: e.target.value })}
                            style={{ width: 60, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                            placeholder="Units"
                          />
                          <Button
                            size="large"
                            variant="contained"
                            color="primary"
                            sx={{ fontWeight: 700, fontSize: 18, px: 2, py: 1, borderRadius: 3 }}
                            onClick={() => handleAccept(request._id)}
                          >
                            Donate
                          </Button>
                        </Box>
                      )}
                      {user?.userType === 'medicalUser' &&
                        request.status === 'accepted' &&
                        request.requester._id === user?.id && (
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
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RequestList; 