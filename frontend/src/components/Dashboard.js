import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [bloodCamps, setBloodCamps] = useState([]);
  const [totalUnitsByBloodGroup, setTotalUnitsByBloodGroup] = useState({});
  const [showDonations, setShowDonations] = useState({});
  const [campDonations, setCampDonations] = useState({});

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

  const handleViewDonations = async (campId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/blood-camps/${campId}/donations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampDonations(prev => ({ ...prev, [campId]: res.data }));
      setShowDonations(prev => ({ ...prev, [campId]: !prev[campId] }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donations');
    }
  };

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
        
        console.log('Fetched requests:', reqRes.data);
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
    }
  }, [myRequests, user]);

  // Redirect to home if not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

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
        mt: -8,  // Move container up
        pt: 4     // Add some padding at the top
      }}>
        <Fade in={fadeIn} timeout={2000}>
          <Grid container spacing={3}>
            {/* User Information Card */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
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
                  {renderUserIcon()}
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        color: 'primary.dark'
                      }
                    }}
                  >
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
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            color: 'primary.main',
                            transform: 'translateX(5px)'
                          },
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
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            color: 'primary.main',
                            transform: 'translateX(5px)'
                          },
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
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              color: 'primary.main',
                              transform: 'translateX(5px)'
                            },
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
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions Card */}
            <Grid item xs={12} md={6}>
              <Fade in={fadeIn} timeout={3000}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 1s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }}
                    >
                      Quick Actions
                    </Typography>
                    <Box sx={{ mt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                      {user?.userType === 'commonUser' && (
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ 
                            mb: 2,
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                              backgroundColor: 'primary.dark'
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
                        sx={{ 
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            backgroundColor: 'primary.light',
                            color: 'white'
                          }
                        }}
                        onClick={() => navigate('/requests')}
                      >
                        View Requests
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            {/* Pending Requests Card */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  height: '100%',
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
                          mb: 2,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            color: 'primary.dark',
                            borderColor: 'primary.dark'
                          }
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
            </Grid>
          </Grid>
        </Fade>
      </Container>
    </Box>
  );
};

export default Dashboard; 