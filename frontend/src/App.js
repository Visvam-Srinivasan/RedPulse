import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import RequestList from './components/requests/RequestList';
import RequestForm from './components/requests/RequestForm';
import History from './components/History';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#b71c1c',
      light: '#f05545',
      dark: '#7f0000',
    },
    secondary: {
      main: '#f8bbd0',
      light: '#ffeeff',
      dark: '#c48b9f',
    },
    background: {
      default: '#fff5f5',
      paper: '#ffffff',
    },
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fff5f5',
          backgroundImage: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    background: {
      default: '#fff5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fff5f5',
        },
      },
    },
  },
});

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/requests" element={<RequestList />} />
            <Route path="/requests/new" element={<RequestForm />} />
            <Route path="/history" element={<History />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 