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
  Paper
} from '@mui/material';
import axios from 'axios';

const RequestList = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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

  const renderSkeleton = () => (
    <Grid container spacing={3}>
      {[1, 2, 3].map((index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ 
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            }
          }}>
            <CardContent>
              <Skeleton animation="wave" height={40} sx={{ mb: 2 }} animationDuration={2} />
              <Skeleton animation="wave" height={30} sx={{ mb: 1 }} animationDuration={2} />
              <Skeleton animation="wave" height={30} sx={{ mb: 1 }} animationDuration={2} />
              <Skeleton animation="wave" height={30} sx={{ mb: 1 }} animationDuration={2} />
              <Skeleton animation="wave" height={30} sx={{ mb: 2 }} animationDuration={2} />
              <Skeleton animation="wave" height={180} animationDuration={2} />
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
      {error && (
        <Fade in={fadeIn} timeout={2000}>
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        </Fade>
      )}
      <Fade in={fadeIn} timeout={2000}>
        <Box>
          {loading ? (
            renderSkeleton()
          ) : (
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
                      <Card sx={{ 
                        borderTop: `6px solid ${urgencyColor[request.urgency] || '#bdbdbd'}`,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        }
                      }}>
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
                              sx={{ 
                                fontSize: 16, 
                                height: 32,
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                }
                              }}
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
                              sx={{
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                }
                              }}
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
                                style={{ width: 60, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                                placeholder="Units"
                              />
                              <Button
                                size="large"
                                variant="contained"
                                color="primary"
                                sx={{
                                  transition: 'all 0.3s ease-in-out',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                  }
                                }}
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
                                sx={{
                                  transition: 'all 0.3s ease-in-out',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                  }
                                }}
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
        </Box>
      </Fade>
    </Container>
  );
};

export default RequestList; 