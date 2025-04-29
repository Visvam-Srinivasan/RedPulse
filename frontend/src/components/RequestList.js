import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid,
  Fade,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const RequestList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url("./layer1.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        animation: 'slideUp 1s ease-out forwards',
        animationDelay: '0.2s',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("./layer2.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'slideUp 1s ease-out forwards',
          animationDelay: '0.5s',
          zIndex: 1
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("./layer3.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'slideUp 1s ease-out forwards',
          animationDelay: '1s',
          zIndex: 2
        },
        '@keyframes slideUp': {
          '0%': {
            top: '80%',
            opacity: 0
          },
          '100%': {
            top: 0,
            opacity: 1
          }
        }
      }}
    >
      <Container maxWidth="lg" sx={{ 
        position: 'relative', 
        zIndex: 10,
        mt: -8,
        pt: 4
      }}>
        <Fade in={fadeIn} timeout={2000}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.5s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    Blood Requests
                  </Typography>
                  {loading ? (
                    <Typography>Loading...</Typography>
                  ) : error ? (
                    <Typography color="error">{error}</Typography>
                  ) : requests.length === 0 ? (
                    <Typography>No requests found</Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {requests.map((request) => (
                        <Grid item xs={12} md={6} key={request._id}>
                          <Card 
                            sx={{ 
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(10px)',
                              transition: 'all 0.3s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                              }
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6">{request.bloodType} Blood Needed</Typography>
                              <Typography>Units Required: {request.unitsRequired}</Typography>
                              <Typography>Status: {request.status}</Typography>
                              <Typography>Location: {request.location}</Typography>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate(`/requests/${request._id}`)}
                                sx={{ mt: 2 }}
                              >
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Fade>
      </Container>
    </Box>
  );
};

export default RequestList; 