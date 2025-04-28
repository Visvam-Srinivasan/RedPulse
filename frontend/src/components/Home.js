import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper, Grid, Card, CardContent } from '@mui/material';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const galleryImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd23?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
];

const features = [
  {
    icon: <VolunteerActivismIcon color="primary" sx={{ fontSize: 40 }} />, 
    title: 'Donate Blood',
    description: 'Register as a donor and help save lives by making yourself available for blood donation requests.'
  },
  {
    icon: <AddCircleOutlineIcon color="error" sx={{ fontSize: 40 }} />, 
    title: 'Request Blood',
    description: 'Easily request blood for yourself or your institution and get matched with nearby donors.'
  },
  {
    icon: <SearchIcon color="secondary" sx={{ fontSize: 40 }} />, 
    title: 'Find Nearby Donors',
    description: 'Our app uses your location to match you with donors or requests in your area.'
  },
  {
    icon: <LocalHospitalIcon color="action" sx={{ fontSize: 40 }} />, 
    title: 'Medical Institutions',
    description: 'Medical users can manage requests, track fulfillment, and connect with the donor community.'
  }
];

const Home = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="md" sx={{ flex: 1 }}>
        <Box sx={{ mt: 10, display: 'flex', justifyContent: 'center' }}>
          <Paper elevation={4} sx={{ p: 6, textAlign: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <BloodtypeIcon color="error" sx={{ fontSize: 48, mr: 1 }} />
              <Typography variant="h3" component="h1" fontWeight={700} color="primary">
                Blood Donation App
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Welcome! Save lives by donating or requesting blood in your community.
            </Typography>
            {/* Gallery */}
            <Box sx={{ display: 'flex', overflowX: 'auto', mb: 4, gap: 2, py: 2, justifyContent: 'center' }}>
              {galleryImages.map((img, idx) => (
                <Box key={idx} sx={{ minWidth: 220, maxWidth: 240, flex: '0 0 auto', borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
                  <img src={img} alt={`gallery-${idx}`} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                </Box>
              ))}
            </Box>
            {/* Features */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {features.map((feature, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Card elevation={2} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ mr: 2 }}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Paper>
        </Box>
      </Container>
      {/* Footer */}
      <Box sx={{ mt: 6, py: 3, bgcolor: 'grey.100', textAlign: 'center' }} component="footer">
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} Blood Donation App. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Home; 