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
  Fade,
  Skeleton
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      login(res.data.user, res.data.token);
      setFadeOut(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
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
        '& .third-overlay': {
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
          animationDelay: '1.5s',
          zIndex: 3
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
      
      <Container maxWidth="xs" sx={{ 
        position: 'relative', 
        zIndex: 10,
        mt: -4
      }}>
        <Box sx={{ 
          mb: 4,
          mx: 'auto',
          width: '100%',
          maxWidth: '360px'
        }}>
          <Fade in={fadeIn && !fadeOut} timeout={2000}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
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
                Login
              </Typography>
              {error && (
                <Fade in={fadeIn && !fadeOut} timeout={2000}>
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
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
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
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
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
                  Login
                </Button>
              </form>
            </Paper>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
};

export default Login; 