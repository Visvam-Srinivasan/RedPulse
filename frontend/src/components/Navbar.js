import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { user, logout: authLogout } = useAuth();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  return (

    <AppBar 
      position="static" 
      sx={{ 
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          '& .MuiToolbar-root': {
            minHeight: '90px',
            transition: 'all 0.3s ease-in-out',
            '& .MuiButton-root': {
              fontSize: '1.1rem',
              padding: '6px 12px',
              transition: 'all 0.3s ease-in-out'
            },
            '& .MuiTypography-root': {
              fontSize: '1.5rem',
              transition: 'all 0.3s ease-in-out'
            },
            '& .MuiSvgIcon-root': {
              fontSize: '2.2rem',
              transition: 'all 0.3s ease-in-out'
            },
            '& .MuiChip-root': {
              height: '34px',
              '& .MuiChip-label': {
                fontSize: '0.95rem',
                transition: 'all 0.3s ease-in-out'
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.3rem',
                transition: 'all 0.3s ease-in-out'
              }
            }
          }
        }
      }}
    >
      <Toolbar sx={{ 
        minHeight: '64px',
        transition: 'all 0.3s ease-in-out',
        '& .MuiButton-root': {
          fontSize: '1rem',
          transition: 'all 0.3s ease-in-out'
        },
        '& .MuiTypography-root': {
          fontSize: '1.25rem',
          transition: 'all 0.3s ease-in-out'
        },
        '& .MuiSvgIcon-root': {
          fontSize: '2rem',
          transition: 'all 0.3s ease-in-out'
        },
        '& .MuiChip-root': {
          height: '32px',
          '& .MuiChip-label': {
            fontSize: '0.875rem',
            transition: 'all 0.3s ease-in-out'
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
            transition: 'all 0.3s ease-in-out'
          }
        }
      }}>
        <BloodtypeIcon color="error" sx={{ fontSize: 36, mr: 1, cursor: 'pointer' }} onClick={() => navigate('/')} />

        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 700 }}
          onClick={() => (user ? navigate('/dashboard') : navigate('/'))}
        >
          Blood Donation App
          {user && (
            <>
              <Chip
                icon={user.userType === 'medicalUser' ? <LocalHospitalIcon /> : <BloodtypeIcon />}
                label={user.userType === 'medicalUser' ? 'Medical Institution' : 'Donor'}
                color={user.userType === 'medicalUser' ? 'secondary' : 'error'}
                size="small"
                sx={{ ml: 2, fontWeight: 600 }}
              />
              <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 22, color: '#FFD600' }}>
                | Welcome! {user.name}
              </span>
            </>
          )}
        </Typography>
        {user ? (
          <>
            <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ '&:hover': { backgroundColor: '#f8bbd0', color: '#b71c1c' } }}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => navigate('/history')} sx={{ '&:hover': { backgroundColor: '#f8bbd0', color: '#b71c1c' } }}>
              History
            </Button>
            {user.userType === 'medicalUser' && (
              <Button color="inherit" onClick={() => navigate('/requests/new')} >
                New Request
              </Button>
            )}
            <Button color="inherit" onClick={() => navigate('/requests')}>
              Requests
            </Button>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 