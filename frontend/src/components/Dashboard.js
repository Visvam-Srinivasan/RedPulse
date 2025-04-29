import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Alert,
  Skeleton,
  Fade,
  Paper
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
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
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const renderSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Skeleton animation="wave" height={40} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={30} sx={{ mb: 1 }} animationDuration={2} />
      <Skeleton animation="wave" height={30} sx={{ mb: 1 }} animationDuration={2} />
      <Skeleton animation="wave" height={30} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={40} width="60%" animationDuration={2} />
    </Box>
  );

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

  const renderUserIcon = () => {
    if (user?.userType === 'medicalUser') {
      return (
        <BusinessIcon 
          sx={{ 
            fontSize: 120,
            color: 'primary.main',
            opacity: 0.1,
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)'
          }} 
        />
      );
    }
    return (
      <AccountCircleIcon 
        sx={{ 
          fontSize: 120,
          color: 'primary.main',
          opacity: 0.1,
          position: 'absolute',
          left: 20,
          top: '50%',
          transform: 'translateY(-50%)'
        }} 
      />
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Fade in={fadeIn} timeout={2000}>
              <Card 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {renderUserIcon()}
                  <Typography variant="h6" gutterBottom>
                    User Information
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 2,
                    position: 'relative',
                    minHeight: '180px',
                    width: '100%',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      ml: 16,
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 2,
                      width: '100%',
                      pr: 3,
                      position: 'relative',
                      left: '30px'
                    }}>
                      <Typography 
                        color="textSecondary" 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          '&:before': {
                            content: '"•"',
                            color: 'primary.main',
                            mr: 1
                          }
                        }}
                      >
                        Email: {user?.email}
                      </Typography>
                      <Typography 
                        color="textSecondary"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          '&:before': {
                            content: '"•"',
                            color: 'primary.main',
                            mr: 1
                          }
                        }}
                      >
                        User Type: {user?.userType === 'medicalUser' ? 'Medical Institution' : 'Donor'}
                      </Typography>
                      {user?.bloodType && (
                        <Typography 
                          color="textSecondary"
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            '&:before': {
                              content: '"•"',
                              color: 'primary.main',
                              mr: 1
                            }
                          }}
                        >
                          Blood Type: {user?.bloodType}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      icon={user?.userType === 'medicalUser' ? <BusinessIcon /> : <BloodtypeIcon />}
                      label={user?.userType === 'medicalUser' ? 'Medical Institution' : 'Donor'}
                      color="primary"
                      sx={{ 
                        '&:hover': {
                          transform: 'scale(1.05)',
                          transition: 'transform 0.2s ease-in-out'
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Fade in={fadeIn} timeout={2000}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {loading ? (
                    renderSkeleton()
                  ) : (
                    <>
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          color: 'primary.main',
                          fontWeight: 'bold',
                          borderBottom: '2px solid',
                          borderColor: 'primary.main',
                          pb: 1,
                          mb: 2
                        }}
                      >
                        Quick Actions
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {user?.userType === 'commonUser' && (
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            startIcon={<AddCircleOutlineIcon />}
                            sx={{ 
                              transition: 'all 0.3s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                              }
                            }}
                            onClick={() => navigate('/requests/new')}
                          >
                            Request Blood
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          startIcon={<VolunteerActivismIcon />}
                          sx={{ 
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }
                          }}
                          onClick={() => navigate('/requests')}
                        >
                          View Requests
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12}>
            <Fade in={fadeIn} timeout={2000}>
              <Card sx={{ 
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                }
              }}>
                <CardContent>
                  {loading ? (
                    renderSkeleton()
                  ) : (
                    <>
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          color: 'primary.main',
                          fontWeight: 'bold',
                          borderBottom: '2px solid',
                          borderColor: 'primary.main',
                          pb: 1,
                          mb: 2
                        }}
                      >
                        Pending Requests
                      </Typography>
                      {myRequests.length === 0 ? (
                        <Typography color="text.secondary">No requests yet.</Typography>
                      ) : myRequests.filter(r => r.status === 'pending').length === 0 ? (
                        <Typography color="text.secondary">No pending requests.</Typography>
                      ) : (
                        myRequests
                          .filter(r => r.status === 'pending')
                          .map((req, idx) => (
                            <Box 
                              key={req._id || idx} 
                              sx={{ 
                                mb: 2, 
                                p: 2, 
                                border: '1px solid #eee', 
                                borderRadius: 2,
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'translateX(5px)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                }
                              }}
                            >
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
                          ))
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 