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
  CircularProgress
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
      await axios.post(
        'http://localhost:5000/api/requests',
        { ...formData, location: locationToSend, hospitalName: formData.hospitalName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate('/requests');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create Blood Request
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
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
          {user.userType === 'medicalUser' && (
            <TextField
              fullWidth
              label="Hospital Name"
              name="hospitalName"
              value={formData.hospitalName}
              onChange={handleChange}
              margin="normal"
              required
            />
          )}
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Blood Type</InputLabel>
              <Select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                required
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
            <TextField
              fullWidth
              label="Units Required"
              name="units"
              type="number"
              value={formData.units}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography gutterBottom>Maximum Distance (km)</Typography>
              <Slider
                name="maxDistance"
                value={formData.maxDistance}
                onChange={handleSliderChange}
                min={1}
                max={50}
                step={1}
                valueLabelDisplay="auto"
              />
            </Box>
            <FormControl fullWidth margin="normal">
              <InputLabel>Urgency</InputLabel>
              <Select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                required
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              disabled={isLocating || (!formData.location && !(formData.manualLocation.latitude && formData.manualLocation.longitude))}
            >
              Create Request
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default RequestForm; 