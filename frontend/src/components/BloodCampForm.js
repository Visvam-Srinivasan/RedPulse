import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Grid, Switch, FormControlLabel } from '@mui/material';
import axios from 'axios';

const BloodCampForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    city: '',
    state: '',
    contactNumber: '',
    email: '',
    description: '',
    isActive: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/requests/blood-camps', {
        ...formData,
        createdAt: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Blood camp created successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while creating the blood camp');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Set Up Blood Camp
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Camp Name" name="name" value={formData.name} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Date" name="date" type="date" value={formData.date} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth label="Start Time" name="startTime" type="time" value={formData.startTime} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth label="End Time" name="endTime" type="time" value={formData.endTime} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Location" name="location" value={formData.location} onChange={handleChange} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="State" name="state" value={formData.state} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleChange} multiline rows={3} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={formData.isActive} onChange={handleChange} name="isActive" />}
                  label="Active"
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
              Create Blood Camp
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default BloodCampForm; 