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
        : 'http://localhost:5000/api/requests';
      
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
      await axios.post(
        `http://localhost:5000/api/requests/${requestId}/accept`,
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
              .filter(request => request.units > 0)
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
                        Units Required: {request.units}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Distance: {request.maxDistance} km
                      </Typography>
                      {request.notes && (
                        <Typography variant="body1" gutterBottom>
                          Notes: {request.notes}
                        </Typography>
                      )}
                      {request.hospitalName && (
                        <Typography variant="body1" gutterBottom>
                          Hospital Name: {request.hospitalName}
                        </Typography>
                      )}
                      <Typography variant="body1" gutterBottom>
                        Requested by: {request.requester?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Units Left: {request.units} / {request.totalUnits || request.units}
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
    </Container>
  );
};

export default RequestList; 