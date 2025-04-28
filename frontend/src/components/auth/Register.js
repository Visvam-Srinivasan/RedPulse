import React, { useState, useEffect, useCallback } from 'react';
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
  Collapse,
  IconButton,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'commonUser',
    bloodType: '',
    phoneNumber: '',
    location: null,
    manualLocation: {
      latitude: '',
      longitude: '',
    },
  });
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const getLocation = useCallback(() => {
    console.log('Starting getLocation function...');

    const getPositionFromIP = async () => {
      try {
        console.log('Attempting IP-based geolocation...');
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        console.log('IP-based location data:', data);
        
        if (data.latitude && data.longitude) {
          setFormData(prevData => ({
            ...prevData,
            location: {
              latitude: data.latitude,
              longitude: data.longitude,
            },
          }));
          setLocationError('');
          setShowManualLocation(false);
        } else {
          throw new Error('No location data available from IP');
        }
      } catch (error) {
        console.error('IP-based geolocation error:', error);
        setLocationError('Unable to determine your location. Please enter it manually.');
        setShowManualLocation(true);
      }
    };

    if (typeof window === 'undefined' || !window.navigator || !window.navigator.geolocation) {
      console.log('Geolocation not supported, trying IP-based location');
      getPositionFromIP();
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    console.log('Attempting browser geolocation...');
    
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Browser geolocation success:', position);
        setFormData(prevData => ({
          ...prevData,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }));
        setLocationError('');
        setShowManualLocation(false);
      },
      async (error) => {
        console.error('Browser geolocation error:', error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access was denied. Please enable location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            console.log('Position unavailable, trying IP-based location');
            await getPositionFromIP();
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('Unable to get your location. Please enter it manually.');
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          // Don't show manual input if we're trying IP-based location
          return;
        }
        setShowManualLocation(true);
      },
      options
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('manualLocation.')) {
      const field = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        manualLocation: {
          ...prevData.manualLocation,
          [field]: value,
        },
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber || !formData.userType) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.userType === 'commonUser' && !formData.bloodType) {
      setError('Please select your blood type');
      return;
    }
    
    // Use manual location if automatic location failed
    if (!formData.location && formData.manualLocation.latitude && formData.manualLocation.longitude) {
      formData.location = {
        latitude: parseFloat(formData.manualLocation.latitude),
        longitude: parseFloat(formData.manualLocation.longitude),
      };
    }

    // Log the data being sent
    console.log('Submitting registration data:', {
      ...formData,
      password: '***' // Don't log the actual password
    });

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      console.log('Registration successful:', res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setRegistrationSuccess(true);
      setError('');
    } catch (err) {
      console.error('Registration error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 400) {
          setError(err.response.data.message || 'Invalid input data. Please check your information.');
        } else if (err.response.status === 409) {
          setError('An account with this email already exists. Please login instead.');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(err.response.data.message || 'An error occurred during registration');
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred while setting up the request');
      }
    }
  };

  const handleLocationPrompt = () => {
    setShowLocationPrompt(false);
    getLocation();
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, overflow: 'visible' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Register
          </Typography>
          
          {showLocationPrompt && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={handleLocationPrompt}
                >
                  Allow
                </Button>
              }
            >
              <Typography variant="body2">
                To help match you with nearby blood donation requests, we need your location. 
                Please allow location access when prompted by your browser.
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {locationError && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <IconButton
                  aria-label="try again"
                  color="inherit"
                  size="small"
                  onClick={getLocation}
                >
                  <MyLocationIcon />
                </IconButton>
              }
            >
              {locationError}
            </Alert>
          )}
          {registrationSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Registration successful! 
              <Button variant="outlined" color="primary" onClick={() => navigate('/requests/new')} sx={{ ml: 2 }}>
                Request Blood
              </Button>
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" sx={{ mb: 2, position: 'relative', zIndex: 2 }}>
              <InputLabel id="user-type-label">User Type</InputLabel>
              <Select
                labelId="user-type-label"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      position: 'absolute',
                      zIndex: 3
                    }
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  }
                }}
              >
                <MenuItem value="commonUser">Donor</MenuItem>
                <MenuItem value="medicalUser">Medical Institution</MenuItem>
              </Select>
            </FormControl>
            {formData.userType === 'commonUser' && (
              <FormControl fullWidth margin="normal" sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
                <InputLabel id="blood-type-label">Blood Type</InputLabel>
                <Select
                  labelId="blood-type-label"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  required
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        position: 'absolute',
                        zIndex: 3
                      }
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    }
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
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button
                startIcon={<LocationOnIcon />}
                onClick={() => setShowManualLocation(!showManualLocation)}
                color="primary"
              >
                {showManualLocation ? 'Hide Manual Location' : 'Enter Location Manually'}
              </Button>
            </Box>

            <Collapse in={showManualLocation}>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Latitude"
                  name="manualLocation.latitude"
                  value={formData.manualLocation.latitude}
                  onChange={handleChange}
                  margin="normal"
                  type="number"
                  inputProps={{ step: "0.000001" }}
                />
                <TextField
                  fullWidth
                  label="Longitude"
                  name="manualLocation.longitude"
                  value={formData.manualLocation.longitude}
                  onChange={handleChange}
                  margin="normal"
                  type="number"
                  inputProps={{ step: "0.000001" }}
                />
              </Box>
            </Collapse>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
            >
              Register
            </Button>
          </form>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Button
                color="primary"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 