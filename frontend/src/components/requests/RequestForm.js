import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  CircularProgress,
  Skeleton,
  Fade,
  Grid
} from '@mui/material';
import axios from 'axios';

const user = JSON.parse(localStorage.getItem('user'));

const RequestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bloodType: '',
    units: 1,
    maxDistance: 10,
    urgency: 'medium',
    notes: '',
    location: null,
    manualLocation: { latitude: '', longitude: '' },
    hospitalName: '',
  });
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [fetchingRegistered, setFetchingRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const getLocation = () => {
    setIsLocating(true);
    setLocationError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocation success:', position);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            setFormData(prev => ({
              ...prev,
              location: {
                latitude: lat,
                longitude: lng,
              },
            }));
            setIsLocating(false);
            setLocationError('');
            setShowManual(false);
          } else {
            setLocationError('Invalid coordinates received from geolocation.');
            setIsLocating(false);
            setShowManual(true);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          let msg = error.message || 'Unable to retrieve your location.';
          if (error.code === 2) {
            msg = 'Unable to determine your location automatically. Please enter your latitude and longitude manually.';
          }
          setLocationError(msg);
          setIsLocating(false);
          setShowManual(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      setShowManual(true);
    }
  };

  const useRegisteredLocation = async () => {
    setFetchingRegistered(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = res.data;
      if (user.location && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
        setFormData(prev => ({
          ...prev,
          location: {
            latitude: user.location.coordinates[1],
            longitude: user.location.coordinates[0],
          },
        }));
        setLocationError('');
        setShowManual(false);
      } else {
        setError('No registered location found in your profile.');
      }
    } catch (err) {
      setError('Failed to fetch registered location.');
    } finally {
      setFetchingRegistered(false);
    }
  };

  useEffect(() => {
    getLocation();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      manualLocation: {
        ...prev.manualLocation,
        [name]: value,
      },
    }));
  };

  const handleSliderChange = (e, newValue) => {
    setFormData({ ...formData, [e.target.name]: newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let locationToSend = formData.location;
    if (!locationToSend && formData.manualLocation.latitude && formData.manualLocation.longitude) {
      locationToSend = {
        latitude: parseFloat(formData.manualLocation.latitude),
        longitude: parseFloat(formData.manualLocation.longitude),
      };
    }
    if (!locationToSend) {
      setError('Location is required');
      return;
    }
    if (user.userType === 'medicalUser' && !formData.hospitalName) {
      setError('Hospital name is required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const requestData = {
        bloodType: formData.bloodType,
        totalUnits: parseInt(formData.units, 10),
        unitsLeft: parseInt(formData.units, 10),
        maxDistance: parseInt(formData.maxDistance, 10),
        urgency: formData.urgency,
        notes: formData.notes,
        location: {
          type: 'Point',
          coordinates: [parseFloat(locationToSend.longitude), parseFloat(locationToSend.latitude)]
        },
        hospitalName: formData.hospitalName,
        requesterType: user.userType
      };
      
      console.log('Sending request data:', requestData);
      
      await axios.post(
        'http://localhost:5000/api/requests',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating request:', err);
      setError(err.response?.data?.message || 'An error occurred while creating the request');
    }
  };

  const renderSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Skeleton animation="wave" height={40} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={56} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={56} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={56} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={56} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={56} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={56} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={56} sx={{ mb: 2 }} animationDuration={2} />
      <Skeleton animation="wave" height={40} animationDuration={2} />
    </Box>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Fade in={fadeIn} timeout={2000}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              background: '#fff',
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              align="center"
              sx={{ 
                color: 'primary.main',
                fontWeight: 700,
                mb: 3
              }}
            >
              Create Blood Request
            </Typography>
            {error && (
              <Fade in={fadeIn} timeout={2000}>
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateX(5px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}
            {locationError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {locationError}
                <Button size="small" sx={{ ml: 2 }} onClick={getLocation}>
                  Retry
                </Button>
              </Alert>
            )}
            {isLocating && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <CircularProgress size={24} />
                <Typography sx={{ ml: 2 }}>Detecting your location...</Typography>
              </Box>
            )}
            {formData.location && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Location detected: Latitude {formData.location.latitude}, Longitude {formData.location.longitude}
              </Alert>
            )}
            {showManual && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Enter your location manually:
                </Typography>
                <TextField
                  fullWidth
                  label="Latitude"
                  name="latitude"
                  value={formData.manualLocation.latitude}
                  onChange={handleManualChange}
                  margin="normal"
                  type="number"
                  inputProps={{ step: "0.000001" }}
                />
                <TextField
                  fullWidth
                  label="Longitude"
                  name="longitude"
                  value={formData.manualLocation.longitude}
                  onChange={handleManualChange}
                  margin="normal"
                  type="number"
                  inputProps={{ step: "0.000001" }}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ mt: 1 }}
                  onClick={useRegisteredLocation}
                  disabled={fetchingRegistered}
                >
                  {fetchingRegistered ? 'Fetching...' : 'Use Registered Location'}
                </Button>
              </Box>
            )}
            {loading ? (
              renderSkeleton()
            ) : (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Blood Type</InputLabel>
                      <Select
                        name="bloodType"
                        value={formData.bloodType}
                        onChange={handleChange}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        <MenuItem value="A+">A+</MenuItem>
                        <MenuItem value="A-">A-</MenuItem>
                        <MenuItem value="B+">B+</MenuItem>
                        <MenuItem value="B-">B-</MenuItem>
                        <MenuItem value="AB+">AB+</MenuItem>
                        <MenuItem value="AB-">AB-</MenuItem>
                        <MenuItem value="O+">O+</MenuItem>
                        <MenuItem value="O-">O-</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Units Required"
                      name="units"
                      type="number"
                      value={formData.units}
                      onChange={handleChange}
                      required
                      inputProps={{ min: 1 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Urgency</InputLabel>
                      <Select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleChange}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      multiline
                      rows={4}
                      value={formData.notes}
                      onChange={handleChange}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  </Grid>
                  {user.userType === 'medicalUser' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Hospital Name"
                        name="hospitalName"
                        value={formData.hospitalName}
                        onChange={handleChange}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: 'primary.main',
                          },
                        }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      Maximum Distance (km): {formData.maxDistance}
                    </Typography>
                    <Slider
                      name="maxDistance"
                      value={formData.maxDistance}
                      onChange={handleSliderChange}
                      min={1}
                      max={100}
                      step={1}
                      sx={{
                        color: 'primary.main',
                        '& .MuiSlider-thumb': {
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 8px rgba(211, 47, 47, 0.16)',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                      sx={{ 
                        mt: 3, 
                        mb: 2,
                        py: 1.5,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        }
                      }}
                    >
                      Create Request
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </Paper>
        </Fade>
      </Box>
    </Container>
  );
};

export default RequestForm; 